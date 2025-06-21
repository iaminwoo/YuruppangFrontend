// app/records/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface RecordDetail {
  id: number;
  actualAt: string;
  type: "PURCHASE" | "CONSUMPTION" | string;
  description: string;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  totalPrice: number | null;
}

export default function RecordDetailPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { id } = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchWithAuth(`${apiUrl}/api/ingredientLogs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("네트워크 오류");
        return res.json();
      })
      .then((data) => {
        if (data.resultCode === "OK") {
          setRecord(data.data);
        } else {
          throw new Error(data.msg || "API 오류");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-[#A97155]">로딩 중...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">에러: {error}</div>;
  }

  if (!record) return null;

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar />
      <main className="px-4 py-6 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-[#4E342E] mb-4">기록 상세</h2>
        <div className="bg-[#FFEED9] rounded-xl p-6 shadow-md text-[#A97155] space-y-3">
          <div className="flex justify-between text-sm">
            <span>{record.actualAt.replace(/-/g, ".")}</span>

            <span
              className={`font-semibold ${
                record.type === "PURCHASE" ? "text-green-600" : "text-red-600"
              }`}
            >
              {record.type === "PURCHASE" ? "구매" : "소비"}
            </span>
          </div>

          <div className="text-sm">{record.description}</div>

          <div className="text-lg font-bold">{record.ingredientName}</div>

          <div className="text-sm">
            수량: {record.quantity.toLocaleString()} {record.unit}
          </div>

          {record.totalPrice !== null && (
            <div className="text-sm">
              총 가격: {record.totalPrice.toLocaleString()}원
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            onClick={() => router.push(`/records/${record.id}/edit`)}
            className="bg-[#A97155] text-white rounded-xl px-6 py-2"
          >
            수정
          </Button>
          <Button
            onClick={async () => {
              const confirmed = confirm("정말 삭제하시겠습니까?");
              if (!confirmed) return;

              try {
                const res = await fetchWithAuth(
                  `${apiUrl}/api/ingredientLogs/${record.id}`,
                  {
                    method: "DELETE",
                  }
                );

                if (!res.ok) throw new Error("삭제 실패");

                alert("삭제되었습니다.");
                router.push("/records");
              } catch (err) {
                alert("오류 발생: " + err);
              }
            }}
            className="bg-red-500 text-white rounded-xl px-6 py-2"
          >
            삭제
          </Button>
        </div>
        <div className="mt-6 text-center">
          <Button
            onClick={() => router.push("/records")}
            className="bg-[#D7B49E] text-white rounded-xl px-6 py-2"
          >
            목록으로 돌아가기
          </Button>
        </div>
      </main>
    </div>
  );
}
