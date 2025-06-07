"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface IngredientDetail {
  ingredientId: number;
  ingredientName: string;
  requiredQuantity: number;
  unit: string;
  stockQuantity: number;
}

interface Part {
  partName: string;
  ingredients: IngredientDetail[];
}

interface RecipeDetail {
  name: string;
  description: string;
  outputQuantity: number;
  totalPrice: number;
  parts: Part[];
  categoryName: string;
}

interface ApiResponse {
  resultCode: string;
  msg: string;
  data: RecipeDetail;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.recipeId as string;

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!recipeId) return;

    setLoading(true);
    setError(null);

    fetch(`http://localhost:8080/api/recipes/${recipeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("네트워크 오류");
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (data.resultCode === "OK") {
          setRecipe(data.data);
        } else {
          setError(data.msg || "API 오류");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [recipeId]);

  const handleDelete = async () => {
    if (!confirm("정말 이 레시피를 삭제하시겠습니까?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:8080/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "삭제 실패");
      }

      alert("레시피가 삭제되었습니다.");
      router.push("/recipes/search");
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message || "삭제 중 오류가 발생했습니다.");
      } else {
        alert("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans flex flex-col">
      <Navbar />

      <main className="px-4 py-6 max-w-3xl mx-auto w-full flex-grow">
        {/* 상단 버튼 바 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/recipes/search")}
            className="text-[#FFEED9] bg-[#8D5F45] hover:bg-[#4E342E] font-bold text-base md:text-xl px-5 py-2 rounded-xl"
          >
            목록으로 돌아가기
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/recipes/${recipeId}/edit`)}
              className="bg-[#D7B49E] text-white py-2 px-4 rounded-xl hover:bg-[#BFA37F] transition"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 text-white py-2 px-4 rounded-xl hover:bg-red-600 transition disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-4 text-center text-[#A97155]">로딩중...</div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500">에러: {error}</div>
        )}

        {recipe && (
          <>
            <div className="flex items-baseline gap-4 mt-6 mb-2">
              <h2 className="text-4xl font-bold text-[#4E342E]">
                {recipe.name}
              </h2>
              <span className="text-2xl font-bold text-[#6D4C41]">
                [{recipe.categoryName}]
              </span>
            </div>

            <p className="text-xl text-[#6D4C41] mb-12">{recipe.description}</p>

            <p className="text-2xl text-right text-gray-600 mb-1">
              <span className="text-gray-700 font-bold">완성 수량 : </span>
              {recipe.outputQuantity}개
            </p>

            <div className="h-px bg-gray-300 my-4" />

            <div className="text-xl text-gray-600">
              {" "}
              <span className="text-gray-700 font-bold">레시피 가격 : </span>
              {recipe.totalPrice}원
            </div>
            <div className="text-lg text-gray-600">
              <span className="text-gray-700 font-bold">( 개당 가격 : </span>{" "}
              {recipe.outputQuantity > 0
                ? Math.round(
                    recipe.totalPrice / recipe.outputQuantity
                  ).toLocaleString()
                : 0}
              원<span className="text-gray-700 font-bold"> )</span>
            </div>
            <div className="text-lg text-red-400 mb-6">
              구매해보지 않은 재료가 있으면 원가계산이 정확하지 않습니다.
            </div>

            <div className="h-px bg-gray-300 my-4" />

            {/* parts 배열 순회 */}
            {recipe.parts.map((part) => (
              <div key={part.partName} className="mb-10">
                <h3 className="text-2xl font-semibold mb-4 text-[#4E342E]">
                  {part.partName === "기본" ? "재료 목록" : part.partName}
                </h3>

                <div className="space-y-4">
                  <div className="bg-[#FFD8A9] rounded-xl shadow-md border px-6 py-2 flex items-center justify-between text-[#4E342E] font-semibold text-lg">
                    <div className="min-w-[100px] text-center">재료명</div>
                    <div className="min-w-[80px] text-center">필요 수량</div>
                    <div className="min-w-[80px] text-center">재고 수량</div>
                  </div>

                  {part.ingredients.map((item) => (
                    <div
                      key={item.ingredientId}
                      className="bg-[#FFF8F0] rounded-xl shadow-md border p-6 flex items-center justify-between hover:bg-[#FFF0DA] transition"
                    >
                      <div className="text-lg text-center font-semibold text-[#4E342E] min-w-[100px]">
                        {item.ingredientName}
                      </div>
                      <div className="text-md text-center text-[#4E342E] min-w-[80px]">
                        {item.requiredQuantity.toLocaleString()} {item.unit}
                      </div>
                      <div className="text-md text-center text-[#4E342E] min-w-[80px]">
                        {item.stockQuantity.toLocaleString()} {item.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
