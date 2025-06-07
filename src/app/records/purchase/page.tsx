"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import IngredientSearchModal from "@/components/IngredientSearchModal";

type Unit = "G" | "ML" | "개";

interface PurchaseItem {
  name: string;
  unit: Unit;
  totalQuantity: string;
  totalPrice: string;
}

export default function PurchasePage() {
  const router = useRouter();

  // ──────────────────────────────────────────────────────────────────────────────
  // 재료 검색 모달 관련 상태
  // ──────────────────────────────────────────────────────────────────────────────
  // 현재 열려 있는지 여부
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  // 모달을 연 재료가 속한 partIndex, ingredientIndex
  const [currentPartIndex, setCurrentPartIndex] = useState<number | null>(null);
  const [currentIngredientIndex, setCurrentIngredientIndex] = useState<
    number | null
  >(null);

  // 오늘 날짜를 "yyyy-MM-dd" 형식으로 만들어서 초기값으로 사용
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // 예: "2025-06-01"
  };

  // 1) description 상태
  const [description, setDescription] = useState("");

  // 2) 실제 구매 날짜(actualAt)를 오늘 날짜로 초기화
  const [actualAt, setActualAt] = useState<string>(getTodayString());

  // 3) 재료 목록 상태
  const [items, setItems] = useState<PurchaseItem[]>([
    { name: "", unit: "G", totalQuantity: "", totalPrice: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemChange = (
    index: number,
    field: keyof PurchaseItem,
    value: string
  ) => {
    const newItems = [...items];
    if (field === "unit") {
      newItems[index][field] = value as Unit;
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", unit: "G", totalQuantity: "", totalPrice: "" },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!description.trim()) {
      setError("구매 설명을 입력해주세요.");
      setLoading(false);
      return;
    }
    if (!actualAt) {
      setError("구매 날짜를 선택해주세요.");
      setLoading(false);
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const { name, totalQuantity, totalPrice } = items[i];
      if (!name.trim()) {
        setError(`재료 ${i + 1}의 이름을 입력해주세요.`);
        setLoading(false);
        return;
      }
      if (!totalQuantity || Number.isNaN(Number(totalQuantity))) {
        setError(`재료 ${i + 1}의 수량을 숫자로 입력해주세요.`);
        setLoading(false);
        return;
      }
      if (!totalPrice || Number.isNaN(Number(totalPrice))) {
        setError(`재료 ${i + 1}의 가격을 숫자로 입력해주세요.`);
        setLoading(false);
        return;
      }
    }

    const payload = {
      description: description.trim(),
      actualAt, // 서버로 "yyyy-MM-dd" 문자열 그대로 전송
      requestList: items.map((item) => ({
        name: item.name.trim(),
        totalQuantity: Number(item.totalQuantity),
        unit: item.unit,
        totalPrice: Number(item.totalPrice),
      })),
    };

    try {
      const res = await fetch(
        "http://localhost:8080/api/ingredientLogs/purchase",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "구매 기록 저장 실패");
      }

      alert("구매 기록이 완료되었습니다.");
      router.push("/stock");
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar />
      <main className="px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
        <h2 className="text-2xl font-bold text-[#4E342E] mb-4 mt-2">
          구매 기록 추가
        </h2>

        {/* 구매 설명 */}
        <div>
          <label className="block font-semibold mb-1 text-[#4E342E]">
            설명
          </label>
          <textarea
            className="w-full p-3 rounded border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
            placeholder="구매 설명을 입력하세요"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 구매 날짜 (기본값: 오늘) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="purchase-date"
            className="block font-semibold mb-1 text-[#4E342E]"
          >
            구매 날짜
          </label>
          <input
            id="purchase-date"
            type="date"
            className="w-full max-w-xs rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
            value={actualAt}
            onChange={(e) => setActualAt(e.target.value)}
          />
        </div>

        {/* 재료 목록 */}
        <h3 className="block font-semibold mb-1 text-[#4E342E]">재료 목록</h3>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#FFF8F0] rounded-xl shadow-md border p-6 flex flex-col gap-4 md:flex-row md:items-center md:gap-4"
            >
              <button
                type="button"
                onClick={() => {
                  setCurrentIngredientIndex(idx);
                  setShowIngredientModal(true);
                }}
                className={`flex-grow border border-gray-300 p-2 text-left ${
                  item.name ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {item.name || "재료명을 선택하세요"}
              </button>

              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="number"
                  placeholder="총 수량"
                  min="0"
                  value={item.totalQuantity}
                  onChange={(e) =>
                    handleItemChange(idx, "totalQuantity", e.target.value)
                  }
                  className="w-full md:w-24 rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
                />
                <select
                  className="w-20 rounded border border-gray-300 p-2 bg-white"
                  value={item.unit}
                  onChange={(e) =>
                    handleItemChange(idx, "unit", e.target.value as Unit)
                  }
                >
                  <option value="G">g</option>
                  <option value="ML">ml</option>
                  <option value="개">개</option>
                </select>
              </div>

              <input
                type="number"
                placeholder="총 가격(원)"
                min="0"
                value={item.totalPrice}
                onChange={(e) =>
                  handleItemChange(idx, "totalPrice", e.target.value)
                }
                className="w-full md:w-28 rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
              />

              <div className="w-full md:w-auto flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-red-500 font-bold text-2xl"
                  aria-label="재료 삭제"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 버튼 */}
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
            {loading ? "저장 중..." : "구매 기록 저장"}
          </Button>
        </div>

        {/* 에러 메시지 */}
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
