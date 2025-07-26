// components/PageHeader.jsx
import { motion } from "framer-motion";

export default function PageHeader({ showAnalysis }) {
  if (showAnalysis) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-4 sm:mb-6 md:mb-8 pt-4"
    >
      <motion.h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-400 mb-2"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
        style={{ backgroundSize: "200% auto" }}
      >
        Upload Your Document
      </motion.h1>
      <p className="text-sm sm:text-base text-cyan-700 dark:text-cyan-100">
        Upload, Analyze & Chat with your Documents
      </p>
    </motion.div>
  );
}