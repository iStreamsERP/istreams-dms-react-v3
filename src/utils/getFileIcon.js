import {
  defaultDocIcon,
  excelIcon,
  imageIcon,
  pdfIcon,
  pptIcon,
  wordIcon,
} from "@/assets";

export const getFileIcon = (docExt) => {
  if (!docExt) return defaultDocIcon;
  const ext = docExt.toLowerCase();
  if (ext === "pdf") return pdfIcon;
  if (ext === "doc" || ext === "docx") return wordIcon;
  if (ext === "xls" || ext === "xlsx") return excelIcon;
  if (ext === "ppt" || ext === "pptx") return pptIcon;
  if (["png", "jpg", "jpeg", "gif"].includes(ext)) return imageIcon;
  return defaultDocIcon;
};
