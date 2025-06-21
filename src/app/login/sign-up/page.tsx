"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();

  const usernameRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const pinConfirmRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!username) {
      setError("사용자명을 입력해주세요.");
      usernameRef.current?.focus();
      return;
    }

    if (!pin) {
      setError("PIN 번호를 입력해주세요.");
      pinRef.current?.focus();
      return;
    }

    if (pin.length !== 4) {
      setError("PIN 번호는 4자리여야 합니다.");
      pinRef.current?.focus();
      return;
    }

    if (!pinConfirm) {
      setError("PIN 확인란을 입력해주세요.");
      pinConfirmRef.current?.focus();
      return;
    }

    if (pin !== pinConfirm) {
      setError("PIN 번호가 일치하지 않습니다.");
      setPinConfirm("");
      pinConfirmRef.current?.focus();
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      username: username.trim(),
      pin: pin.trim(),
    };

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "회원가입에 실패했습니다.");
      }

      // 사용자 이름 등 저장

      alert("회원가입이 완료되었습니다.");
      router.push("/"); // 혹은 메인화면 등
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("예기치 않은 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFF8F0] min-h-screen font-sans flex flex-col text-sm">
      <main className="px-4 py-6 max-w-3xl mx-auto w-full flex-grow flex items-center justify-center">
        <div className="flex flex-col text-center items-center justify-center w-full max-w-sm">
          <Image
            src="/yuru.png"
            alt="유루빵 이미지"
            width={200}
            height={200}
            className="rounded-3xl mb-4"
          />

          <p className="text-[#6D4C41] mb-1">당신의 베이킹이 더 쉬워지는</p>
          <p className="text-[#6D4C41] mb-2">
            <span className="font-bold text-base">유루빵</span> 에 오신 것을
            환영합니다 ❤️
          </p>

          <h2 className="text-2xl font-bold text-[#4E342E]">회원가입</h2>

          <div className="w-full h-px bg-gray-300 mt-2 mb-4" />

          {/* 사용자명 */}
          <label className="text-left w-full text-lg text-[#4E342E] font-semibold mb-1">
            사용자명{" "}
            <span className="text-xs font-normal">
              ( 이후 변경할 수 있습니다. )
            </span>
          </label>
          <input
            ref={usernameRef}
            type="text"
            placeholder="이름을 입력해주세요."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-3 p-2 border rounded w-full"
          />

          {/* PIN */}
          <label className="text-left w-full text-lg text-[#4E342E] font-semibold mb-1">
            핀 번호 (4자리){" "}
            <span className="text-xs font-normal">
              ( 이후 변경할 수 있습니다. )
            </span>
          </label>
          <input
            ref={pinRef}
            type="password"
            inputMode="numeric" // 모바일에서 숫자 키패드 유도
            pattern="\d{4}"
            placeholder="4자리의 핀 번호를 입력해주세요."
            value={pin}
            maxLength={4}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="mb-3 p-2 border rounded w-full"
          />

          {/* PIN 확인 */}
          <label className="text-left w-full text-lg text-[#4E342E] font-semibold mb-1">
            핀 번호 확인
          </label>
          <input
            ref={pinConfirmRef}
            type="password"
            inputMode="numeric" // 모바일에서 숫자 키패드 유도
            pattern="\d{4}"
            placeholder="입력하신 핀 번호를 다시 확인합니다."
            value={pinConfirm}
            maxLength={4}
            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
            className="mb-3 p-2 border rounded w-full"
          />

          {/* 에러 메시지 */}
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          {/* 가입 버튼 */}
          <Button
            className="bg-[#A97155] hover:bg-[#8D5F45] text-white w-full text-lg py-5 rounded-xl shadow"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "회원가입 중..." : "회원가입"}
          </Button>
        </div>
      </main>
    </div>
  );
}
