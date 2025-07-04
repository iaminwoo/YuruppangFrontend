"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface RecordItem {
  id: number;
  actualAt: string;
  type: "CONSUMPTION" | "PURCHASE" | string;
  description: string;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  totalPrice: number | null;
}

interface ApiResponse {
  resultCode: string;
  msg: string;
  data: {
    content: RecordItem[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalPages: number;
  };
}

export default function RecordsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecords = (pageNumber: number) => {
    setLoading(true);
    setError(null);

    fetchWithAuth(`${apiUrl}/api/ingredientLogs?page=${pageNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("네트워크 응답 오류");
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (data.resultCode === "OK") {
          setRecords(data.data.content);
          setPage(data.data.pageable.pageNumber);
          setTotalPages(data.data.totalPages);
        } else {
          setError(data.msg || "API 오류");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  const handlePrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNext = () => {
    if (page + 1 < totalPages) setPage(page + 1);
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans flex flex-col">
      <Navbar pageTitle="기록 확인 페이지" />

      <main className="px-4 py-6 max-w-3xl mx-auto w-full flex-grow">
        <h2 className="text-xl font-bold text-[#4E342E] mb-4">기록 확인</h2>

        {loading && (
          <div className="p-4 text-center text-[#A97155]">로딩중...</div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500">에러: {error}</div>
        )}

        {!loading && !error && (
          <>
            <ul className="space-y-4">
              {records.map((record) => (
                <li
                  key={record.id}
                  onClick={() => router.push(`/records/${record.id}`)}
                  className="py-2 px-6 md:py-4 bg-[#FFEED9] rounded-xl text-[#A97155] shadow-md"
                >
                  <div className="flex justify-between">
                    {/* 좌측 */}
                    <div className="flex flex-col gap-1">
                      {/* 상단: 날짜 & 타입 */}
                      <span>{record.actualAt.replace(/-/g, ".")}</span>

                      <span
                        className={`font-semibold ${
                          record.type === "PURCHASE"
                            ? "text-green-600"
                            : record.type === "CONSUMPTION"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {record.type === "PURCHASE"
                          ? "구매"
                          : record.type === "CONSUMPTION"
                          ? "소비"
                          : record.type}
                      </span>

                      {/* 설명 */}
                      <div className="mb-2 text-sm">{record.description}</div>
                    </div>
                    {/* 우측 */}
                    <div className="flex flex-col gap-1">
                      {/* 재료명 / 수량 / 총 가격 */}
                      <span className="flex-1 text-lg text-right font-bold">
                        {record.ingredientName}
                      </span>
                      <span className="flex-1 text-right">
                        {record.quantity.toLocaleString()} {record.unit}
                      </span>
                      <span className="flex-1 text-right">
                        {record.totalPrice !== null
                          ? `${record.totalPrice.toLocaleString()}원`
                          : "-"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* 페이징 버튼 */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={handlePrev}
                disabled={page === 0}
                className="w-24 bg-[#D7B49E] text-white py-2 rounded-xl disabled:bg-[#F1DCCB] disabled:text-[#C1A188]"
              >
                이전
              </Button>
              <Button
                onClick={handleNext}
                disabled={page + 1 >= totalPages}
                className="w-24 bg-[#D7B49E] text-white py-2 rounded-xl disabled:bg-[#F1DCCB] disabled:text-[#C1A188]"
              >
                다음
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
