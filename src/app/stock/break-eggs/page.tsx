"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface EggsResponse {
  eggsCount: number;
  whitesStock: number;
  yolksStock: number;
}

export default function StockPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();

  const [eggs, setEggs] = useState<EggsResponse | null>(null);
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${apiUrl}/api/ingredients/eggs`)
      .then((res) => res.json())
      .then((data) => {
        setEggs(data.data);
      })
      .catch((err) => {
        alert("달걀 정보를 불러오는데 실패했습니다.");
        console.error(err);
      });
  }, [apiUrl]);

  const handleBreakEggs = async () => {
    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum <= 0) {
      toast.error("수량은 1 이상의 숫자여야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/ingredients/break-eggs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qtyNum }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "달걀 깨기에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      toast.success("달걀을 성공적으로 깼습니다.");
      router.push("/stock");
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar pageTitle="달걀 깨기 페이지" />
      <main className="px-4 py-6 max-w-3xl mx-auto w-full space-y-4">
        <button
          onClick={() => router.push("/stock")}
          className="text-[#FFEED9] bg-[#8D5F45] hover:bg-[#4E342E] font-bold text-base md:text-sm px-5 py-2 rounded-xl"
        >
          목록으로 돌아가기
        </button>

        <div className="flex flex-col justify-center items-center gap-4">
          <h2 className="text-xl font-bold text-[#4E342E] mb-4">
            🥚🥚🥚 달걀 깨기 🥚🥚🥚
          </h2>

          <Image
            src="/break-eggs.png"
            alt="달걀 깨는 이미지"
            width={200}
            height={200}
            className="rounded-3xl"
            priority
          />

          <div className="flex justify-center">
            <div className="w-[250px] bg-[#FFF2E1] text-center rounded-xl px-4 py-3 shadow-md flex flex-col gap-1 text-sm text-[#4E342E]">
              <div className="flex justify-between">
                <span className="flex-3 font-bold">종류</span>
                {eggs && <span className="flex-2 font-bold">재고</span>}
                <span className="flex-2 font-bold">개당 무게</span>
              </div>
              <div className="flex justify-between">
                <span className="flex-3">🥚 달걀 무게</span>
                {eggs && <span className="flex-2">{eggs.eggsCount}개</span>}
                <span className="flex-2">54g/1개</span>
              </div>
              <div className="flex justify-between">
                <span className="flex-3">🟡 노른자 무게</span>
                {eggs && <span className="flex-2">{eggs.yolksStock}g</span>}
                <span className="flex-2">18g/1개</span>
              </div>
              <div className="flex justify-between">
                <span className="flex-3">⚪ 흰자 무게</span>
                {eggs && <span className="flex-2">{eggs.whitesStock}g</span>}
                <span className="flex-2">36g/1개</span>
              </div>
            </div>
          </div>

          <label htmlFor="quantity" className="text-[#4E342E] font-bold">
            깨고 싶은 달걀 수량
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8D5F45]"
            placeholder="예: 3"
            disabled={isLoading}
          />

          {Number(quantity) > 0 && (
            <p className="text-sm text-[#4E342E]">
              (노른자 {Number(quantity) * 18}g, 흰자 {Number(quantity) * 36}g 로
              분리 예정)
            </p>
          )}

          <Button
            onClick={handleBreakEggs}
            disabled={isLoading}
            className="w-1/3 bg-[#8D5F45] hover:bg-[#4E342E] text-[#FFEED9] font-bold"
          >
            {isLoading ? "처리 중…" : "🥚 깨기"}
          </Button>
        </div>
      </main>
    </div>
  );
}
