import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Loader2, PlusCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { useWindowSize } from "@uidotdev/usehooks";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { askQuestion, addLocalQuestion } from "@/app/actions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatInterface() {
  const dispatch = useDispatch();

  // Corrected useSelector to access top-level state properties
  const { file, isLoading, messages } = useSelector((state) => state);

  const [inputValue, setInputValue] = useState("");
  const [selectedText, setSelectedText] = useState({
    text: "",
    position: { x: 0, y: 0 },
    messageId: null,
    isUserMessage: false,
  });
  const [addedQuestions, setAddedQuestions] = useState(new Set());
  const [refKey, setRefKey] = useState("");
  const [isMandatory, setIsMandatory] = useState("F");
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const popupRef = useRef(null);
  const refKeyInputRef = useRef(null);
  const windowSize = useWindowSize();
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleSend = () => {
    if (!inputValue.trim()) return;
    dispatch(askQuestion(file, inputValue));
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextSelect = (e) => {
    if (e.target.tagName === "TEXTAREA") return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    const messageContainer = e.target.closest(".message-container");
    const messageId = messageContainer?.dataset.id;

    if (selectedText.length > 0 && messageId) {
      const message = messages.find((msg) => msg.id.toString() === messageId);
      if (!message) {
        setSelectedText({
          text: "",
          position: { x: 0, y: 0 },
          messageId: null,
          isUserMessage: false,
        });
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText({
        text: selectedText,
        position: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY - 40,
        },
        messageId,
        isUserMessage: message.sender === "user",
      });

      const adjustedY =
        rect.top + window.scrollY - (rect.height > 40 ? 50 : 30);
      setPopupPosition({
        x: rect.left + window.scrollX,
        y: Math.max(0, Math.min(adjustedY, window.innerHeight - 150)),
      });

      setRefKey("");
      setIsMandatory("F");
      setError("");
      setTimeout(() => refKeyInputRef.current?.focus(), 0);
    } else {
      setSelectedText({
        text: "",
        position: { x: 0, y: 0 },
        messageId: null,
        isUserMessage: false,
      });
      setError("");
    }
  };

  const handleAddLocalQuestion = () => {
    if (!selectedText.text || addedQuestions.has(selectedText.text)) {
      setError("This text has already been added.");
      return;
    }
    if (!refKey.trim()) {
      setError("Please enter a Short Name (REF_KEY).");
      refKeyInputRef.current?.focus();
      return;
    }

    const selectedMessageIndex = messages.findIndex(
      (msg) => msg.id.toString() === selectedText.messageId
    );
    let questionText, answerText;

    if (selectedText.isUserMessage) {
      questionText = selectedText.text;
      answerText =
        selectedMessageIndex >= 0 &&
        selectedMessageIndex + 1 < messages.length &&
        messages[selectedMessageIndex + 1].sender !== "user"
          ? messages[selectedMessageIndex + 1].text
          : "No answer available";
    } else {
      answerText = selectedText.text;
      questionText =
        selectedMessageIndex > 0 &&
        messages[selectedMessageIndex - 1].sender === "user"
          ? messages[selectedMessageIndex - 1].text
          : "No question available";
    }

    const questionData = {
      question: questionText,
      refKey: refKey.trim(),
      isMandatory: isMandatory,
      text: answerText,
      label: refKey.trim(),
    };

    dispatch(addLocalQuestion(questionData));
    setAddedQuestions((prev) => new Set(prev).add(selectedText.text));
    setSelectedText({
      text: "",
      position: { x: 0, y: 0 },
      messageId: null,
      isUserMessage: false,
    });
    setRefKey("");
    setIsMandatory("F");
    setError("");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setSelectedText({
          text: "",
          position: { x: 0, y: 0 },
          messageId: null,
          isUserMessage: false,
        });
        setRefKey("");
        setIsMandatory("F");
        setError("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full">
      {selectedText.text && !addedQuestions.has(selectedText.text) && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: "absolute",
            left: popupPosition.x,
            top: popupPosition.y,
            zIndex: 100,
            maxWidth: Math.min(windowSize.width * 0.8, 400),
            minWidth: 300,
          }}
          className="bg-white dark:bg-slate-800 shadow-lg rounded-md p-4 border border-gray-200 dark:border-slate-700"
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && handleAddLocalQuestion()
          }
          role="dialog"
          aria-labelledby="popup-title"
        >
          <div className="flex flex-col gap-3">
            <span
              id="popup-title"
              className="text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Add to Local Questions
            </span>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              Selected: <span className="italic">"{selectedText.text}"</span>
            </div>
            {error && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="ref-key-input"
                className="text-sm text-gray-700 dark:text-slate-300"
              >
                Short Name (REF_KEY) *
              </label>
              <Input
                id="ref-key-input"
                ref={refKeyInputRef}
                placeholder="Enter short name"
                value={refKey}
                onChange={(e) => setRefKey(e.target.value)}
                className="w-full mt-1"
                aria-required="true"
              />
            </div>
            <div>
              <label
                htmlFor="is-mandatory-select"
                className="text-sm text-gray-700 dark:text-slate-300"
              >
                Is Mandatory
              </label>
              <Select
                value={isMandatory}
                onValueChange={setIsMandatory}
                id="is-mandatory-select"
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Is Mandatory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">False</SelectItem>
                  <SelectItem value="T">True</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLocalQuestion}
              disabled={!refKey.trim()}
              className="mt-2"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add to Local Questions
            </Button>
          </div>
        </motion.div>
      )}

      <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-slate-800">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-800"
          onMouseUp={handleTextSelect}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="mb-4 w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                <div className="text-cyan-500 dark:text-cyan-400 w-8 h-8" />
              </div>
              <h4 className="text-xl font-medium mb-2">How can I help you?</h4>
              <p className="text-cyan-600 dark:text-cyan-100 max-w-md text-center">
                Ask about your document, I can analyze its content, structure,
                or suggestions for your questions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  message={msg}
                  isAdded={addedQuestions.has(msg.text)}
                />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 flex items-center gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce [animation-delay:0.2s]">
                      .
                    </span>
                    <span className="animate-bounce [animation-delay:0.4s]">
                      .
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[86px]">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your document..."
            className="flex-1 min-h-[3.75rem] max-h-32 overflow-auto"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 h-auto self-end"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const Message = ({ message, isAdded }) => {
  const isUser = message.sender === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } message-container`}
      data-id={message.id}
    >
      <div
        className={`max-w-[min(85%,500px)] px-4 py-3 rounded-2xl relative ${
          isUser
            ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-br-none"
            : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-none shadow-sm border border-gray-200 dark:border-slate-700"
        }`}
      >
        <p className="break-words whitespace-pre-wrap">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ node, ...props }) => (
                <table className="table-auto border  border-gray-400">
                  {props.children}
                </table>
              ),
              th: ({ node, ...props }) => (
                <th className="text-black border border-gray-400 bg-gray-100 px-4 py-2 text-left">
                  {props.children}
                </th>
              ),
              td: ({ node, ...props }) => (
                <td className="border border-gray-300 px-4 py-2">
                  {props.children}
                </td>
              ),
            }}
          >
            {message.text}
          </ReactMarkdown>
        </p>
        <div
          className={`text-xs mt-1 ${
            isUser ? "text-cyan-200" : "text-gray-500 dark:text-slate-400"
          }`}
        >
          {message.timestamp}
        </div>

        {isAdded && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
            <PlusCircle className="w-4 h-4" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
