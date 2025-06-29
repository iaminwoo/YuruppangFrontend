"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useUserStore } from "@/store/user";

export default function PinLogin() {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();

  const onDigit = async (digit: string) => {
    if (loading) return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 4) {
        await onSubmit(newPin); // 여기서만 호출
      }
    }
  };

  const onBackspace = () => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const onClear = () => {
    if (loading) return;
    setPin("");
  };

  const onSubmit = async (submittedPin: string) => {
    if (loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: submittedPin }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText);
        setPin("");
        return;
      }

      const data = await res.json();

      useUserStore
        .getState()
        .setUser({ userId: data.data.userId, username: data.data.username });

      router.push("/");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("알 수 없는 오류가 발생했습니다.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const digits = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["CLEAR", "0", "←"],
  ];

  return (
    <div className="flex flex-col items-center">
      {/* PIN 표시 */}
      <div className="flex space-x-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 border-b-2 border-gray-400 text-center text-xl"
          >
            {pin[i] !== undefined ? "*" : ""}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-2 text-red-600 text-sm font-semibold">{error}</div>
      )}

      {/* 다이얼 패드 */}
      <div className="grid grid-cols-3 gap-3">
        {digits.flat().map((d, idx) => (
          <button
            key={idx}
            disabled={loading}
            className={`
      w-16 h-16 rounded-full text-white flex items-center justify-center
      ${
        d === "CLEAR" || d === "←"
          ? "bg-[#d8a88f] hover:bg-[#ac8876]"
          : "bg-[#A97155] hover:bg-[#8D5F45]"
      }
      text-2xl
      ${d === "CLEAR" ? "text-sm" : ""}
      ${loading ? "opacity-50 cursor-not-allowed" : ""}
    `}
            onClick={() => {
              if (loading) return;
              if (d === "←") onBackspace();
              else if (d === "CLEAR") onClear();
              else if (d) onDigit(d);
            }}
          >
            {d === "←" ? "⌫" : d}
          </button>
        ))}
      </div>

      {/* 게스트 로그인 버튼 */}
      <button
        onClick={() => onSubmit("0000")}
        disabled={loading}
        className="mt-2 text-base text-[#4E342E] underline hover:text-gray-900 disabled:opacity-50"
      >
        게스트 계정으로 입장하기
      </button>
    </div>
  );
}
