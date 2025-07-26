import { Input } from "@/components/ui/input";
import { useEffect, useRef } from "react";

const GlobalSearchInput = ({ value, onChange }) => {
  const inputRef = useRef(null);
  // Ctrl + K shortcut to focus input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder="Global Search... (Ctrl+K)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default GlobalSearchInput;
