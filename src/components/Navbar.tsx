"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";

type NavbarProps = {
  pageTitle?: string;
};

export default function Navbar({ pageTitle }: NavbarProps) {
  const router = useRouter();

  const user = useUserStore((state) => state.user);

  return (
    <nav className="w-full px-4 py-3 md:py-2 bg-[#FFD8A9] shadow-md flex flex-col gap-2 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 로고 + 인사 */}
        <div className="flex gap-2 items-end shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <img src="/logo.png" alt="logo" className="w-8 h-8 md:w-8 md:h-8" />
            <span className="text-2xl md:text-2xl font-bold text-[#4E342E]">
              유루빵
            </span>
          </div>

          {user && (
            <div className="hidden sm:block text-base text-[#4E342E]">
              <span className="font-bold">{user.username}</span> 님 환영합니다
              👋
            </div>
          )}
        </div>

        {/* 가운데: 페이지 타이틀 */}
        <div className="flex-1 min-w-0 flex justify-end pr-3">
          <div
            className="hidden sm:block bg-[#FFFDF8] text-[#4E342E] text-xs font-semibold px-3 py-2 rounded-lg
      overflow-hidden whitespace-nowrap text-ellipsis max-w-[80%] text-center"
          >
            {pageTitle ?? "현재 페이지 위치"}
          </div>
        </div>

        {/* 오른쪽: 버튼들 */}
        <div className="flex gap-3 font-bold shrink-0">
          <Link
            href="/stock"
            className="text-[#FFEED9] bg-[#8D5F45] hover:bg-[#4E342E] text-base px-3 py-1 rounded-lg"
          >
            재고관리
          </Link>
          <Link
            href="/recipes"
            className="text-[#FFEED9] bg-[#8D5F45] hover:bg-[#4E342E] text-base px-3 py-1 rounded-lg"
          >
            레시피관리
          </Link>
        </div>
      </div>

      <div className="sm:hidden block flex text-base justify-between items-center h-6">
        {user && (
          <div className="text-[#4E342E]">
            <span className="font-bold">{user.username}</span> 님 환영합니다 👋
          </div>
        )}

        <div
          className="bg-[#FFFDF8] text-[#4E342E] text-xs font-semibold px-3 py-1 rounded-lg
        overflow-hidden whitespace-nowrap text-ellipsis max-w-1/2"
        >
          {pageTitle ? pageTitle : "현재 페이지 위치"}
        </div>
      </div>
    </nav>
  );
}
