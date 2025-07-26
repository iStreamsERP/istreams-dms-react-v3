// components/FloatingChatButton.jsx
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingChatButton({
  activeRightTab,
  setActiveRightTab,
  setIsChatOpen
}) {
  return (
    <>
      {activeRightTab !== "chat" && (
        <div className="hidden md:block fixed bottom-6 right-6 z-40">
          <Button
            asChild
            className="w-14 h-14 rounded-full p-0"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveRightTab("chat")}
            >
              <MessageSquare />
            </motion.button>
          </Button>
        </div>
      )}

      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <Button
          asChild
          className="w-14 h-14 rounded-full p-0"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(true)}
          >
            <MessageSquare />
          </motion.button>
        </Button>
      </div>
    </>
  );
}