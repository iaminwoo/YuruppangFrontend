"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Image from "next/image";

interface Ingredient {
  ingredientName: string;
  quantity: number | string;
  unit: string;
  stock: number | string;
}

interface Part {
  partName: string;
  ingredients: Ingredient[];
}

interface AutoRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: AutoRegisterData) => void;
}

interface AutoRegisterData {
  name?: string;
  description?: string;
  outputQuantity?: number | string;
  categoryId?: number;
  parts?: Part[];
}

export default function AutoRegisterModal({
  isOpen,
  onClose,
  onSuccess,
}: AutoRegisterModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("레시피를 입력하세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/recipes/auto-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) throw new Error("레시피 자동 등록 실패");

      const json = await res.json();
      if (json.resultCode === "OK" && json.data) {
        onSuccess(json.data);
        handleClose();
      } else {
        throw new Error("레시피 데이터를 받아오지 못했습니다.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText("");
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">레시피 자동 등록</h2>
        <p className="mb-4">
          레시피를 줄글로 입력하시면 자동으로 재료가 입력됩니다.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="레시피 입력"
          className="border border-gray-300 p-3 w-full rounded-md mb-4 resize-none h-32"
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose} type="button">
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#B9896D] text-white"
            type="button"
            disabled={loading}
          >
            {loading ? "불러오는 중..." : "불러오기"}
          </Button>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Image
              src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGV2bnljM29iamlzeGY2eW9pazhsem5ya3BqbTRpZjB5dXFtcjRtcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6C9CMGMFtzzbO/giphy.gif"
              alt="Loading..."
              className="rounded-xl"
              width={200}
              height={200}
            />
          </div>
        )}
      </div>
    </div>
  );
}
