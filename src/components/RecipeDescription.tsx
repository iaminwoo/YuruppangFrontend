import { useState, useRef, useEffect } from "react";
import Linkify from "linkify-react";

export default function RecipeDescription({
  initialDescription,
  updateUrl,
}: {
  initialDescription: string;
  updateUrl: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDescription(initialDescription);
  }, [initialDescription]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [description, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(updateUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDescription: description }),
      });
      if (!res.ok) throw new Error("저장 실패");

      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const options = {
    defaultProtocol: "https",
    target: "_blank",
    className: "text-blue-800 underline hover:text-blue-400",
  };

  return (
    <div className="mb-4">
      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md resize-none overflow-hidden"
            placeholder="레시피 설명"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1 text-sm bg-[#A97155] text-white rounded-md disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setDescription(initialDescription);
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="px-4 py-1 text-sm bg-gray-300 rounded-md"
            >
              취소
            </button>
          </div>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </>
      ) : (
        <div>
          <p className="mb-3 whitespace-pre-wrap">
            <Linkify options={options}>{description}</Linkify>
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-1 text-sm bg-[#A97155] text-white hover:bg-gray-300 rounded-md"
          >
            수정
          </button>
        </div>
      )}
    </div>
  );
}
