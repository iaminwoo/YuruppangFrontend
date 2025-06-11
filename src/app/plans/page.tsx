"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PlanSimpleResponse {
  planId: number;
  planName: string;
  recipeNames: string[];
  recipeCount: number;
  isComplete: boolean;
}

interface ApiResponse {
  resultCode: string;
  msg: string;
  data: {
    content: PlanSimpleResponse[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalPages: number;
  };
}

export default function YuruppangPlanListPage() {
  const [plans, setPlans] = useState<PlanSimpleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchPlans = (pageNumber: number) => {
    setLoading(true);
    setError(null);

    fetch(`${apiUrl}/api/plans?page=${pageNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("네트워크 오류");
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (data.resultCode === "OK") {
          setPlans(data.data.content);
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
    fetchPlans(page);
  }, [page]);

  const handlePrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNext = () => {
    if (page + 1 < totalPages) setPage(page + 1);
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans flex flex-col text-sm">
      <Navbar />
      <main className="px-4 py-6 max-w-3xl mx-auto w-full flex-grow">
        <h2 className="text-xl font-bold text-[#4E342E] mb-6 mt-3">
          베이킹 플랜 목록
        </h2>

        {loading && (
          <div className="p-4 text-center text-[#A97155]">로딩중...</div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500">에러: {error}</div>
        )}

        <ul className="space-y-3">
          {plans.map((plan) => (
            <li
              key={plan.planId}
              onClick={() => router.push(`/plans/${plan.planId}`)}
              className="p-4 bg-[#FFEED9] rounded-xl text-[#A97155] shadow-md cursor-pointer hover:bg-[#FFDFAE] transition"
              title="상세보기"
            >
              <div className="font-bold mb-1">{plan.planName}</div>
              <div className="font-bold mb-1">
                포함된 레시피 : <br className="sm:hidden" />
                <span className="text-gray-600">
                  {plan.recipeNames.join(" /  ")}
                </span>
              </div>
              <div className="flex justify-between">
                <div className="text-gray-600">
                  레시피 개수: {plan.recipeCount}개
                </div>
                <div
                  className={
                    plan.isComplete ? "text-green-500" : "text-red-500"
                  }
                >
                  {plan.isComplete ? "완료" : "미완료"}
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
      </main>
    </div>
  );
}
