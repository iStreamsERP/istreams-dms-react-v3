import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import ChatInterface from "./ChatInterface";

export default function ChatModal({
  isOpen,
  setIsOpen,
  messages,
  isResponseLoading,
  askQuestion
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col md:hidden">
      <div className="p-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-white"
        >
          <ChevronLeft />
        </Button>
        <h3 className="text-sm font-semibold">Document Assistant</h3>
      </div>
      
      <ChatInterface
        messages={messages}
        isResponseLoading={isResponseLoading}
        askQuestion={askQuestion}
      />
    </div>
  );
}