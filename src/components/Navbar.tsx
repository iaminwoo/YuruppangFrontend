"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="w-full px-4 py-3 md:py-2 bg-[#FFD8A9] flex items-center justify-between shadow-md">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <img src="/logo.png" alt="logo" className="w-8 h-8 md:w-8 md:h-8" />
        <span className="text-2xl md:text-2xl font-bold text-[#4E342E]">
          유루빵
        </span>
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
      </div>
    </nav>
  );
}
