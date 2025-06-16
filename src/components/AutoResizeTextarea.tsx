import React, { useEffect, useRef } from "react";

interface AutoResizeTextareaProps {
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
}

export default function AutoResizeTextarea({
  description,
  setDescription,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [description]);

  return (
    <textarea
      ref={textareaRef}
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className="w-full whitespace-pre-wrap p-2 border border-gray-300
      rounded-md resize-none overflow-y-auto
      focus:outline-none focus:ring-2 focus:ring-blue-300 min-h-[80px] max-h-[220px]"
      placeholder="레시피 설명"
    />
  );
}
