"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import IngredientSearchModal from "@/components/IngredientSearchModal";
import Linkify from "linkify-react";

interface Ingredient {
  ingredientId: number;
  name: string;
  requiredQuantity: number;
  currentStock: number;
  lackingQuantity: number;
}

interface RecipeIngredient {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  originalQuantity: number;
  customizedQuantity: number | string;
}

interface Part {
  partName: string;
  percent: number;
  comparedIngredients: RecipeIngredient[];
}

interface Recipe {
  recipeId: number;
  name: string;
  description: string;
  totalPrice: number;
  customName: string;
  customDescription: string;
  outputQuantity: number;
  goalQuantity: number | string;
  percent: number;
  comparedParts: Part[];
}

interface PlanDetail {
  name: string;
  memo: string;
  isComplete: boolean;
  recipeDetails: Recipe[];
  lackIngredients: Ingredient[];
}

interface ApiResponse<T> {
  resultCode: string;
  msg: string;
  data: T;
}

interface PlanDetailResponse {
  planId: number;
  name: string;
  memo: string;
  isComplete: boolean;
  recipeDetails: ApiRecipeDetail[];
  lackIngredients: Ingredient[];
}

interface RecipeSearchItem {
  recipeId: number;
  recipeName: string;
  outputQuantity: number;
  favorite: boolean;
}

interface RecipeSearchResponse {
  content: RecipeSearchItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
}

interface ApiRecipeDetail {
  recipeId: number;
  recipeName: string;
  recipeDescription: string;
  totalPrice: number;
  customRecipeName: string;
  customRecipeDescription: string;
  outputQuantity: number;
  goalQuantity: number | string;
  percent: number;
  comparedParts: ApiComparedPart[];
}

interface ApiComparedPart {
  partName: string;
  percent: number;
  comparedIngredients: ApiComparedIngredient[];
}

interface ApiComparedIngredient {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  originalQuantity: number;
  customizedQuantity: number | string;
}

export default function PlanDetailPage() {
  const { planId } = useParams();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // ──────────────────────────────────────────────────────────────────────────────
  // 플랜 전체 상태
  // ──────────────────────────────────────────────────────────────────────────────
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [memo, setMemo] = useState("");
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [newGoalQuantity, setNewGoalQuantity] = useState<string | number>("");

  // ──────────────────────────────────────────────────────────────────────────────
  // ‘레시피 추가’ 모달 관련 상태
  // ──────────────────────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<RecipeSearchItem[]>([]);
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

  // 2) 파트별 배율 입력값 배열 (각 파트마다 입력할 퍼센트)
  const [partPercents, setPartPercents] = useState<number[]>([]);

  const options = {
    defaultProtocol: "https",
    target: "_blank",
    className: "text-blue-800 underline hover:text-blue-400",
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 플랜 상세 조회 함수
  // ──────────────────────────────────────────────────────────────────────────────
  const fetchPlanDetail = async () => {
    if (!planId) return;
    try {
      const res = await fetch(`${apiUrl}/api/plans/${planId}`);
      if (!res.ok) throw new Error(`플랜 상세 조회 실패: ${res.status}`);
      const json: ApiResponse<PlanDetailResponse> = await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "플랜 API 오류");
      }
      const d = json.data;
      const converted: PlanDetail = {
        name: d.name,
        memo: d.memo,
        isComplete: d.isComplete,
        recipeDetails: d.recipeDetails.map((r: ApiRecipeDetail) => ({
          recipeId: r.recipeId,
          name: r.recipeName,
          description: r.recipeDescription,
          totalPrice: r.totalPrice,
          customName: r.customRecipeName,
          customDescription: r.customRecipeDescription,
          outputQuantity: r.outputQuantity,
          goalQuantity: r.goalQuantity,
          percent: r.percent,
          comparedParts: r.comparedParts.map((p: ApiComparedPart) => ({
            partName: p.partName,
            percent: p.percent,
            comparedIngredients: p.comparedIngredients.map(
              (ing: ApiComparedIngredient) => ({
                ingredientId: ing.ingredientId,
                ingredientName: ing.ingredientName,
                unit: ing.unit,
                originalQuantity: ing.originalQuantity,
                customizedQuantity: ing.customizedQuantity,
              })
            ),
          })),
        })),
        lackIngredients: d.lackIngredients.map((item: Ingredient) => ({
          ingredientId: item.ingredientId,
          name: item.name,
          requiredQuantity: item.requiredQuantity,
          currentStock: item.currentStock,
          lackingQuantity: item.lackingQuantity,
        })),
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
      const res = await fetch(url);
      if (!res.ok) throw new Error(`레시피 검색 실패: ${res.status}`);
      const json: ApiResponse<RecipeSearchResponse> = await res.json();
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
      const res = await fetch(`${apiUrl}/api/plans/${planId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipeIdToAdd }),
      });
      if (!res.ok) throw new Error(`레시피 추가 요청 실패: ${res.status}`);
      const json: ApiResponse<PlanDetailResponse> = await res.json();
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

  // ──────────────────────────────────────────────────────────────────────────────
  // 선택된 레시피 제외(삭제) 핸들러
  // ──────────────────────────────────────────────────────────────────────────────
  const handleRemoveCurrentRecipe = async () => {
    if (!planId || !editingRecipe) return;

    const ok = confirm(
      "이 레시피를 현재 베이킹 플랜에서 삭제하면\n\n수정된 내용은 다시 복구할 수 없습니다.\n\n정말 진행하시겠습니까?"
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`레시피 제외 요청 실패: ${res.status}`);
      const json: ApiResponse<PlanDetailResponse> = await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "레시피 제외 오류");
      }
      toast.success("플랜에서 레시피가 제외되었습니다.");
      // 플랜 재조회
      fetchPlanDetail();
      // 만약 마지막 레시피를 제외했다면 인덱스 조정
      setSelectedRecipeIndex(0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 목표 수량 변경 핸들러 (기존)
  // ──────────────────────────────────────────────────────────────────────────────
  const handleGoalQuantitySubmit = async () => {
    if (!editingRecipe || isNaN(Number(newGoalQuantity))) {
      toast.error("목표 수량을 올바르게 입력해 주세요.");
      return;
    }
    try {
      const res = await fetch(
        `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/output`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newOutput: Number(newGoalQuantity) }),
        }
      );
      if (!res.ok) throw new Error(`목표 수량 수정 실패: ${res.status}`);
      const json: ApiResponse<PlanDetailResponse> = await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "목표 수량 수정 오류");
      }
      toast.success("목표 수량이 수정되었습니다.");
      // 플랜 재조회
      fetchPlanDetail();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 재료 수정 핸들러 (기존)
  // ──────────────────────────────────────────────────────────────────────────────
  const handleIngredientChange = (
    partIndex: number,
    ingIndex: number,
    field: "ingredientName" | "customizedQuantity" | "unit",
    value: string
  ) => {
    if (!editingRecipe) return;
    const parts = [...editingRecipe.comparedParts];
    const ing = parts[partIndex].comparedIngredients[ingIndex];
    ing[field] = value;

    setEditingRecipe({ ...editingRecipe, comparedParts: parts });
  };

  const addIngredient = (partIndex: number) => {
    if (!editingRecipe) return;
    const parts = [...editingRecipe.comparedParts];
    parts[partIndex].comparedIngredients.push({
      ingredientId: Date.now(),
      ingredientName: "",
      unit: "g",
      originalQuantity: 0,
      customizedQuantity: "",
    });
    setEditingRecipe({ ...editingRecipe, comparedParts: parts });
  };

  const removeIngredient = (partIndex: number, ingIndex: number) => {
    if (!editingRecipe) return;

    const parts = [...editingRecipe.comparedParts];
    const ingredientList = parts[partIndex].comparedIngredients;

    // 재료가 하나뿐이면 삭제 불가
    if (ingredientList.length === 1) {
      alert("각 파트에는 최소 1개의 재료가 필요합니다.");
      return;
    }

    const confirmed = confirm(
      "이 재료를 삭제하시겠습니까?\n삭제하면 복구할 수 없습니다."
    );
    if (!confirmed) return;

    ingredientList.splice(ingIndex, 1);
    setEditingRecipe({ ...editingRecipe, comparedParts: parts });
  };

  const handleIngredientsSubmit = async () => {
    if (!editingRecipe) return;
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
      const res = await fetch(
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
      const json: ApiResponse<PlanDetailResponse> = await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "재료 수정 오류");
      }
      toast.success("재료가 수정되었습니다.");
      fetchPlanDetail();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // RESET 핸들러 (기존)
  // ──────────────────────────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!editingRecipe) return;
    const ok = confirm("기본 레시피로 초기화하시겠습니까?");
    if (!ok) return;
    try {
      const res = await fetch(
        `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/reset`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error(`초기화 실패: ${res.status}`);
      const json: ApiResponse<PlanDetailResponse> = await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "초기화 오류");
      }
      toast.success("기본 레시피로 초기화되었습니다.");
      fetchPlanDetail();
    } catch {
      toast.error("네트워크 오류");
    }
  };

  const addPart = () => {
    if (!editingRecipe) return;
    const updatedParts = [...editingRecipe.comparedParts];
    updatedParts.push({
      partName: "",
      percent: 100,
      comparedIngredients: [
        {
          ingredientId: Date.now(), // 임시 ID
          ingredientName: "",
          unit: "g",
          originalQuantity: 0,
          customizedQuantity: "",
        },
      ],
    });
    setEditingRecipe({ ...editingRecipe, comparedParts: updatedParts });
  };

  const removePart = (partIndex: number) => {
    if (!editingRecipe) return;

    const updatedParts = [...editingRecipe.comparedParts];
    const part = updatedParts[partIndex];

    // 마지막 하나는 삭제 안 되게 처리
    if (updatedParts.length === 1) {
      alert("최소 1개의 파트는 존재해야 합니다.");
      return;
    }

    // 재료가 하나라도 있고, 그 중 이름이 입력된 것이 있다면 confirm
    const hasNamedIngredient = part.comparedIngredients.some(
      (ing) => ing.ingredientName.trim() !== ""
    );

    if (hasNamedIngredient) {
      const confirmed = confirm(
        "이 파트에는 재료가 포함되어 있습니다.\n\n삭제하면 재료도 함께 사라집니다.\n\n정말 삭제하시겠습니까?"
      );
      if (!confirmed) return;
    }

    // 빈 파트거나, 확인 완료되었으면 삭제
    updatedParts.splice(partIndex, 1);
    setEditingRecipe({ ...editingRecipe, comparedParts: updatedParts });
  };

  const handlePartNameChange = (partIndex: number, newName: string) => {
    if (!editingRecipe) return;
    const updatedParts = [...editingRecipe.comparedParts];
    updatedParts[partIndex].partName = newName;
    setEditingRecipe({ ...editingRecipe, comparedParts: updatedParts });
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 메모 저장 핸들러 (기존)
  // ──────────────────────────────────────────────────────────────────────────────
  const handleMemoSubmit = async () => {
    if (!plan) return;
    try {
      const res = await fetch(`${apiUrl}/api/plans/${planId}/memo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newMemo: memo }),
      });
      if (!res.ok) throw new Error(`메모 저장 실패: ${res.status}`);
      const json: ApiResponse<PlanDetailResponse> = await res.json();
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
      const res = await fetch(`${apiUrl}/api/plans/${planId}`, {
        method: "DELETE",
      });
      const data: ApiResponse<string> = await res.json();
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
  const initScaleModal = () => {
    if (!editingRecipe) return;

    // 1) 전체 퍼센트: 현재 editingRecipe.goalQuantity / editingRecipe.outputQuantity * 100
    const baseOutput = editingRecipe.outputQuantity;
    const currentGoal = Number(editingRecipe.goalQuantity);
    const initialPercent =
      baseOutput > 0 ? Math.round((currentGoal / baseOutput) * 100) : 100;
    setOverallPercent(initialPercent);

    // 계산된 새 목표 수량도 초기에는 기존 목표 수량으로 세팅
    setCalculatedNewGoal(currentGoal);

    // 2) 파트별 퍼센트가 Part.percent로 이미 들어있다면 그 값을 그대로 초기값으로 사용
    const initialPartPercents = editingRecipe.comparedParts.map(
      (part) => part.percent
    );
    setPartPercents(initialPartPercents);

    // 모달을 열어준다
    setShowScaleModal(true);
  };

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

  if (!plan || !editingRecipe) {
    return <div className="p-6 text-center text-[#A97155]">로딩 중...</div>;
  }

  return (
    <>
      <div className="bg-[#FFFDF8] min-h-screen font-sans text-sm">
        <Navbar />
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
          {!plan.isComplete && plan.lackIngredients.length > 0 && (
            <section>
              <h2 className="text-xl font-extrabold text-[#4E342E] mb-2">
                🛒 부족한 재료{" "}
                <span className="block sm:inline text-base font-bold text-gray-500">
                  (재료 클릭시 쿠팡으로 이동합니다.)
                </span>
              </h2>
              <div className="space-y-3">
                <div className="bg-[#FFD8A9] rounded-xl shadow-md border px-6 py-2 flex items-center justify-between text-[#4E342E] font-semibold">
                  <div className="flex-1 text-center">재료명</div>
                  <div className="flex-1 text-center">필요량</div>
                  <div className="flex-1 text-center">보유량</div>
                  <div className="flex-1 text-center">부족량</div>
                </div>
                {plan.lackIngredients.map((item) => (
                  <div
                    key={item.ingredientId}
                    onClick={() =>
                      window.open(
                        `https://www.coupang.com/np/search?q=${encodeURIComponent(
                          item.name
                        )}`,
                        "_blank"
                      )
                    }
                    className="bg-[#FFF8F0] rounded-xl shadow-md border px-6 py-2 flex items-center justify-between hover:bg-[#FFF0DA] transition"
                  >
                    <div className="text-center font-semibold text-[#4E342E] flex-1">
                      {item.name}
                    </div>
                    <div className="text-center text-[#4E342E] flex-1">
                      {item.requiredQuantity.toLocaleString()}
                    </div>
                    <div className="text-center text-[#4E342E] flex-1">
                      {item.currentStock.toLocaleString()}
                    </div>
                    <div className="text-center font-semibold text-red-500 flex-1">
                      {item.lackingQuantity.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
            <div className="mb-3 flex flex-wrap gap-2">
              {plan.recipeDetails.map((recipe, idx) => (
                <Button
                  key={recipe.recipeId}
                  onClick={() => setSelectedRecipeIndex(idx)}
                  className={`rounded-full px-4 py-2 font-semibold transition ${
                    idx === selectedRecipeIndex
                      ? "bg-[#A97155] text-white"
                      : "bg-[#EAD9C4] text-[#7C6E65]"
                  }`}
                >
                  {recipe.name}
                </Button>
              ))}
            </div>

            {/* 4. 선택된 레시피 상세 카드 */}
            <div className="bg-white rounded-xl px-3 py-6 shadow space-y-2 relative">
              {/* RESET / 제외 버튼 영역 */}
              {!plan.isComplete && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    onClick={handleReset}
                    className="px-3 py-1 text-xs rounded-md hover:text-red-500"
                  >
                    RESET
                  </Button>
                  <Button
                    onClick={handleRemoveCurrentRecipe}
                    variant="destructive"
                    className="px-3 py-1 text-xs rounded-md"
                  >
                    제외
                  </Button>
                </div>
              )}

              {/* 레시피 제목 & 설명 */}
              {plan.isComplete ? (
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    {editingRecipe.customName}
                  </h3>
                  <p className="mb-3 whitespace-pre-wrap">
                    <Linkify options={options}>
                      {editingRecipe.description}
                    </Linkify>
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    {editingRecipe.name}
                  </h3>
                  <p className="mb-3 whitespace-pre-wrap">
                    <Linkify options={options}>
                      {editingRecipe.description}
                    </Linkify>
                  </p>
                </div>
              )}

              <div className="h-px bg-gray-300 my-3" />

              <div className="flex gap-1 items-center">
                <p className="whitespace-pre-wrap">
                  레시피 원가 : {editingRecipe.totalPrice}원
                </p>

                <div className="whitespace-pre-wrap">
                  ( 개당 원가 :{" "}
                  {(() => {
                    const qty = Number(editingRecipe.goalQuantity); // 문자열이라도 숫자로 바꾼다
                    return qty > 0
                      ? Math.round(
                          editingRecipe.totalPrice / qty
                        ).toLocaleString()
                      : "0";
                  })()}
                  원 )
                </div>
              </div>

              <div className="mb-6 whitespace-pre-wrap text-red-400">
                구매해보지 않은 재료가 있으면{" "}
                <span className="sm:inline block">
                  원가계산이 정확하지 않습니다.
                </span>
              </div>

              <div className="h-px bg-gray-300 my-4" />

              {/* 목표 수량 변경 */}
              {!plan.isComplete && (
                <div>
                  <label htmlFor="goalQuantity" className="font-semibold">
                    목표 수량 (레시피 기본 수량: {editingRecipe.outputQuantity}
                    개)
                  </label>
                  <div className="flex justify-between items-end mb-6 mt-2">
                    <div>
                      <input
                        id="goalQuantity"
                        type="number"
                        className="border rounded-md p-2 w-20 text-center"
                        value={newGoalQuantity}
                        onChange={(e) => setNewGoalQuantity(e.target.value)}
                      />

                      <Button
                        onClick={handleGoalQuantitySubmit}
                        className="ml-3 px-3 py-1 rounded-md"
                      >
                        변경
                      </Button>

                      <div className="mt-2">
                        현재 배율 : {editingRecipe.percent} %
                      </div>
                    </div>

                    <Button
                      onClick={initScaleModal}
                      className="ml-3 px-3 py-1 rounded-md bg-[#A97155] text-white"
                    >
                      배율 변경
                    </Button>
                  </div>
                </div>
              )}
              {plan.isComplete && (
                <label
                  htmlFor="goalQuantity"
                  className="block mb-1 font-semibold"
                >
                  목표 수량 : {editingRecipe.goalQuantity} 개
                </label>
              )}

              {/* 재료 목록 (PART별) */}
              <div>
                <h4 className="font-semibold mb-2">재료 목록</h4>

                <div className="space-y-6">
                  {editingRecipe.comparedParts.map((part, pIdx) => (
                    <div key={pIdx}>
                      <div className="flex gap-6 items-end justify-between mb-2">
                        <div className="flex-grow flex flex-col">
                          {!plan.isComplete ? (
                            <div>
                              <input
                                type="text"
                                value={part.partName}
                                placeholder="파트명을 입력하세요"
                                onChange={(e) =>
                                  handlePartNameChange(pIdx, e.target.value)
                                }
                                className="border w-full rounded-lg border-gray-200 px-2 py-1 text-lg font-semibold"
                              />
                            </div>
                          ) : (
                            <>
                              {part.partName !== "기본" && (
                                <h5 className="text-lg font-semibold">
                                  {part.partName}
                                </h5>
                              )}
                            </>
                          )}
                          <div className="text-gray-400">
                            파트 배율 : {part.percent} %
                          </div>
                        </div>

                        {editingRecipe.comparedParts.length > 1 &&
                          !plan.isComplete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removePart(pIdx)}
                              type="button"
                            >
                              파트 삭제
                            </Button>
                          )}
                      </div>

                      {plan.isComplete ? (
                        <div className="bg-[#FFD8A9] rounded-xl shadow-md border px-2 py-2 mb-3 flex items-center justify-between text-[#4E342E] font-semibold">
                          <div className="flex-1 min-w-0 text-center">
                            재료명
                          </div>
                          <div className="flex-1 min-w-0 text-center">
                            필요수량
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#FFD8A9] rounded-xl shadow-md border px-2 py-2 mb-3 flex items-center justify-between text-[#4E342E] font-semibold">
                          <div className="flex-1 min-w-0 text-center">
                            재료명
                          </div>
                          <div className="flex-1 min-w-0 text-center">
                            기본수량
                          </div>
                          <div className="flex-1 min-w-0 text-center">
                            필요수량
                          </div>
                          <div className="w-12 min-w-0 text-center"></div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {part.comparedIngredients.map((ing, iIdx) => (
                          <div
                            key={ing.ingredientId}
                            className="bg-[#FFF8F0] rounded-xl shadow-md border px-2 py-3 flex hover:bg-[#FFF0DA] transition"
                          >
                            {/* 재료명 */}
                            {plan.isComplete ? (
                              <div className="flex-2 min-w-0 text-center">
                                {ing.ingredientName}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentPartIndex(pIdx);
                                  setCurrentIngredientIndex(iIdx);
                                  setShowIngredientModal(true);
                                }}
                                className={`flex-2 border-b border-gray-300 p-1 ${
                                  ing.ingredientName
                                    ? "text-gray-900"
                                    : "text-gray-400"
                                }`}
                              >
                                {ing.ingredientName || "재료명을 선택하세요"}
                              </button>
                            )}

                            {/* 기본 수량 */}
                            {plan.isComplete ? (
                              <div className="flex-2 min-w-0 flex items-center justify-center text-center text-gray-600">
                                {ing.customizedQuantity.toLocaleString()} g
                                {ing.unit !== "g" && ` (${ing.unit})`}
                              </div>
                            ) : (
                              <div className="flex-2 min-w-0 flex items-center justify-center text-center text-gray-600">
                                {ing.originalQuantity > 0 ? (
                                  <>
                                    {ing.originalQuantity.toLocaleString()} g
                                    {ing.unit !== "g" && ` (${ing.unit})`}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </div>
                            )}

                            {/* 필요량 + 단위 */}
                            {!plan.isComplete && (
                              <div className="flex-3 min-w-0 flex items-center gap-1">
                                <div className="relative w-full">
                                  <input
                                    type="number"
                                    className={`
                                      w-full
                                      ${ing.unit !== "g" ? "pr-6" : "pr-0"}
                                      text-center bg-transparent border-b border-gray-300 focus:outline-none
                                    `}
                                    value={ing.customizedQuantity}
                                    onChange={(e) =>
                                      handleIngredientChange(
                                        pIdx,
                                        iIdx,
                                        "customizedQuantity",
                                        e.target.value
                                      )
                                    }
                                  />
                                  {ing.unit !== "g" && (
                                    <span className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                                      g
                                    </span>
                                  )}
                                </div>

                                <div className="inline-flex items-center">
                                  <span>(</span>
                                  <select
                                    className="border border-gray-300 rounded px-1 py-1 mx-1"
                                    value={ing.unit}
                                    onChange={(e) =>
                                      handleIngredientChange(
                                        pIdx,
                                        iIdx,
                                        "unit",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="g">g</option>
                                    <option value="ml">ml</option>
                                    <option value="개">개</option>
                                  </select>
                                  <span>)</span>
                                </div>
                              </div>
                            )}

                            {/* 삭제 */}
                            {!plan.isComplete && (
                              <button
                                className="w-6 pl-1 text-center text-xl text-red-500 font-semibold"
                                onClick={() => removeIngredient(pIdx, iIdx)}
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        {/* 해당 파트에 재료 추가 */}
                        {!plan.isComplete && (
                          <div className="flex justify-end -mt-3">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => addIngredient(pIdx)}
                              type="button"
                            >
                              + 재료 추가
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {!plan.isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addPart}
                      type="button"
                    >
                      + 파트 추가
                    </Button>
                  )}

                  {/* 저장하기 */}
                  {!plan.isComplete && (
                    <Button
                      onClick={handleIngredientsSubmit}
                      className="mt-2 py-5 w-full bg-[#B9896D] text-white rounded-xl"
                    >
                      저장하기
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 5. 메모 입력 */}
          <section>
            <h2 className="text-xl font-extrabold mb-3">메모</h2>
            <div className="bg-white py-6 px-4 rounded-xl shadow">
              <textarea
                className="w-full h-120 sm:h-80 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력하세요."
              />
              <Button
                onClick={handleMemoSubmit}
                className="mt-2 py-5 w-full bg-[#B9896D] text-white rounded-xl"
              >
                저장하기
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
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 7. 레시피 추가용 모달 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showAddModal && (
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
                    const res = await fetch(
                      `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/output/percent`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ newPercent: overallPercent }),
                      }
                    );
                    if (!res.ok)
                      throw new Error(`전체 배율 요청 실패: ${res.status}`);
                    const json: ApiResponse<PlanDetailResponse> =
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
                    const res = await fetch(
                      `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/ingredients/percent`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      }
                    );
                    if (!res.ok)
                      throw new Error(`파트별 배율 요청 실패: ${res.status}`);
                    const json: ApiResponse<PlanDetailResponse> =
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
      {showIngredientModal && currentIngredientIndex !== null && (
        <IngredientSearchModal
          isOpen={showIngredientModal}
          onClose={() => setShowIngredientModal(false)}
          onSelect={(ingredientName: string) => {
            if (currentPartIndex === null || currentIngredientIndex === null)
              return;

            // 기존 파트 복사
            const updatedParts = [...editingRecipe.comparedParts];

            // 해당 위치 재료명 수정
            updatedParts[currentPartIndex].comparedIngredients[
              currentIngredientIndex
            ].ingredientName = ingredientName;

            // 상태 업데이트
            setEditingRecipe((prev) => {
              if (!prev) return prev; // null 체크

              return {
                ...prev,
                comparedParts: updatedParts,
              };
            });

            // 모달 닫기 및 인덱스 초기화
            setShowIngredientModal(false);
            setCurrentPartIndex(null);
            setCurrentIngredientIndex(null);
          }}
        />
      )}
    </>
  );
}
