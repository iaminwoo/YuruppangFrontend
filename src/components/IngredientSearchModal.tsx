// components/IngredientSearchModal.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button"; // 기존 버튼 컴포넌트 사용
import { toast } from "sonner";

interface IngredientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 선택된 재료명을 문자열로 반환합니다. */
  onSelect: (ingredientName: string) => void;
  initialKeyword?: string;
}

export default function IngredientSearchModal({
  isOpen,
  onClose,
  onSelect,
  initialKeyword = "",
}: IngredientSearchModalProps) {
  // ──────────────────────────────────────────────────
  // 1) State 선언
  // ──────────────────────────────────────────────────
  const [keyword, setKeyword] = useState(initialKeyword);
  const [searchResults, setSearchResults] = useState<{ name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ──────────────────────────────────────────────────
  // 2) 검색 디바운스 로직
  // ──────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/ingredients?keyword=${encodeURIComponent(
            keyword.trim()
          )}`
        );
        if (!res.ok) throw new Error(`검색 실패: ${res.status}`);
        const json = await res.json();
        const list: { name: string }[] = (json.data?.ingredients || []).map(
          (ing: any) => ({ name: ing.ingredientName })
        );
        setSearchResults(list);
      } catch (err) {
        setSearchError((err as Error).message);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    debounceRef.current = timer;
    return () => clearTimeout(timer);
  }, [keyword]);

  // ──────────────────────────────────────────────────
  // 3) 모달이 열릴 때 키워드 초기화 (옵션)
  // ──────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setKeyword(initialKeyword);
      setSearchResults([]);
      setSearchError(null);
    }
  }, [isOpen, initialKeyword]);

  // ──────────────────────────────────────────────────
  // 4) ESC 누르면 모달 닫기
  // ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [isOpen, onClose]);

  // ──────────────────────────────────────────────────
  // 5) 모달 외부 클릭 시 닫기
  // ──────────────────────────────────────────────────
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-lg relative">
        <h2 className="text-xl font-semibold mb-4">재료 검색</h2>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        {/* 검색 인풋 */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="재료명을 입력하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-2 py-1"
          />
          <Button variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>

        {/* 검색 상태/에러/결과 */}
        {isSearching && <p className="text-center text-gray-600">검색 중…</p>}
        {searchError && (
          <p className="text-center text-red-500">{searchError}</p>
        )}

        {!isSearching && !searchError && (
          <ul className="max-h-60 overflow-auto space-y-2 mb-4">
            {searchResults.length === 0 ? (
              <p className="text-gray-500 text-center">검색 결과가 없습니다.</p>
            ) : (
              searchResults.map((ing, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center p-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                  onClick={() => {
                    onSelect(ing.name);
                    onClose();
                  }}
                >
                  <span className="text-gray-800">{ing.name}</span>
                </li>
              ))
            )}
          </ul>
        )}

        {/* 검색 결과가 없을 때에도 현재 키워드를 선택 옵션으로 제공 */}
        {!isSearching && (
          <div className="mt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!keyword.trim()) {
                  toast.error("재료명을 입력하거나 검색해주세요.");
                  return;
                }
                onSelect(keyword.trim());
                onClose();
              }}
              className="w-full"
            >
              “{keyword.trim()}” 사용하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
