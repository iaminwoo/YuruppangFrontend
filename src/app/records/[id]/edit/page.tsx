"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import IngredientSearchModal from "@/components/IngredientSearchModal";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function RecordEditPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { id } = useParams();
  const router = useRouter();

  // 모달 열림 상태
  const [showIngredientModal, setShowIngredientModal] = useState(false);

  // 초기 form 상태에 actualAt 필드 추가 (빈 문자열로 초기화)
  const [form, setForm] = useState<{
    type: "PURCHASE" | "CONSUMPTION";
    description: string;
    ingredientName: string;
    quantity: number;
    price: number;
    actualAt: string;
  }>({
    type: "PURCHASE",
    description: "",
    ingredientName: "",
    quantity: 0,
    price: 0,
    actualAt: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchWithAuth(`${apiUrl}/api/ingredientLogs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const d = data.data;
        setForm({
          type: d.type,
          description: d.description,
          ingredientName: d.ingredientName,
          quantity: d.quantity,
          price: d.totalPrice || 0,
          actualAt: d.actualAt, // 서버에서 받아온 "YYYY-MM-DD" 문자열
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    try {
      // actualAt 필드를 항상 포함하도록 payload 구성
      const basePayload = {
        type: form.type,
        description: form.description,
        ingredientName: form.ingredientName,
        quantity: form.quantity,
        actualAt: form.actualAt, // "YYYY-MM-DD" 형태
      };

      // PURCHASE이면 price도 추가, CONSUMPTION이면 price 제외
      const payload =
        form.type === "CONSUMPTION"
          ? basePayload
          : { ...basePayload, price: form.price };

      const res = await fetchWithAuth(`${apiUrl}/api/ingredientLogs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("수정 실패");

      alert("수정이 완료되었습니다.");
      router.push(`/records/${id}`);
    } catch (err) {
      alert("오류 발생: " + err);
    }
  };

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;
  if (error)
    return <div className="p-8 text-center text-red-500">에러: {error}</div>;

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar pageTitle="기록 수정 페이지" />
      <main className="px-4 py-6 max-w-xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-[#4E342E] mb-4 mt-2">
          기록 수정
        </h2>

        <div className="space-y-4">
          {/* 구분 */}
          <div>
            <label className="block mb-1 text-sm font-semibold">구분</label>
            <select
              className="w-full p-2 border rounded"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as "PURCHASE" | "CONSUMPTION",
                })
              }
            >
              <option value="PURCHASE">구매</option>
              <option value="CONSUMPTION">소비</option>
            </select>
          </div>

          {/* 실제 날짜 */}
          <div>
            <label className="block mb-1 text-sm font-semibold">날짜</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={form.actualAt}
              onChange={(e) => setForm({ ...form, actualAt: e.target.value })}
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block mb-1 text-sm font-semibold">설명</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* 재료 이름 */}
          <div>
            <label className="block mb-1 text-sm font-semibold">
              재료 이름
            </label>
            <button
              type="button"
              onClick={() => setShowIngredientModal(true)}
              className={`w-full p-2 border rounded text-left ${
                form.ingredientName ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {form.ingredientName || "재료명을 선택하세요"}
            </button>
          </div>

          {/* 수량 */}
          <div>
            <label className="block mb-1 text-sm font-semibold">수량</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: parseFloat(e.target.value) })
              }
            />
          </div>

          {/* 구매인 경우에만 총 가격 입력 */}
          {form.type === "PURCHASE" && (
            <div>
              <label className="block mb-1 text-sm font-semibold">
                총 가격
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: parseFloat(e.target.value) })
                }
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="mt-2 py-5 w-full bg-[#B9896D] text-white rounded-xl"
          >
            수정 완료
          </Button>
        </div>

        {/* 재료 검색 모달 */}
        {showIngredientModal && (
          <IngredientSearchModal
            isOpen={showIngredientModal}
            onClose={() => setShowIngredientModal(false)}
            onSelect={(ingredientName: string) => {
              setForm((prev) => ({ ...prev, ingredientName }));
              setShowIngredientModal(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
