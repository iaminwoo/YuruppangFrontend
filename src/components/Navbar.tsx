"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

type NavbarProps = {
  pageTitle?: string;
};

export default function Navbar({ pageTitle }: NavbarProps) {
  const router = useRouter();

  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleLogout = async () => {
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/users/logout`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("로그아웃 실패");
      }

      clearUser();

      router.push("/login");
    } catch {
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <nav className="w-full px-4 py-3 md:py-2 bg-[#FFD8A9] shadow-md flex flex-col gap-2 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-end">
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
            <div className="hidden sm:block text-[#4E342E]">
              <span className="font-bold">{user.username}</span> 님 환영합니다
              👋
            </div>
          )}
        </div>

        <div className="flex gap-3 font-bold">
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
          <Button
            onClick={handleLogout}
            className="hidden sm:block bg-[#8D5F45] hover:bg-[#4E342E] text-[#FFEED9] text-base px-3 py-1 rounded-lg font-bold h-8"
          >
            로그아웃
          </Button>
        </div>
      </div>

      <div className="sm:hidden block flex justify-between items-center h-6">
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
