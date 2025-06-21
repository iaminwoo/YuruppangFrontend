"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PinLogin from "@/components/PinLogin";

export default function Login() {
  const router = useRouter();

  return (
    <div className="bg-[#FFF8F0] min-h-screen font-sans flex flex-col text-sm">
      <main className="px-4 py-6 max-w-3xl mx-auto w-full flex-grow flex items-center justify-center">
        <div className="flex flex-col text-center items-center justify-center">
          <Image
            src="/yuru.png"
            alt="유루빵 이미지"
            width={100}
            height={100}
            className="rounded-3xl"
          />

          <h1 className="text-2xl md:text-3xl font-extrabold mb-1 mt-2 text-[#4E342E]">
            유루빵에 오신 것을 환영합니다!
          </h1>

          <p className="text-sm text-[#6D4C41]">
            재고와 레시피를 쉽게 관리해보세요 🍞
          </p>

          <div className="w-full h-px bg-gray-300 my-3" />

          <h2 className="text-xl font-bold text-[#4E342E]">로그인</h2>
          <p className="text-[#6D4C41]">유루빵에 오신걸 환영합니다!</p>
          <PinLogin />

          <div className="w-full h-px bg-gray-300 my-3" />

          <p className="mb-2 text-[#6D4C41]">
            <span className="text-base font-bold">처음 오셨나요?</span> <br />
            간단한 등록 절차 후에 유루빵을 사용하실 수 있습니다😊
          </p>
          <Button
            onClick={() => router.push("/login/sign-up")}
            className="bg-[#A97155] hover:bg-[#8D5F45] text-white w-full max-w-[150px] py-3 rounded-xl shadow"
          >
            회원가입
          </Button>
        </div>
      </main>
    </div>
  );
}
