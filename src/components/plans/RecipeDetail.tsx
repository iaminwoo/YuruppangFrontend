import React, { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import RecipeDescription from "@/components/RecipeDescription";
import Linkify from "linkify-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import * as PlanTypes from "@/types";

interface RecipeDetailSectionProps {
  plan: PlanTypes.PlanDetail;
  editingRecipe: PlanTypes.Recipe;
  setEditingRecipe: Dispatch<SetStateAction<PlanTypes.Recipe | null>>;
  selectedRecipeIndex: number;
  setSelectedRecipeIndex: Dispatch<SetStateAction<number>>;
  newGoalQuantity: string | number;
  setNewGoalQuantity: Dispatch<SetStateAction<string | number>>;
  setCurrentPartIndex: Dispatch<SetStateAction<number | null>>;
  setCurrentIngredientIndex: Dispatch<SetStateAction<number | null>>;
  isSavingRecipe: boolean;
  apiUrl: string;
  planId: string;
  handleIngredientsSubmit: () => Promise<void>;
  setShowIngredientModal: Dispatch<SetStateAction<boolean>>;
  fetchPlanDetail: (planId: string) => Promise<void>;
  setOverallPercent: Dispatch<SetStateAction<number>>;
  setCalculatedNewGoal: Dispatch<SetStateAction<number>>;
  setPartPercents: Dispatch<SetStateAction<number[]>>;
  setShowScaleModal: Dispatch<SetStateAction<boolean>>;
}

const RecipeDetail: React.FC<RecipeDetailSectionProps> = ({
  plan,
  editingRecipe,
  apiUrl,
  planId,
  newGoalQuantity,
  isSavingRecipe,
  handleIngredientsSubmit,
  setNewGoalQuantity,
  setCurrentPartIndex,
  setCurrentIngredientIndex,
  setShowIngredientModal,
  setEditingRecipe,
  fetchPlanDetail,
  setSelectedRecipeIndex,
  setOverallPercent,
  setCalculatedNewGoal,
  setPartPercents,
  setShowScaleModal,
}) => {
  const options = {
    defaultProtocol: "https",
    target: "_blank",
    className: "text-blue-800 underline hover:text-blue-400",
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !editingRecipe) return;

    const sourcePart = parseInt(source.droppableId.split("-")[1], 10);
    const destPart = parseInt(destination.droppableId.split("-")[1], 10);

    // 다른 파트로 옮기려는 경우 차단
    if (sourcePart !== destPart) {
      toast.error("다른 파트로 이동할 수 없습니다.");
      return;
    }

    // 같은 파트 내에서 순서 변경 처리
    const newIngredients = Array.from(
      editingRecipe.comparedParts[sourcePart].comparedIngredients
    );

    const [moved] = newIngredients.splice(source.index, 1);
    newIngredients.splice(destination.index, 0, moved);

    const updatedParts = [...editingRecipe.comparedParts];
    updatedParts[sourcePart] = {
      ...updatedParts[sourcePart],
      comparedIngredients: newIngredients,
    };

    setEditingRecipe({
      ...editingRecipe,
      comparedParts: updatedParts,
    });
  };

  const handleRemoveCurrentRecipe = async () => {
    if (!planId || !editingRecipe) return;

    const ok = confirm(
      "이 레시피를 현재 베이킹 플랜에서 삭제하면\n\n수정된 내용은 다시 복구할 수 없습니다.\n\n정말 진행하시겠습니까?"
    );
    if (!ok) return;

    try {
      const res = await fetchWithAuth(
        `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`레시피 제외 요청 실패: ${res.status}`);
      const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
        await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "레시피 제외 오류");
      }
      toast.success("플랜에서 레시피가 제외되었습니다.");
      // 플랜 재조회
      fetchPlanDetail(planId);
      // 만약 마지막 레시피를 제외했다면 인덱스 조정
      setSelectedRecipeIndex(0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleGoalQuantitySubmit = async () => {
    if (!editingRecipe || isNaN(Number(newGoalQuantity))) {
      toast.error("목표 수량을 올바르게 입력해 주세요.");
      return;
    }
    try {
      const res = await fetchWithAuth(
        `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/output`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newOutput: Number(newGoalQuantity) }),
        }
      );
      if (!res.ok) throw new Error(`목표 수량 수정 실패: ${res.status}`);
      const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
        await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "목표 수량 수정 오류");
      }
      toast.success("목표 수량이 수정되었습니다.");
      // 플랜 재조회
      fetchPlanDetail(planId);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

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

  const handleReset = async () => {
    if (!editingRecipe) return;
    const ok = confirm("기본 레시피로 초기화하시겠습니까?");
    if (!ok) return;
    try {
      const res = await fetchWithAuth(
        `${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/reset`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error(`초기화 실패: ${res.status}`);
      const json: PlanTypes.ApiResponse<PlanTypes.PlanDetailResponse> =
        await res.json();
      if (json.resultCode !== "OK") {
        throw new Error(json.msg || "초기화 오류");
      }
      toast.success("기본 레시피로 초기화되었습니다.");
      fetchPlanDetail(planId);
    } catch {
      toast.error("네트워크 오류");
    }
  };

  return (
    <div className="bg-white rounded-xl px-3 pt-3 pb-6 shadow space-y-2 relative">
      {/* RESET / 제외 버튼 영역 */}
      {!plan.isComplete && (
        <div className="flex justify-end gap-2">
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
              {editingRecipe.customDescription}
            </Linkify>
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-1">{editingRecipe.name}</h3>
          <RecipeDescription
            initialDescription={editingRecipe.customDescription}
            updateUrl={`${apiUrl}/api/plans/${planId}/recipes/${editingRecipe.recipeId}/description`}
          />
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
              ? Math.round(editingRecipe.totalPrice / qty).toLocaleString()
              : "0";
          })()}
          원 )
        </div>
      </div>

      <div className="mb-6 whitespace-pre-wrap text-red-400">
        구매해보지 않은 재료가 있으면{" "}
        <span className="sm:inline block">원가계산이 정확하지 않습니다.</span>
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

              <div className="mt-2">현재 배율 : {editingRecipe.percent} %</div>
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
        <label htmlFor="goalQuantity" className="block mb-1 font-semibold">
          목표 수량 : {editingRecipe.goalQuantity} 개
        </label>
      )}

      {/* 재료 목록 (PART별) */}
      <div className="overflow-visible relative min-h-[400px] mb-8">
        <h4 className="font-semibold mb-2">재료 목록</h4>

        <div className="space-y-6">
          {/* DragDropContext는 파트 목록 전체를 한 번만 감싼다 */}
          <DragDropContext onDragEnd={handleDragEnd}>
            {editingRecipe.comparedParts.map((part, pIdx) => (
              <div key={pIdx}>
                <div className="flex gap-6 items-end justify-between mb-2">
                  <div className="flex-grow flex flex-col">
                    {!plan.isComplete ? (
                      <input
                        type="text"
                        value={part.partName}
                        placeholder="파트명을 입력하세요"
                        onChange={(e) =>
                          handlePartNameChange(pIdx, e.target.value)
                        }
                        className="border w-full rounded-lg border-gray-200 px-2 py-1 text-lg font-semibold"
                      />
                    ) : (
                      part.partName !== "기본" && (
                        <h5 className="text-lg font-semibold">
                          {part.partName}
                        </h5>
                      )
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

                {/* 각 파트는 자신만의 Droppable을 가진다 */}
                <Droppable droppableId={`part-${pIdx}`} key={`drop-${pIdx}`}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col space-y-2 min-h-[40px]"
                    >
                      {/* 헤더(완료/편집 모드에 따라) */}
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

                      {part.comparedIngredients.map((ing, iIdx) => (
                        <Draggable
                          key={`${pIdx}-${iIdx}`}
                          draggableId={`${pIdx}-${iIdx}`}
                          index={iIdx}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-[#FFF8F0] rounded-xl shadow-md border px-2 py-3 flex items-center gap-2 hover:bg-[#FFF0DA]"
                            >
                              <span
                                {...provided.dragHandleProps}
                                className="cursor-grab text-gray-400"
                              >
                                ☰
                              </span>

                              {/* 재료명 */}
                              {!plan.isComplete ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPartIndex(pIdx);
                                    setCurrentIngredientIndex(iIdx);
                                    setShowIngredientModal(true);
                                  }}
                                  className={`flex-1 border-b border-gray-300 p-1 text-left ${
                                    ing.ingredientName
                                      ? "text-gray-900"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {ing.ingredientName || "재료명을 선택하세요"}
                                </button>
                              ) : (
                                <div className="flex-1 min-w-0 text-center">
                                  {ing.ingredientName}
                                </div>
                              )}

                              {/* 기본 수량 */}
                              <div className="flex-1 min-w-0 flex items-center justify-center text-gray-600 text-center">
                                {ing.originalQuantity > 0
                                  ? `${ing.originalQuantity.toLocaleString()} g${
                                      ing.unit !== "g" ? ` (${ing.unit})` : ""
                                    }`
                                  : "-"}
                              </div>

                              {/* 필요량 + 단위 (편집시) */}
                              {!plan.isComplete && (
                                <div className="flex-1 min-w-0 flex items-center gap-1">
                                  <div className="relative w-full">
                                    <input
                                      type="number"
                                      className={`w-full ${
                                        ing.unit !== "g" ? "pr-6" : "pr-0"
                                      } text-center bg-transparent border-b border-gray-300 focus:outline-none`}
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

                              {/* 삭제 버튼 */}
                              {!plan.isComplete && (
                                <button
                                  className="w-6 pl-1 text-center text-xl text-red-500 font-semibold"
                                  onClick={() => removeIngredient(pIdx, iIdx)}
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}

                      <div className="transition-none">
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>

                {/* 해당 파트에 재료 추가 */}
                {!plan.isComplete && (
                  <div className="flex justify-end mt-3">
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
            ))}
          </DragDropContext>

          {/* 파트 추가 버튼 */}
          {!plan.isComplete && (
            <Button variant="outline" size="sm" onClick={addPart} type="button">
              + 파트 추가
            </Button>
          )}
        </div>
      </div>

      {/* 저장하기 */}
      {!plan.isComplete && (
        <Button
          id="save-recipe-btn"
          onClick={handleIngredientsSubmit}
          disabled={isSavingRecipe}
          className="mt-2 py-5 w-full bg-[#B9896D] text-white rounded-xl"
        >
          {isSavingRecipe ? "저장중…" : "레시피 저장하기"}
        </Button>
      )}
    </div>
  );
};

export default RecipeDetail;
