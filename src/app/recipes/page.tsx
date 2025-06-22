"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface RecipeItem {
  recipeId: number;
  recipeName: string;
  outputQuantity: number;
  favorite: boolean;
}

interface BakingPlan {
  planId: number;
  planName: string;
  createdAt: string;
  completedAt: string;
  recipeNames: string[];
  recipeCount: number;
  isComplete: boolean;
}

interface ApiResponse {
  resultCode: string;
  msg: string;
  data: {
    content: RecipeItem[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalPages: number;
  };
}

export default function RecipePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();

  // ─── 추가된 상태 ───────────────────────────────
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ───────────────────────────────────────────────

  const [plans, setPlans] = useState<BakingPlan[]>([]);

  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      setError(null);

      try {
        const [recipeRes, planRes] = await Promise.all([
          fetchWithAuth(`${apiUrl}/api/recipes?page=0&size=6&sortBy=id`),
          fetchWithAuth(`${apiUrl}/api/plans?page=0&size=6&sortBy=id`),
        ]);

        if (!recipeRes.ok || !planRes.ok) {
          throw new Error("네트워크 응답 오류");
        }

        const recipeData: ApiResponse = await recipeRes.json();
        const planData = await planRes.json(); // 여긴 별도 타입 안 쓰면 any로 받아도 됨

        if (recipeData.resultCode === "OK") {
          setRecipes(recipeData.data.content);
        } else {
          setError(recipeData.msg || "레시피 API 에러");
        }

        if (planData.resultCode === "OK") {
          setPlans(planData.data.content);
        } else {
          setError(planData.msg || "플랜 API 에러");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, []);

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar pageTitle="레시피 메인 페이지" />
      <main className="px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
        <h2 className="text-xl font-bold text-[#4E342E] mb-4">레시피 관리</h2>

        {/* 버튼 영역 */}
        <div className="flex gap-2 sm:gap-4 mb-6">
          <Button
            className="flex-2 bg-[#D7B49E] text-white py-6 rounded-xl"
            onClick={() => router.push("/recipes/search")}
          >
            레시피 검색
          </Button>
          <Button
            className="flex-2 bg-[#C89F84] text-white py-6 rounded-xl"
            onClick={() => router.push("/recipes/add")}
          >
            레시피 등록
          </Button>
          <Button
            className="flex-1 bg-[#B9896D] text-white py-6 rounded-xl"
            onClick={() => router.push("/recipes/categories")}
          >
            <span className="block text-sm sm:hidden">
              카테고리
              <br />
              관리
            </span>
            <span className="hidden sm:inline">카테고리 관리</span>
          </Button>
        </div>

        {/* ─────────── 최신 5개 레시피 영역 ─────────── */}
        <div className="w-full bg-[#FFEED9] rounded-xl p-4">
          <h3 className="text-base font-semibold text-[#4E342E] mb-3">
            최근 등록된 레시피
          </h3>

          {loading && (
            <div className="text-center text-[#A97155] py-6">로딩중...</div>
          )}

          {error && (
            <div className="text-center text-red-500 py-6">
              에러 발생: {error}
            </div>
          )}

          {!loading && !error && recipes.length === 0 && (
            <div className="text-center text-gray-700 py-6">
              최근 등록한 레시피가 여기 표시됩니다.
            </div>
          )}

          {!loading && !error && recipes.length > 0 && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recipes.map((recipe) => (
                <li
                  key={recipe.recipeId}
                  className="p-3 bg-white rounded-lg flex justify-center items-center shadow-sm hover:bg-[#F9F5F1] cursor-pointer"
                  onClick={() => router.push(`/recipes/${recipe.recipeId}`)}
                >
                  <span className="text-base font-bold text-[#4E342E]">
                    {recipe.recipeName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* ────────────────────────────────────────── */}

        <h2 className="text-xl font-bold text-[#4E342E] mb-4 mt-8">
          베이킹 플랜 관리
        </h2>

        {/* 버튼 영역 */}
        <div className="flex gap-4 mb-6">
          <Button
            className="flex-1 bg-[#D7B49E] text-white py-6 text-sm rounded-xl"
            onClick={() => router.push("/plans")}
          >
            베이킹 플랜 검색
          </Button>
        </div>

        <div className="w-full text-sm bg-[#FFEED9] rounded-xl p-4 items-center justify-center text-[#A97155]">
          <h3 className="text-base font-semibold text-[#4E342E] mb-3">
            최근 등록된 베이킹 플랜
          </h3>

          {loading && (
            <div className="text-center text-[#A97155] py-6">로딩중...</div>
          )}

          {error && (
            <div className="text-center text-red-500 py-6">
              에러 발생: {error}
            </div>
          )}

          {!loading && !error && plans.length === 0 && (
            <div className="text-center text-gray-700 py-6">
              최근 등록한 베이킹 플랜이 여기 표시됩니다.
            </div>
          )}

          {!loading && !error && plans.length > 0 && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <li
                  key={plan.planId}
                  className="p-3 bg-white rounded-lg shadow-sm hover:bg-[#F9F5F1] cursor-pointer space-y-1"
                  onClick={() => router.push(`/plans/${plan.planId}`)}
                >
                  <div className="font-bold mb-1 text-sm">
                    포함된 레시피 : <br className="sm:hidden" />
                    <span className="text-gray-600">
                      {plan.recipeNames.join(" /  ")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mb-1 text-xs">
                    {plan.completedAt ? (
                      <div>플랜 완성일 : {plan.completedAt}</div>
                    ) : (
                      <div>플랜 생성일 : {plan.createdAt}</div>
                    )}
                  </div>
                  <div className="text-xs text-[#8D6E63]">
                    레시피 수: {plan.recipeCount} /{" "}
                    <span
                      className={
                        plan.isComplete ? "text-green-600" : "text-red-500"
                      }
                    >
                      {plan.isComplete ? "완료" : "미완료"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
