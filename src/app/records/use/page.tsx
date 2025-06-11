"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import IngredientSearchModal from "@/components/IngredientSearchModal";

interface UsageItem {
  name: string;
  totalQuantity: string;
}

// 오늘 날짜를 "yyyy-MM-dd" 형식으로 반환하는 유틸 함수
const getTodayString = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // 예: "2025-06-01"
};

export default function UsagePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();

  // ──────────────────────────────────────────────────────────────────────────────
  // 재료 검색 모달 관련 상태
  // ──────────────────────────────────────────────────────────────────────────────
  // 현재 열려 있는지 여부
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  // 모달을 연 재료가 속한 partIndex, ingredientIndex
  const [currentIngredientIndex, setCurrentIngredientIndex] = useState<
    number | null
  >(null);

  // 1) 소비 설명
  const [description, setDescription] = useState("");

  // 2) 실제 소비 날짜(actualAt)를 오늘 날짜로 초기화
  const [actualAt, setActualAt] = useState<string>(getTodayString());

  // 3) 재료 목록 상태
  const [items, setItems] = useState<UsageItem[]>([
    { name: "", totalQuantity: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemChange = (
    index: number,
    field: keyof UsageItem,
    value: string
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", totalQuantity: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // 유효성 검사
    if (!description.trim()) {
      setError("소비 설명을 입력해주세요.");
      setLoading(false);
      return;
    }
    if (!actualAt) {
      setError("소비 날짜를 선택해주세요.");
      setLoading(false);
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const { name, totalQuantity } = items[i];
      if (!name.trim()) {
        setError(`재료 ${i + 1}의 이름을 입력해주세요.`);
        setLoading(false);
        return;
      }
      if (!totalQuantity || Number.isNaN(Number(totalQuantity))) {
        setError(`재료 ${i + 1}의 소비 수량을 숫자로 입력해주세요.`);
        setLoading(false);
        return;
      }
    }

    // payload 생성 (서버 DTO에 맞게 변환)
    const payload = {
      description: description.trim(),
      actualAt, // "yyyy-MM-dd" 문자열 → 서버에서 LocalDate로 파싱
      requestList: items.map((item) => ({
        name: item.name.trim(),
        totalQuantity: Number(item.totalQuantity),
      })),
    };

    try {
      const res = await fetch(`${apiUrl}/api/ingredientLogs/use`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "소비 기록 저장 실패");
      }

      alert("소비 기록이 완료되었습니다.");
      router.push("/stock");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar />
      <main className="px-4 py-6 max-w-3xl mx-auto w-full space-y-4">
        <h2 className="text-xl font-bold text-[#4E342E] mb-4 mt-2">
          소비 기록 추가
        </h2>

        {/* 소비 설명 */}
        <div>
          <label className="block font-semibold mb-1 text-[#4E342E]">
            설명
          </label>
          <textarea
            className="w-full p-3 text-sm rounded border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
            placeholder="소비 설명을 입력하세요"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 소비 날짜 (기본값: 오늘) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="usage-date"
            className="font-semibold text-[#4E342E] mb-2"
          >
            소비 날짜
          </label>
          <input
            id="usage-date"
            type="date"
            className="w-full text-sm max-w-xs rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
            value={actualAt}
            onChange={(e) => setActualAt(e.target.value)}
          />
        </div>

        {/* 재료 목록 제목 */}
        <h3 className="font-semibold text-[#4E342E] mb-2">재료 목록</h3>

        {/* 재료 목록 */}
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#FFF8F0] rounded-xl shadow-md border px-6 py-3 flex flex-col md:flex-row md:items-center gap-4"
            >
              <button
                type="button"
                onClick={() => {
                  setCurrentIngredientIndex(idx);
                  setShowIngredientModal(true);
                }}
                className={`flex-grow border border-gray-300 p-2 rounded text-sm text-left ${
                  item.name ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {item.name || "재료명을 선택하세요"}
              </button>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="number"
                  placeholder="소비 수량"
                  min="0"
                  value={item.totalQuantity}
                  onChange={(e) =>
                    handleItemChange(idx, "totalQuantity", e.target.value)
                  }
                  className="w-full md:w-24 text-sm rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
                />
                <div className="text-gray-500 text-sm">g / ml / 개</div>
              </div>

              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-red-500 font-bold text-lg self-end md:self-center md:ml-auto"
                aria-label="재료 삭제"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-4">
          <Button
            onClick={addItem}
            className="flex-1 bg-[#D7B49E] text-white py-4 rounded-xl"
          >
            재료 추가
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#B9896D] text-white py-4 rounded-xl"
          >
            {loading ? "저장 중..." : "소비 기록 저장"}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 font-semibold text-center mt-4">
            {error}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* 재료 검색/추가 모달 */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        {showIngredientModal && currentIngredientIndex !== null && (
          <IngredientSearchModal
            isOpen={showIngredientModal}
            onClose={() => setShowIngredientModal(false)}
            onSelect={(ingredientName: string) => {
              // items 배열 복사 및 업데이트
              const newItems = [...items];
              newItems[currentIngredientIndex].name = ingredientName;
              setItems(newItems);

              // 모달 닫기 및 인덱스 리셋
              setShowIngredientModal(false);
              setCurrentIngredientIndex(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
