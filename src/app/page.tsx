"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFF8F0] p-6 font-sans">
      <img
        src="/yuru.png" // 퍼블릭 디렉토리에 넣은 이미지 경로
        alt="유루빵 이미지"
        className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl"
      />

      <h1 className="text-3xl md:text-3xl font-bold mb-2 mt-8 text-[#4E342E] text-center">
        유루빵에 오신 것을 <br />
        환영합니다!
      </h1>
      <p className="mb-8 text-center text-sm md:text-base text-[#6D4C41]">
        재고와 레시피를 쉽게 관리해보세요 🍞
      </p>

      <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full">
        <Button
          onClick={() => router.push("/stock")}
          className="bg-[#A97155] hover:bg-[#8D5F45] text-white w-full max-w-[220px] text-xl py-7 rounded-xl shadow"
        >
          재고 관리
        </Button>
        <Button
          onClick={() => router.push("/recipes")}
          className="bg-[#FFD8A9] hover:bg-[#f7c88f] text-[#4E342E] w-full max-w-[220px] text-xl py-7 rounded-xl shadow"
        >
          레시피 관리
        </Button>
      </div>
    </main>
  );
}
