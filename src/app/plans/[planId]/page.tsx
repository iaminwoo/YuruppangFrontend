"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import IngredientSearchModal from "@/components/IngredientSearchModal";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LackingIngredientsSection from "@/components/plans/LackingIngredients";
import RecipeDetail from "@/components/plans/RecipeDetail";
import * as PlanTypes from "@/types";

export default function PlanDetailPage() {
  const { planId } = useParams();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  // ──────────────────────────────────────────────────────────────────────────────
  // 플랜 전체 상태
  // ──────────────────────────────────────────────────────────────────────────────
  const [plan, setPlan] = useState<PlanTypes.PlanDetail | null>(null);
  const [memo, setMemo] = useState("");
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [editingRecipe, setEditingRecipe] = useState<PlanTypes.Recipe | null>(
    null
  );
  const [newGoalQuantity, setNewGoalQuantity] = useState<string | number>("");
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────────
  // ‘레시피 추가’ 모달 관련 상태
  // ──────────────────────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<
    PlanTypes.RecipeSearchItem[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────────────────────────
  // 배율 변경 모달 관련 상태
  // ──────────────────────────────────────────────────────────────────────────────
  // 모달 열림/닫힘 여부
  const [showScaleModal, setShowScaleModal] = useState(false);

  // 1) 전체 목표 수량 배율 입력값 (퍼센트, ex: 120)
  const [overallPercent, setOverallPercent] = useState<number>(100);
  // 디바운스 후 계산된 새 목표 수량
  const [calculatedNewGoal, setCalculatedNewGoal] = useState<number>(
    editingRecipe?.outputQuantity || 0
  );
  // 디바운스 타이머 ID
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // 재료 검색 모달 관련 상태
  // ──────────────────────────────────────────────────────────────────────────────
  // 현재 열려 있는지 여부
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  // 모달을 연 재료가 속한 partIndex, ingredientIndex
  const [currentPartIndex, setCurrentPartIndex] = useState<number | null>(null);
  const [currentIngredientIndex, setCurrentIngredientIndex] = useState<
    number | null
  >(null);
  const [replaceTarget, setReplaceTarget] = useState<{
    ingredientId?: number | null;
    name: string;
  } | null>(null);

  // 2) 파트별 배율 입력값 배열 (각 파트마다 입력할 퍼센트)
  const [partPercents, setPartPercents] = useState<number[]>([]);

  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  useEffect(() => {
    if (shouldAutoSubmit && editingRecipe) {
      handleIngredientsSubmit();
      setShouldAutoSubmit(false);
    }
  }, [editingRecipe, shouldAutoSubmit]);

  // ──────────────────────────────────────────────────────────────────────────────
  // 플랜 상세 조회 함수
  // ──────────────────────────────────────────────────────────────────────────────
  const fetchPlanDetail = async () => {
    if (!planId) return;
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/plans/${planId}`);
      if (!res.ok) throw new Error(`플랜 상세 조회 실패: ${res.status}`);
      const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
        await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "플랜 API 오류");
      }
      const d = json.data;
      const converted: PlanTypes.PlanDetail = {
        name: d.name,
        memo: d.memo,
        isComplete: d.isComplete,
        recipeDetails: d.recipeDetails.map((r: PlanTypes.ApiRecipeDetail) => ({
          recipeId: r.recipeId,
          name: r.recipeName,
          description: r.recipeDescription,
          totalPrice: r.totalPrice,
          customName: r.customRecipeName,
          customDescription: r.customRecipeDescription,
          pan: r.pan,
          outputQuantity: r.outputQuantity,
          goalQuantity: r.goalQuantity,
          percent: r.percent,
          comparedParts: r.comparedParts.map(
            (p: PlanTypes.ApiComparedPart) => ({
              partName: p.partName,
              percent: p.percent,
              comparedIngredients: p.comparedIngredients.map(
                (ing: PlanTypes.ApiComparedIngredient) => ({
                  ingredientId: ing.ingredientId,
                  ingredientName: ing.ingredientName,
                  unit: ing.unit,
                  originalQuantity: ing.originalQuantity,
                  customizedQuantity: ing.customizedQuantity,
                })
              ),
            })
          ),
        })),
        lackIngredients: d.lackIngredients.map(
          (item: PlanTypes.Ingredient) => ({
            ingredientId: item.ingredientId,
            name: item.name,
            requiredQuantity: item.requiredQuantity,
            currentStock: item.currentStock,
            lackingQuantity: item.lackingQuantity,
          })
        ),
      };

      setPlan(converted);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // 컴포넌트 마운트 시 플랜 상세 조회
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchPlanDetail();
  }, [planId]);

  // 플랜이 바뀌거나 선택된 레시피 인덱스가 바뀔 때 editingRecipe 초기화
  useEffect(() => {
    if (!plan) return;
    setMemo(plan.memo || "");
    const recipe = plan.recipeDetails[selectedRecipeIndex];
    setEditingRecipe(recipe ? structuredClone(recipe) : null);
    setNewGoalQuantity(recipe ? recipe.goalQuantity : "");
  }, [plan, selectedRecipeIndex]);

  // ──────────────────────────────────────────────────────────────────────────────
  // 검색 모달에서 레시피 검색 함수
  // ──────────────────────────────────────────────────────────────────────────────
  const searchRecipes = async () => {
    if (searchKeyword.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      // 페이지는 0, 사이즈는 10으로 제한. sortBy=name으로 이름순 정렬
      const url = `${apiUrl}/api/recipes?page=0&size=10&sortBy=name&keyword=${encodeURIComponent(
        searchKeyword.trim()
      )}`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(`레시피 검색 실패: ${res.status}`);
      const json: PlanTypes.ApiResponse<PlanTypes.RecipeSearchResponse> =
        await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "레시피 검색 API 오류");
      }
      setSearchResults(json.data.content);
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setIsSearching(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 모달에서 레시피 추가 핸들러
  // ──────────────────────────────────────────────────────────────────────────────
  const handleAddRecipeInModal = async (recipeIdToAdd: number) => {
    if (!planId) return;
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/plans/${planId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipeIdToAdd }),
      });
      if (!res.ok) throw new Error(`레시피 추가 요청 실패: ${res.status}`);
      const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
        await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "레시피 추가 오류");
      }
      toast.success("레시피가 플랜에 추가되었습니다.");
      setShowAddModal(false);
      setSearchKeyword("");
      setSearchResults([]);
      // 플랜을 다시 불러와 상태 업데이트
      fetchPlanDetail();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleIngredientsSubmit = async () => {
    if (!editingRecipe) return;
    if (isSavingRecipe) return;
    setIsSavingRecipe(true);

    for (const part of editingRecipe.comparedParts) {
      for (const ing of part.comparedIngredients) {
        if (!ing.ingredientName || ing.customizedQuantity === "" || !ing.unit) {
          toast.error("모든 재료 항목을 입력해 주세요.");
          return;
        }
        if (isNaN(Number(ing.customizedQuantity))) {
          toast.error("필요량은 숫자여야 합니다.");
          return;
        }
      }
    }
    try {
      const res = await fetchWithAuth(
        `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/ingredients`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editingRecipe.comparedParts.map((part) => ({
              partName: part.partName,
              ingredients: part.comparedIngredients.map((ing) => ({
                ingredientName: ing.ingredientName,
                unit: ing.unit,
                quantity: Number(ing.customizedQuantity),
              })),
            }))
          ),
        }
      );
      if (!res.ok) throw new Error(`재료 수정 실패: ${res.status}`);
      const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
        await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "재료 수정 오류");
      }
      toast.success("재료가 수정되었습니다.");
      fetchPlanDetail();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleIngredientSelect = (selected: {
    ingredientId?: number;
    ingredientName: string;
  }) => {
    // 교체 모드 (부족한 재료에서 연 경우)
    if (replaceTarget && editingRecipe) {
      if (
        !window.confirm(
          `${replaceTarget.name}을(를) ${selected.ingredientName}으로 전체 교체하시겠습니까?`
        )
      ) {
        setReplaceTarget(null);
        setShowIngredientModal(false);
        return;
      }

      const updatedParts = editingRecipe.comparedParts.map((part) => ({
        ...part,
        comparedIngredients: part.comparedIngredients.map((ing) => {
          const matches =
            (replaceTarget.ingredientId != null &&
              ing.ingredientId === replaceTarget.ingredientId) ||
            (!replaceTarget.ingredientId &&
              ing.ingredientName === replaceTarget.name);

          if (!matches) return ing;

          return {
            ...ing,
            ingredientId: selected.ingredientId ?? ing.ingredientId,
            ingredientName: selected.ingredientName,
          };
        }),
      }));

      setEditingRecipe((prev) =>
        prev ? { ...prev, comparedParts: updatedParts } : prev
      );
      setShowIngredientModal(false);
      setReplaceTarget(null);

      // 자동 제출 예약
      setShouldAutoSubmit(true);
      return;
    }

    // 개별 선택 모드 (원래 동작)
    if (currentPartIndex == null || currentIngredientIndex == null) {
      setShowIngredientModal(false);
      return;
    }

    const updatedParts = [...(editingRecipe?.comparedParts ?? [])];
    updatedParts[currentPartIndex].comparedIngredients[currentIngredientIndex] =
      {
        ...updatedParts[currentPartIndex].comparedIngredients[
          currentIngredientIndex
        ],
        ingredientId:
          selected.ingredientId ??
          updatedParts[currentPartIndex].comparedIngredients[
            currentIngredientIndex
          ].ingredientId,
        ingredientName: selected.ingredientName,
      };

    setEditingRecipe((prev) =>
      prev ? { ...prev, comparedParts: updatedParts } : prev
    );
    setShowIngredientModal(false);
    setCurrentPartIndex(null);
    setCurrentIngredientIndex(null);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // RESET 핸들러 (기존)
  // ──────────────────────────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────────────────────────
  // 메모 저장 핸들러 (기존)
  // ──────────────────────────────────────────────────────────────────────────────
  const handleMemoSubmit = async () => {
    if (!plan) return;
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/plans/${planId}/memo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newMemo: memo }),
      });
      if (!res.ok) throw new Error(`메모 저장 실패: ${res.status}`);
      const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
        await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "메모 저장 오류");
      }
      toast.success("메모가 저장되었습니다.");
      fetchPlanDetail();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 플랜 삭제 핸들러 (기존)
  // ──────────────────────────────────────────────────────────────────────────────
  const handleDeletePlan = async () => {
    const confirmed = confirm(
      "정말 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다."
    );
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/plans/${planId}`, {
        method: "DELETE",
      });
      const data: PlanTypes.ApiResponse<string> = await res.json();
      if (data.resultCode === "OK") {
        toast.success("생산 계획이 삭제되었습니다.");
        router.push("/plans");
      } else {
        throw new Error(data.msg || "삭제 오류");
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // 완성하기 버튼 핸들러 (기존)
  const handleCompleteClick = () => {
    if (!plan) return;
    if (plan.lackIngredients && plan.lackIngredients.length > 0) {
      toast.error("재료가 충분하지 않습니다!");
      return;
    }
    router.push(`/plans/${planId}/complete`);
  };

  // 모달이 열릴 때 전체/파트별 배율 초기값을 세팅

  // overallPercent가 바뀔 때마다 0.5초 디바운스 후 새 목표 수량 계산
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // 입력이 없으면(전체 퍼센트가 NaN이거나 <=0) 계산하지 않음
    if (isNaN(overallPercent) || overallPercent <= 0) {
      setCalculatedNewGoal(0);
      return;
    }

    const timer = setTimeout(() => {
      if (!editingRecipe) return;
      const baseOutput = editingRecipe.outputQuantity;
      const newGoal = Math.round((baseOutput * overallPercent) / 100);
      setCalculatedNewGoal(newGoal);
    }, 500);

    setDebounceTimer(timer);

    return () => {
      clearTimeout(timer);
    };
  }, [overallPercent, editingRecipe]);

  return (
    <>
      <div className="bg-[#FFFDF8] min-h-screen font-sans text-sm">
        <Navbar
          pageTitle={
            !plan || !editingRecipe
              ? "베이킹플랜/로딩중..."
              : plan.isComplete
              ? `베이킹플랜/${editingRecipe.customName}`
              : `베이킹플랜/${editingRecipe.name}`
          }
        />

        {(!plan || !editingRecipe) && (
          <div className="p-6 text-center text-[#A97155]">로딩 중...</div>
        )}

        {plan && editingRecipe && (
          <main className="p-3 sm:p-6 max-w-5xl mx-auto space-y-10">
            <button
              onClick={() => router.push("/plans")}
              className="text-[#FFEED9] bg-[#8D5F45] hover:bg-[#4E342E] font-bold text-base md:text-sm px-5 py-2 rounded-xl"
            >
              목록으로 돌아가기
            </button>
            {/* 1. 플랜 이름 */}
            <section>
              <h2 className="text-xl sm:text-3xl font-extrabold text-gray-800">
                {plan.name}
              </h2>
            </section>

            {/* 2. 부족한 재료 목록 */}
            <LackingIngredientsSection
              isComplete={plan.isComplete}
              lackIngredients={plan.lackIngredients}
              setReplaceTarget={setReplaceTarget}
              setShowIngredientModal={setShowIngredientModal}
            />

            {/* 3. 레시피 선택 & 추가 */}
            <section>
              <div className="flex gap-2 items-center mb-3">
                <h2 className="text-xl font-extrabold mb-0">레시피 선택</h2>

                {!plan.isComplete && (
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#D7B49E] text-white px-3 py-2 rounded-full"
                  >
                    + 레시피 추가
                  </Button>
                )}
              </div>

              {/* 레시피 탭 버튼들 */}
              <div className="mb-3 grid grid-cols-3 gap-2">
                {plan.recipeDetails.map((recipe, idx) => {
                  const isSelected = idx === selectedRecipeIndex;
                  return (
                    <Button
                      key={recipe.recipeId}
                      onClick={() => setSelectedRecipeIndex(idx)}
                      className={[
                        "block w-full min-w-0 truncate text-center rounded-lg px-2 py-2 font-semibold transition",
                        isSelected
                          ? "bg-[#A97155] text-white"
                          : "bg-[#EAD9C4] text-[#7C6E65]",
                      ].join(" ")}
                    >
                      {recipe.name}
                    </Button>
                  );
                })}
              </div>

              {/* 4. 선택된 레시피 상세 카드 */}
              <RecipeDetail
                plan={plan}
                editingRecipe={editingRecipe}
                selectedRecipeIndex={selectedRecipeIndex}
                newGoalQuantity={newGoalQuantity}
                isSavingRecipe={isSavingRecipe}
                handleIngredientsSubmit={handleIngredientsSubmit}
                setNewGoalQuantity={setNewGoalQuantity}
                setCurrentPartIndex={setCurrentPartIndex}
                setCurrentIngredientIndex={setCurrentIngredientIndex}
                setShowIngredientModal={setShowIngredientModal}
                apiUrl={apiUrl}
                planId={planId as string}
                setEditingRecipe={setEditingRecipe}
                fetchPlanDetail={fetchPlanDetail}
                setSelectedRecipeIndex={setSelectedRecipeIndex}
                setOverallPercent={setOverallPercent}
                setCalculatedNewGoal={setCalculatedNewGoal}
                setPartPercents={setPartPercents}
                setShowScaleModal={setShowScaleModal}
              />
            </section>

            {/* 5. 메모 입력 */}
            <section>
              <h2 className="text-xl font-extrabold mb-3">메모</h2>
              <div className="bg-white py-6 px-4 rounded-xl shadow">
                <textarea
                  className="w-full h-60 sm:h-80 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="메모를 입력하세요."
                />
                <Button
                  onClick={handleMemoSubmit}
                  className="mt-2 py-5 w-full bg-[#B9896D] text-white rounded-xl"
                >
                  메모 저장하기
                </Button>
              </div>
            </section>

            {/* 6. 완료/삭제 버튼 */}
            <div className="flex justify-center mt-10 gap-4">
              {!plan.isComplete && (
                <Button
                  variant="default"
                  onClick={handleCompleteClick}
                  className="px-6 py-5 bg-[#B9896D] text-white rounded-md"
                >
                  완성하기
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleDeletePlan}
                className="px-6 py-5 rounded-md"
              >
                삭제하기
              </Button>
            </div>
          </main>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 7. 레시피 추가용 모달 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showAddModal && plan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-11/12 max-w-xl p-6 relative shadow-lg">
            <button
              onClick={() => {
                setShowAddModal(false);
                setSearchKeyword("");
                setSearchResults([]);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold mb-4">레시피 검색 및 추가</h3>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="레시피 이름 검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchRecipes();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#A97155]"
              />
              <Button onClick={searchRecipes} className="px-4 py-2">
                검색
              </Button>
            </div>

            {isSearching && (
              <p className="text-center text-[#A97155]">검색 중...</p>
            )}
            {searchError && (
              <p className="text-center text-red-500">{searchError}</p>
            )}

            {!isSearching && !searchError && (
              <ul className="max-h-64 overflow-auto space-y-2">
                {searchResults.length === 0 ? (
                  <p className="text-gray-600 text-center">
                    검색 결과가 없습니다.
                  </p>
                ) : (
                  searchResults.map((item) => {
                    // 이미 플랜에 포함된 레시피인지 검사
                    const alreadyInPlan = plan.recipeDetails.some(
                      (r) => r.recipeId === item.recipeId
                    );
                    return (
                      <li
                        key={item.recipeId}
                        className="flex justify-between items-center p-2 bg-[#F9F5F1] rounded-lg hover:bg-[#F2ECE6] transition"
                      >
                        <div>
                          <span className="text-[#4E342E] font-medium">
                            {item.recipeName}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            (완성수량: {item.outputQuantity})
                          </span>
                        </div>
                        <Button
                          size="sm"
                          disabled={alreadyInPlan}
                          onClick={() => handleAddRecipeInModal(item.recipeId)}
                        >
                          {alreadyInPlan ? "추가됨" : "추가"}
                        </Button>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>
        </div>
      )}
      {/* ────────────────────────────────────────────────────────────────────────── */}

      {showScaleModal && editingRecipe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-11/12 max-w-lg p-6 relative shadow-lg">
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setShowScaleModal(false);
                setDebounceTimer((prev) => {
                  if (prev) clearTimeout(prev);
                  return null;
                });
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-4">배율 변경</h3>

            {/* ───────── 1. 전체 목표 수량 배율 변경 ───────── */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">1) 전체 목표 수량 배율</h4>
              <p className="text-sm text-gray-600 mb-1">
                현재 목표 수량:{" "}
                <span className="font-medium">
                  {editingRecipe.goalQuantity}
                </span>{" "}
                개
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={overallPercent}
                  onChange={(e) => setOverallPercent(Number(e.target.value))}
                  className="border rounded-md p-2 w-20 text-center text-lg"
                />
                <span className="text-gray-600">%</span>
                <span className="text-gray-500 ml-2">
                  예상 목표 수량:{" "}
                  <span className="font-medium">{calculatedNewGoal}</span> 개
                </span>
              </div>
              <Button
                onClick={async () => {
                  // 요청 전 간단 검증
                  if (isNaN(overallPercent) || overallPercent <= 0) {
                    toast.error(
                      "유효한 배율(숫자, 0보다 큰 값)을 입력해주세요."
                    );
                    return;
                  }
                  try {
                    const res = await fetchWithAuth(
                      `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/output/percent`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ newPercent: overallPercent }),
                      }
                    );
                    if (!res.ok)
                      throw new Error(`전체 배율 요청 실패: ${res.status}`);
                    const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
                      await res.json();
                    if (json.resultCode !== "OK") {
                      throw new Error(json.msg || "전체 배율 변경 오류");
                    }
                    toast.success("전체 목표 수량 배율이 변경되었습니다.");
                    setShowScaleModal(false);
                    fetchPlanDetail(); // PlanDetail 재조회
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
                className="mt-3"
              >
                변경하기
              </Button>
            </div>

            <hr className="my-4 border-gray-300" />

            {/* ───────── 2. 파트별 배율 변경 ───────── */}
            <div>
              <h4 className="font-semibold mb-2">2) 파트별 배율</h4>
              <div className="space-y-3 mb-3">
                {editingRecipe.comparedParts.map((part, idx) => (
                  <div key={part.partName} className="flex items-center gap-3">
                    <span className="w-24 font-medium">{part.partName}</span>
                    <input
                      type="number"
                      min={1}
                      value={partPercents[idx] ?? ""}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        const copy = [...partPercents];
                        copy[idx] = isNaN(v) ? 100 : v;
                        setPartPercents(copy);
                      }}
                      className="border rounded-md p-2 w-20 text-center text-lg"
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={async () => {
                  // 파트별 퍼센트 검증: 배열 길이 검사 & 합계 상관없이 모두 보내야 함
                  if (
                    partPercents.length !== editingRecipe.comparedParts.length
                  ) {
                    toast.error("모든 파트에 대해 값을 입력해주세요.");
                    return;
                  }
                  try {
                    // payload: [{ partName, percent }, ...]
                    const payload = editingRecipe.comparedParts.map(
                      (part, idx) => ({
                        partName: part.partName,
                        percent: partPercents[idx],
                      })
                    );
                    const res = await fetchWithAuth(
                      `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/ingredients/percent`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      }
                    );
                    if (!res.ok)
                      throw new Error(`파트별 배율 요청 실패: ${res.status}`);
                    const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
                      await res.json();
                    if (json.resultCode !== "OK") {
                      throw new Error(json.msg || "파트별 배율 변경 오류");
                    }
                    toast.success("파트별 배율이 변경되었습니다.");
                    setShowScaleModal(false);
                    fetchPlanDetail();
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
              >
                변경하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 재료 검색/추가 모달 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showIngredientModal && editingRecipe && (
        <IngredientSearchModal
          isOpen={showIngredientModal}
          onClose={() => {
            setShowIngredientModal(false);
            setReplaceTarget(null);
            setCurrentPartIndex(null);
            setCurrentIngredientIndex(null);
          }}
          onSelect={handleIngredientSelect}
        />
      )}
    </>
  );
}
