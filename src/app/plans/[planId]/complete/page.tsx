"use client";

import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// API에서 받아오는 Recipe 타입 정의
interface RecipeDetail {
  recipeId: number;
  recipeName: string;
  recipeDescription: string;
  isTemp: boolean;
}

interface Ingredient {
  ingredientId: number;
  name: string;
  requiredQuantity: number;
  currentStock: number;
  lackingQuantity: number;
}

// API에서 받아오는 PlanDetailResponse 타입 정의
interface PlanDetailResponse {
  memo: string;
  isComplete: boolean;
  recipeDetails: RecipeDetail[];
  lackIngredients: Ingredient[];
}

export default function PlanCompletePage() {
  const { planId } = useParams();
  const router = useRouter();
  const [tempRecipes, setTempRecipes] = useState<RecipeDetail[]>([]);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // 수정된 이름/설명을 저장할 상태
  const [modifiedRecipes, setModifiedRecipes] = useState<{
    [key: number]: { recipeName: string; recipeDescription: string };
  }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    fetch(`http://localhost:8080/api/plans/${planId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.resultCode === "OK") {
          const planData: PlanDetailResponse = data.data;
          // isTemp가 true인 레시피만 필터링
          const temps = planData.recipeDetails.filter((r) => r.isTemp);
          setTempRecipes(temps);
          // 모든 기존 레시피 이름 추출 (temp 포함)
          const allNames = planData.recipeDetails.map((r) => r.recipeName);
          setExistingNames(allNames);
          // 초기 modifiedRecipes 세팅
          const initMods: {
            [key: number]: { recipeName: string; recipeDescription: string };
          } = {};
          temps.forEach((r) => {
            initMods[r.recipeId] = {
              recipeName: r.recipeName,
              recipeDescription: r.recipeDescription,
            };
          });
          setModifiedRecipes(initMods);
        } else {
          toast.error("플랜 정보를 불러오는 데 실패했습니다.");
        }
      })
      .catch(() => {
        toast.error("네트워크 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));
  }, [planId]);

  // 입력 값 변경 핸들러
  const handleInputChange = (
    recipeId: number,
    field: "recipeName" | "recipeDescription",
    value: string
  ) => {
    setModifiedRecipes((prev) => ({
      ...prev,
      [recipeId]: {
        ...prev[recipeId],
        [field]: value,
      },
    }));
  };

  // 플랜 완료 요청 핸들러
  const handleComplete = async () => {
    if (submitting) return;
    // 검증: 이름/설명 비어 있지 않게
    const names: string[] = [];
    for (const r of tempRecipes) {
      const mod = modifiedRecipes[r.recipeId];
      const trimmedName = mod.recipeName.trim();
      if (!trimmedName || !mod.recipeDescription.trim()) {
        toast.error("모든 레시피의 이름과 설명을 입력해주세요.");
        return;
      }
      names.push(trimmedName);
      // 기존 레시피 이름과 중복 여부 체크
      if (existingNames.includes(trimmedName)) {
        toast.error(`${trimmedName} : 레시피 이름을 변경해주세요.`);
        return;
      }
    }
    // 중복 체크: temp 간 이름 중복
    const nameSet = new Set(names);
    if (nameSet.size !== names.length) {
      toast.error("레시피 이름이 중복되었습니다.");
      return;
    }
    // DTO 배열 생성
    const recipeDtos = tempRecipes.map((r) => {
      const mod = modifiedRecipes[r.recipeId];
      return {
        recipeId: r.recipeId,
        newName: mod.recipeName.trim(),
        newDescription: mod.recipeDescription.trim(),
      };
    });
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8080/api/plans/${planId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes: recipeDtos }),
      });
      const json = await res.json();
      if (json.resultCode === "OK") {
        toast.success("플랜이 성공적으로 완료되었습니다.");
        router.push("/plans");
      } else {
        toast.error("플랜 완료에 실패했습니다.");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // "돌아가기" 버튼 클릭 시 플랜 상세 페이지로 이동
  const handleGoBack = () => {
    router.push(`/plans/${planId}`);
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar />
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4E342E] mb-4">
          플랜 완료 페이지
        </h1>
        {loading ? (
          <p className="text-center text-[#A97155]">로딩 중...</p>
        ) : (
          <>
            {tempRecipes.length > 0 ? (
              <div className="space-y-6">
                {/* 상단 안내 문구 */}
                <p className="mb-6 text-[#4E342E]">
                  수정된 레시피의 이름과 설명을 입력해주세요. 레시피의 이름은
                  중복될 수 없습니다.
                </p>

                {tempRecipes.map((r) => (
                  <div
                    key={r.recipeId}
                    className="border border-[#D7B49E] p-4 rounded-xl bg-[#FFEED9]"
                  >
                    <label className="block font-semibold mb-1 text-[#4E342E]">
                      레시피 이름
                    </label>
                    <input
                      type="text"
                      value={modifiedRecipes[r.recipeId]?.recipeName || ""}
                      onChange={(e) =>
                        handleInputChange(
                          r.recipeId,
                          "recipeName",
                          e.target.value
                        )
                      }
                      className="border border-gray-300 p-2 w-full rounded-md mb-4"
                    />
                    <label className="block font-semibold mb-1 text-[#4E342E]">
                      레시피 설명
                    </label>
                    <textarea
                      value={
                        modifiedRecipes[r.recipeId]?.recipeDescription || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          r.recipeId,
                          "recipeDescription",
                          e.target.value
                        )
                      }
                      className="border border-gray-300 p-2 w-full rounded-md mb-4"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <span className="text-center text-xl text-[#4E342E] block sm:hidden">
                  수정한 레시피가 없습니다.
                  <br />
                  플랜 완료를 눌러주세요~!
                </span>
                <span className="text-center text-xl text-[#4E342E] hidden sm:inline">
                  수정한 레시피가 없습니다. 플랜 완료를 눌러주세요~!
                </span>
              </div>
            )}

            <div className="flex justify-center mt-6 gap-4">
              {/* 플랜 완료 버튼 */}
              <Button
                onClick={handleComplete}
                disabled={submitting}
                className="px-6 py-3 bg-[#A97155] text-white rounded-md"
              >
                {submitting ? "완료 중..." : "플랜 완료"}
              </Button>

              {/* 돌아가기 버튼 */}
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="px-6 py-3"
              >
                돌아가기
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
