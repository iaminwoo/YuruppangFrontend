"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface IngredientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 선택된 재료 객체 전체를 반환합니다. */
  onSelect: (ingredient: Ingredient) => void;
  initialKeyword?: string;
}

interface Ingredient {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  unitPrice: string;
  totalQuantity: string;
}

export default function IngredientSearchModal({
  isOpen,
  onClose,
  onSelect,
  initialKeyword = "",
}: IngredientSearchModalProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [keyword, setKeyword] = useState(initialKeyword);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearchTerm(val.trim());
    }, 300);
  };

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    let canceled = false;
    (async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const res = await fetchWithAuth(
          `${apiUrl}/api/ingredients?keyword=${encodeURIComponent(searchTerm)}`
        );
        if (!res.ok) throw new Error(`검색 실패: ${res.status}`);
        const json = await res.json();
        if (!canceled) {
          const list: Ingredient[] = json.data?.ingredients || [];
          setSearchResults(list);
        }
      } catch (err) {
        if (!canceled) {
          setSearchError((err as Error).message);
        }
      } finally {
        if (!canceled) {
          setIsSearching(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setKeyword(initialKeyword);
      setSearchResults([]);
      setSearchError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isOpen, initialKeyword]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const blacklist = ["계란"];
  const trimmedKeyword = keyword.trim();
  const hasExactMatch = searchResults.some(
    (result) => result.ingredientName === trimmedKeyword
  );
  const isBlacklisted = blacklist.includes(trimmedKeyword);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-lg relative">
        <h2 className="text-xl font-semibold mb-4">재료 검색</h2>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="재료명을 입력하세요"
            value={keyword}
            onChange={handleInput}
            className="flex-1 border border-gray-300 rounded-md px-2 py-1"
          />
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>

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
                <li key={idx}>
                  <button
                    type="button"
                    className="flex justify-between items-center p-2 bg-gray-100 rounded hover:bg-gray-200 w-full text-left"
                    onClick={() => {
                      onSelect(ing);
                      onClose();
                    }}
                  >
                    <span className="text-gray-800">{ing.ingredientName}</span>
                    <span className="text-sm text-gray-500">
                      {parseFloat(ing.totalQuantity).toLocaleString()} g
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {!isSearching && (
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!keyword.trim()) {
                  toast.error("재료명을 입력하거나 검색해주세요.");
                  return;
                }
                onSelect({
                  ingredientId: -1,
                  ingredientName: keyword.trim(),
                  unit: "",
                  unitPrice: "0",
                  totalQuantity: "0",
                });
                onClose();
              }}
              className="w-full"
              disabled={hasExactMatch || isBlacklisted}
            >
              “{keyword.trim()}” 사용하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
