"use client";

import { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export enum PanType {
  ROUND = "ROUND",
  SQUARE = "SQUARE",
  CUSTOM = "CUSTOM",
}

interface PanSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pan: Pan) => void;
  onCreatePan: (type: PanType | null) => void;
}

interface Pan {
  panId: number;
  panType: string;
  measurements: string;
  volume: number;
}

export default function PanSearchModal({
  isOpen,
  onClose,
  onSelect,
  onCreatePan,
}: PanSearchModalProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [selectedType, setSelectedType] = useState<PanType | null>(null);
  const [pans, setPans] = useState<Pan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (selectedType === null) {
      setLoading(true);
      fetchWithAuth(`${apiUrl}/api/pans`) // 전체 조회
        .then((res) => res.json())
        .then((data: { resultCode: string; msg: string; data: Pan[] }) =>
          setPans(data.data)
        )
        .finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    fetchWithAuth(`${apiUrl}/api/pans?panType=${selectedType}`)
      .then((res) => res.json())
      .then((data: { resultCode: string; msg: string; data: Pan[] }) =>
        setPans(data.data)
      )
      .finally(() => setLoading(false));
  }, [selectedType]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg flex-col p-6 w-full max-w-lg mx-4 shadow-lg relative">
        <h2 className="text-xl font-semibold mb-4">틀 검색</h2>

        {/* 상단: PanType 선택 */}
        <div className="flex-col w-full justify-around mb-4">
          <button
            className={`px-4 py-2 mb-4 mx-1 rounded-xl ${
              selectedType === null ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setSelectedType(null)}
          >
            전체
          </button>

          {Object.values(PanType).map((type) => (
            <button
              key={type}
              className={`px-4 py-2 mb-4 mx-1 rounded-xl ${
                selectedType === type ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setSelectedType(type)}
            >
              {type === PanType.ROUND
                ? "원형틀"
                : type === PanType.SQUARE
                ? "사각틀"
                : "기타"}
            </button>
          ))}

          {/* 틀 목록 */}
          <div className="max-h-64 overflow-y-auto mb-4">
            {loading ? (
              <p>불러오는 중...</p>
            ) : pans.length === 0 ? (
              <p>틀이 없습니다.</p>
            ) : (
              pans.map((pan) => (
                <div
                  key={pan.panId}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    <p>{pan.measurements}</p>
                    <p className="text-sm text-gray-500">
                      부피: {pan.volume} cm³
                    </p>
                  </div>
                  <button
                    className="px-2 py-1 bg-green-500 text-white rounded"
                    onClick={() => {
                      onSelect(pan);
                      onClose();
                    }}
                  >
                    선택
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 하단: 새 틀 생성 */}
          <div className="flex justify-end">
            <button
              className="px-2 py-2 bg-blue-600 text-white rounded"
              onClick={() => onCreatePan(selectedType)}
            >
              + 새 틀 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
