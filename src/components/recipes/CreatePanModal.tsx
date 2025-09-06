import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect } from "react";

export type PanType = "ROUND" | "SQUARE" | "CUSTOM";

export interface Pan {
  id?: number;
  panType: PanType;
  radius?: number;
  width?: number;
  length?: number;
  height?: number;
  volume?: number;
}

export interface PanResponse {
  panId: number;
  panType: PanType;
  measurements: string;
  volume: number;
}

interface CreatePanModalProps {
  isOpen: boolean;
  initialType: PanType | null;
  onClose: () => void;
  onCreate: (pan: PanResponse) => void;
}

export default function CreatePanModal({
  isOpen,
  initialType,
  onClose,
  onCreate,
}: CreatePanModalProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [panType, setPanType] = useState<PanType>("ROUND");
  const [radius, setRadius] = useState<number>();
  const [width, setWidth] = useState<number>();
  const [length, setLength] = useState<number>();
  const [height, setHeight] = useState<number>();
  const [volume, setVolume] = useState<number>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPanType(initialType || "ROUND");
  }, [initialType]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${apiUrl}/api/pans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panType: panType.trim(),
          radius: radius,
          width: width,
          length: length,
          height: height,
          volume: volume,
        }),
      });

      const result = await response.json();
      const createdPan: PanResponse = result.data;
      onCreate(createdPan);
      onClose();
    } catch (err) {
      console.error(err);
      alert("생성 실패");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">새 틀 생성</h2>

        {/* Pantype 선택 */}
        <label className="block font-semibold mb-1 text-[#4E342E]">
          틀 타입 선택
        </label>
        <div className="mb-4 flex gap-2">
          {(["ROUND", "SQUARE", "CUSTOM"] as PanType[]).map((type) => (
            <button
              key={type}
              className={`px-4 py-2 rounded ${
                panType === type ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setPanType(type)}
            >
              {type === "ROUND"
                ? "원형틀"
                : type === "SQUARE"
                ? "사각틀"
                : "기타"}
            </button>
          ))}
        </div>

        {/* 동적 입력 */}
        <label className="block font-semibold mb-1 text-[#4E342E]">
          수치 입력 (cm)
        </label>
        {panType === "ROUND" && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-xs text-[#4E342E]">
                반지름
              </label>
              <input
                type="number"
                placeholder="반지름"
                value={radius || ""}
                onChange={(e) =>
                  setRadius(e.target.value ? Number(e.target.value) : undefined)
                }
                className="border rounded px-2 py-1 flex-grow"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-xs text-[#4E342E]">
                높이
              </label>
              <input
                type="number"
                placeholder="높이"
                value={height || ""}
                onChange={(e) =>
                  setHeight(e.target.value ? Number(e.target.value) : undefined)
                }
                className="border rounded px-2 py-1 flex-grow"
              />
            </div>
          </div>
        )}

        {panType === "SQUARE" && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-xs text-[#4E342E]">
                가로
              </label>
              <input
                type="number"
                placeholder="가로"
                value={width || ""}
                onChange={(e) =>
                  setWidth(e.target.value ? Number(e.target.value) : undefined)
                }
                className="border rounded px-2 py-1 flex-grow"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-xs text-[#4E342E]">
                세로
              </label>
              <input
                type="number"
                placeholder="세로"
                value={length || ""}
                onChange={(e) =>
                  setLength(e.target.value ? Number(e.target.value) : undefined)
                }
                className="border rounded px-2 py-1 flex-grow"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-xs text-[#4E342E]">
                높이
              </label>
              <input
                type="number"
                placeholder="높이"
                value={height || ""}
                onChange={(e) =>
                  setHeight(e.target.value ? Number(e.target.value) : undefined)
                }
                className="border rounded px-2 py-1 flex-grow"
              />
            </div>
          </div>
        )}

        {panType === "CUSTOM" && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-xs text-[#4E342E]">
                부피
              </label>
              <input
                type="number"
                placeholder="부피"
                value={volume || ""}
                onChange={(e) =>
                  setVolume(e.target.value ? Number(e.target.value) : undefined)
                }
                className="border rounded px-2 py-1 flex-grow"
              />
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            {loading ? "생성중..." : "생성하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
