"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecords = (pageNumber: number) => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:8080/api/ingredientLogs?page=${pageNumber}`)
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
      <Navbar />

      <main className="px-4 py-6 max-w-3xl mx-auto w-full flex-grow">
        <h2 className="text-2xl font-bold text-[#4E342E] mb-4">기록 확인</h2>

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
                  className="p-4 bg-[#FFEED9] rounded-xl text-[#A97155] shadow-md"
                >
                  {/* 상단: 날짜 & 타입 */}
                  <div className="flex justify-between mb-2 text-md">
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
                  </div>

                  {/* 설명 */}
                  <div className="text-sm mb-2">{record.description}</div>

                  {/* 재료명 / 수량 / 총 가격 */}
                  <div className="flex justify-between items-center text-base font-medium">
                    <span className="flex-1 text-lg font-bold">
                      {record.ingredientName}
                    </span>
                    <span className="flex-1 text-center">
                      {record.quantity.toLocaleString()} {record.unit}
                    </span>
                    <span className="flex-1 text-right">
                      {record.totalPrice !== null
                        ? `${record.totalPrice.toLocaleString()}원`
                        : "-"}
                    </span>
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
