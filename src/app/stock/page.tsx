"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Ingredient {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  unitPrice: string;
  totalQuantity: string;
}

interface ApiResponse {
  resultCode: string;
  msg: string;
  data: {
    ingredients: Ingredient[];
  };
}

export default function StockPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/ingredients`)
      .then((res) => {
        if (!res.ok) throw new Error("재고 데이터를 불러오지 못했습니다.");
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (data.resultCode === "OK") {
          setIngredients(data.data.ingredients);
        } else {
          setError(data.msg || "알 수 없는 오류");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 페이지 상단 useEffect 아래에 추가
  const handleCleanup = async () => {
    if (!confirm("사용되지 않는 재료를 정리하시겠습니까?")) return;

    try {
      const res = await fetch(`${apiUrl}/api/ingredients`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("정리 요청 실패");

      const data = await res.json();
      alert(data.msg || "재고 정리가 완료되었습니다.");

      // 재고 다시 로드
      setLoading(true);
      setError(null);

      const reloadRes = await fetch(`${apiUrl}/api/ingredients`);
      const reloadData: ApiResponse = await reloadRes.json();

      if (reloadData.resultCode === "OK") {
        setIngredients(reloadData.data.ingredients);
      } else {
        setError(reloadData.msg || "알 수 없는 오류");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert("에러: " + e.message);
      } else {
        alert("알 수 없는 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar />
      <main className="px-4 py-6 max-w-4xl mx-auto w-full space-y-4">
        {/* 버튼 영역 */}
        <h2 className="text-xl font-bold text-[#4E342E] mb-4">재고 관리</h2>
        <div className="flex gap-4">
          <Button
            className="flex-1 bg-[#D7B49E] text-white py-6 text-lg rounded-xl"
            onClick={() => router.push("/records")}
          >
            기록 확인
          </Button>
          <Button
            className="flex-1 bg-[#C89F84] text-white py-6 text-lg rounded-xl"
            onClick={() => router.push("/records/purchase")}
          >
            구매 기록
          </Button>
          <Button
            className="flex-1 bg-[#B9896D] text-white py-6 text-lg rounded-xl"
            onClick={() => router.push("/records/use")}
          >
            소비 기록
          </Button>
        </div>

        {/* 제목 */}
        {/* 제목 + 정리 버튼 */}
        <div className="flex items-center justify-between mb-4 mt-6">
          <h2 className="text-xl font-bold text-[#4E342E]">현재 재고</h2>
          <Button
            className="bg-[#A97155] text-white px-4 py-2 rounded-lg text-sm"
            onClick={handleCleanup}
          >
            재고 정리
          </Button>
        </div>

        {/* 재고 데이터 표시 영역 */}
        {loading ? (
          <div className="w-full h-32 bg-[#FFEED9] rounded-xl flex items-center justify-center text-[#A97155]">
            로딩 중...
          </div>
        ) : error ? (
          <div className="w-full h-32 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
            에러: {error}
          </div>
        ) : ingredients.length === 0 ? (
          <div className="w-full h-32 bg-[#FFEED9] rounded-xl flex items-center justify-center text-[#A97155]">
            등록된 재고가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {/* 재료명 / 수량 / 단가 라벨 카드 */}
            <div className="bg-[#FFD8A9] rounded-xl shadow-md border px-6 py-2 flex items-center justify-between text-[#4E342E] font-semibold">
              <div className="min-w-[100px] text-center">재료명</div>
              <div className="min-w-[60px] text-center">수량</div>
              <div className="min-w-[60px] text-center">단가</div>
            </div>

            {ingredients.map((item) => (
              <div
                key={item.ingredientName}
                className="bg-[#FFF8F0] rounded-xl shadow-md border px-6 py-4 flex items-center justify-between hover:bg-[#FFF0DA] transition"
              >
                <div className="text-center font-semibold text-[#4E342E] min-w-[100px]">
                  {item.ingredientName}
                </div>
                <div className="text-sm text-center text-[#4E342E] min-w-[60px]">
                  {parseFloat(item.totalQuantity).toLocaleString()} {item.unit}
                </div>
                <div className="text-sm text-center text-[#4E342E] min-w-[60px]">
                  {parseFloat(item.unitPrice).toLocaleString()} 원 / {item.unit}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
