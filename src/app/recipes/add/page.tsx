"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import IngredientSearchModal from "@/components/IngredientSearchModal";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useRef } from "react";
import AutoRegisterModal from "@/components/recipes/AutoRegisterModal";
import PanSearchModal from "@/components/recipes/PanSearchModal";
import CreatePanModal from "@/components/recipes/CreatePanModal";

export type PanType = "ROUND" | "SQUARE" | "CUSTOM";

interface Ingredient {
  ingredientName: string;
  quantity: number | string;
  unit: string;
  stock: number | string;
}

interface Part {
  partName: string;
  ingredients: Ingredient[];
}

interface Category {
  categoryId: number;
  categoryName: string;
}

interface AutoRegisterData {
  name?: string;
  description?: string;
  outputQuantity?: number | string;
  categoryId?: number;
  parts?: Part[];
}

interface Pan {
  panId: number;
  panType: string;
  measurements: string;
  volume: number;
}

export default function RecipeForm() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [outputQuantity, setOutputQuantity] = useState<number | string>("");

  const [parts, setParts] = useState<Part[]>([
    {
      partName: "",
      ingredients: [{ ingredientName: "", quantity: "", unit: "g", stock: "" }],
    },
  ]);

  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [selectedPan, setSelectedPan] = useState<Pan>();
  const [showPanModal, setShowPanModal] = useState(false);
  const [isCreatePanOpen, setCreatePanOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PanType | null>(null);

  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState<number | null>(null);
  const [currentIngredientIndex, setCurrentIngredientIndex] = useState<
    number | null
  >(null);

  const ingredientAmountRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const [showAutoRegisterModal, setShowAutoRegisterModal] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${apiUrl}/api/categories`)
      .then((res) => {
        if (!res.ok) throw new Error("카테고리 조회 실패");
        return res.json();
      })
      .then((resp) => {
        if (resp && Array.isArray(resp.data)) {
          setCategories(resp.data);
        } else {
          setCategories([]);
        }
      })
      .catch(() => {
        alert("카테고리 목록을 불러오지 못했습니다.");
      });
  }, []);

  // 재료별 총 사용량을 계산하는 함수
  const calculateTotalUsage = (parts: Part[]) => {
    const usageMap: Record<string, number> = {};

    parts.forEach((part) => {
      part.ingredients.forEach((ing) => {
        if (!ing.ingredientName) return;
        const quantity =
          typeof ing.quantity === "string"
            ? parseFloat(ing.quantity)
            : ing.quantity;
        if (isNaN(quantity)) return;

        if (!usageMap[ing.ingredientName]) usageMap[ing.ingredientName] = 0;
        usageMap[ing.ingredientName] += quantity;
      });
    });

    return usageMap;
  };

  // useMemo로 parts가 바뀔 때마다 총 사용량 계산
  const totalUsage = useMemo(() => calculateTotalUsage(parts), [parts]);

  // 이하 기존 함수들 (handlePartNameChange 등) 동일

  const handlePartNameChange = (index: number, value: string) => {
    const newParts = [...parts];
    newParts[index].partName = value;
    setParts(newParts);
  };

  const handlePartIngredientChange = (
    partIndex: number,
    ingredientIndex: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    const newParts = [...parts];
    newParts[partIndex].ingredients[ingredientIndex] = {
      ...newParts[partIndex].ingredients[ingredientIndex],
      [field]: value,
    };
    setParts(newParts);
  };

  const addPartIngredient = (partIndex: number) => {
    const newParts = [...parts];
    newParts[partIndex].ingredients.push({
      ingredientName: "",
      quantity: "",
      unit: "g",
      stock: "",
    });
    setParts(newParts);
  };

  const removePartIngredient = (partIndex: number, ingredientIndex: number) => {
    const newParts = [...parts];
    if (newParts[partIndex].ingredients.length === 1) return;
    newParts[partIndex].ingredients.splice(ingredientIndex, 1);
    setParts(newParts);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourcePartIndex = parseInt(source.droppableId.split("-")[1], 10);
    const destPartIndex = parseInt(destination.droppableId.split("-")[1], 10);

    const sourceIngredients = Array.from(parts[sourcePartIndex].ingredients);
    const [moved] = sourceIngredients.splice(source.index, 1);

    if (sourcePartIndex === destPartIndex) {
      // 같은 파트 안에서 이동
      sourceIngredients.splice(destination.index, 0, moved);
      updatePartIngredients(sourcePartIndex, sourceIngredients);
    } else {
      // 다른 파트로 이동
      const destIngredients = Array.from(parts[destPartIndex].ingredients);
      destIngredients.splice(destination.index, 0, moved);

      updatePartIngredients(sourcePartIndex, sourceIngredients);
      updatePartIngredients(destPartIndex, destIngredients);
    }
  };

  const updatePartIngredients = (
    partIndex: number,
    newIngredients: Ingredient[]
  ) => {
    const newParts = [...parts];
    newParts[partIndex].ingredients = newIngredients;
    setParts(newParts);
  };

  const addPart = () => {
    setParts([
      ...parts,
      {
        partName: "",
        ingredients: [
          { ingredientName: "", quantity: "", unit: "g", stock: "" },
        ],
      },
    ]);
  };

  const removePart = (index: number) => {
    const newParts = parts.filter((_, i) => i !== index);
    setParts(newParts);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("카테고리 이름을 입력하세요.");
      return;
    }

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "카테고리 생성 실패");
      }

      const resp = await res.json();
      const created: Category = resp.data;
      setCategories((prev) => [...prev, created]);
      setSelectedCategoryId(created.categoryId);
      setNewCategoryName("");
      setShowCategoryModal(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message || "카테고리 생성 중 오류가 발생했습니다.");
      } else {
        alert("카테고리 생성 중 알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  const handleSubmit = async () => {
    if (
      !name.trim() ||
      !description.trim() ||
      !outputQuantity ||
      selectedCategoryId === ""
    ) {
      alert("이름, 설명, 생산 수량, 카테고리는 필수 입력입니다.");
      return;
    }

    const adjustedParts: Part[] = parts.map((p) => ({
      partName: p.partName.trim(),
      ingredients: [...p.ingredients],
    }));
    if (adjustedParts.length === 1 && adjustedParts[0].partName === "") {
      adjustedParts[0].partName = "기본";
    }

    const cleanParts = adjustedParts
      .filter((part) => part.ingredients.length > 0)
      .map((part) => ({
        partName: part.partName,
        ingredients: part.ingredients
          .filter(
            (ing) =>
              ing.ingredientName.trim() !== "" &&
              ing.quantity !== "" &&
              ing.unit
          )
          .map((ing) => ({
            ingredientName: ing.ingredientName.trim(),
            quantity: parseFloat(String(ing.quantity)),
            unit: ing.unit,
          })),
      }))
      .filter((part) => part.ingredients.length > 0);

    if (cleanParts.length === 0) {
      alert("최소 한 개 이상의 재료를 가진 파트가 필요합니다.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      outputQuantity: parseInt(String(outputQuantity), 10),
      categoryId: selectedCategoryId,
      panId: selectedPan?.panId,
      parts: cleanParts,
    };

    setLoading(true);
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

      const json = await res.json();

      if (json.resultCode === "OK" && json.data?.recipeId) {
        alert("레시피 등록 성공!");
        router.push(`/recipes/${json.data.recipeId}`);
      } else {
        throw new Error("레시피 ID를 받아오지 못했습니다.");
      }
    } catch {
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans text-sm">
      <Navbar pageTitle="레시피 추가 페이지" />
      <main className="px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center mb-2 mt-2">
          <h2 className="text-xl font-bold text-[#4E342E]">레시피 등록</h2>

          <Button
            className="bg-[#B9896D] text-white rounded-xl"
            onClick={() => setShowAutoRegisterModal(true)}
          >
            레시피 자동 등록
          </Button>
        </div>

        {/* 1. 이름 */}
        <div>
          <label className="block font-semibold mb-1 text-[#4E342E]">
            이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 p-2 w-full rounded-md"
            placeholder="레시피 이름"
          />
        </div>

        {/* 2. 카테고리 선택 */}
        <div>
          <label className="block font-semibold mb-1 text-[#4E342E]">
            카테고리
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedCategoryId}
              onChange={(e) =>
                setSelectedCategoryId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="border border-gray-300 p-2 rounded-md flex-grow"
            >
              <option key="default" value="">
                — 카테고리 선택 —
              </option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowCategoryModal(true)}
              type="button"
            >
              + 새 카테고리
            </Button>
          </div>
        </div>

        {/* 3. 설명 */}
        <div>
          <label className="block font-semibold mb-1 text-[#4E342E]">
            설명
          </label>
          <AutoResizeTextarea
            description={description}
            setDescription={setDescription}
          />
        </div>

        {/* 4. 생산 수량 */}
        <div>
          <label className="block font-semibold mb-1 text-[#4E342E]">
            생산 수량
          </label>
          <input
            type="number"
            min={1}
            value={outputQuantity}
            onChange={(e) => setOutputQuantity(e.target.value)}
            className="border border-gray-300 p-2 w-full rounded-md"
            placeholder="생산 수량"
          />
        </div>

        {/* 5. 틀 선택 */}
        <div>
          <label className="block font-semibold mb-1 text-[#4E342E]">틀</label>
          <button
            type="button"
            onClick={() => {
              setShowPanModal(true);
            }}
            className={`w-full border border-gray-300 p-1 rounded-md text-left ${
              selectedPan ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {selectedPan
              ? `${selectedPan.measurements} = 부피 : ${selectedPan.volume} cm³`
              : "틀을 선택하세요."}
          </button>
        </div>

        {/* 파트 추가/삭제 */}
        <section>
          <h3 className="block font-semibold mb-1 text-[#4E342E]">재료 목록</h3>
          <DragDropContext onDragEnd={handleDragEnd}>
            {parts.map((part, partIndex) => (
              <div
                key={partIndex}
                className="bg-[#FFF8F0] rounded-xl shadow-md border p-4 mb-4"
              >
                <div className="flex justify-between items-center mb-2">
                  {parts.length > 1 && (
                    <input
                      type="text"
                      placeholder="파트명을 입력하세요."
                      value={part.partName}
                      onChange={(e) =>
                        handlePartNameChange(partIndex, e.target.value)
                      }
                      className="border border-gray-300 p-1 rounded-md w-1/3"
                    />
                  )}

                  {parts.length > 1 && (
                    <button
                      onClick={() => removePart(partIndex)}
                      type="button"
                      className="text-red-600 font-semibold hover:underline"
                    >
                      파트 삭제
                    </button>
                  )}
                </div>

                {/* 재료 리스트 드래그앤드롭 */}
                <Droppable droppableId={`part-${partIndex}`}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {part.ingredients.map((ing, i) => {
                        const stockNum = parseFloat(String(ing.stock));
                        const usedQuantity =
                          totalUsage[ing.ingredientName] || 0;
                        const remainingQuantity = !isNaN(stockNum)
                          ? stockNum - usedQuantity
                          : null;

                        return (
                          <Draggable
                            key={`${partIndex}-${i}`}
                            draggableId={`${partIndex}-${i}`} // id 대신 인덱스 조합
                            index={i}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="mb-3"
                              >
                                <div className="flex gap-2 items-center">
                                  {/* 드래그 핸들 */}
                                  <span
                                    {...provided.dragHandleProps}
                                    className="cursor-grab text-gray-400"
                                  >
                                    ☰
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCurrentPartIndex(partIndex);
                                      setCurrentIngredientIndex(i);
                                      setShowIngredientModal(true);
                                    }}
                                    className={`flex-grow border border-gray-300 p-1 rounded-md text-left ${
                                      ing.ingredientName
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {ing.ingredientName ||
                                      "재료명을 선택하세요"}
                                  </button>

                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    placeholder="수량"
                                    value={ing.quantity}
                                    onChange={(e) =>
                                      handlePartIngredientChange(
                                        partIndex,
                                        i,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    className="border border-gray-300 p-1 rounded-md w-24"
                                    ref={(el) => {
                                      if (
                                        !ingredientAmountRefs.current[partIndex]
                                      ) {
                                        ingredientAmountRefs.current[
                                          partIndex
                                        ] = [];
                                      }
                                      ingredientAmountRefs.current[partIndex][
                                        i
                                      ] = el;
                                    }}
                                  />

                                  <select
                                    value={ing.unit}
                                    onChange={(e) =>
                                      handlePartIngredientChange(
                                        partIndex,
                                        i,
                                        "unit",
                                        e.target.value
                                      )
                                    }
                                    className="border border-gray-300 p-1 rounded-md w-20"
                                  >
                                    <option>g</option>
                                    <option>ml</option>
                                    <option>개</option>
                                  </select>

                                  {part.ingredients.length > 1 && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        removePartIngredient(partIndex, i)
                                      }
                                      type="button"
                                    >
                                      삭제
                                    </Button>
                                  )}
                                </div>

                                <div className="flex justify-between items-center">
                                  {i === part.ingredients.length - 1 ? (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() =>
                                        addPartIngredient(partIndex)
                                      }
                                      type="button"
                                      className="mt-1"
                                    >
                                      + 재료 추가
                                    </Button>
                                  ) : (
                                    <div></div>
                                  )}

                                  {ing.stock && (
                                    <div className="text-sm text-end ml-1 mt-1 text-gray-500">
                                      총 보유량: {stockNum.toLocaleString()}{" "}
                                      {ing.unit}
                                      <br />
                                      {totalUsage[ing.ingredientName.trim()] !==
                                        undefined && (
                                        <span>사용 후 잔량: </span>
                                      )}
                                      {totalUsage[ing.ingredientName.trim()] !==
                                        undefined && (
                                        <span
                                          className={
                                            remainingQuantity !== null &&
                                            remainingQuantity < 0
                                              ? "text-red-600 font-semibold"
                                              : ""
                                          }
                                        >
                                          {remainingQuantity !== null
                                            ? remainingQuantity.toLocaleString()
                                            : "-"}{" "}
                                          {ing.unit}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </DragDropContext>

          <Button variant="outline" size="sm" onClick={addPart} type="button">
            + 파트 추가
          </Button>
        </section>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 py-5 w-full bg-[#B9896D] text-white rounded-xl"
        >
          {loading ? "저장 중..." : "레시피 등록"}
        </Button>
      </main>

      {/* 레시피 자동 등록 모달 */}
      <AutoRegisterModal
        isOpen={showAutoRegisterModal}
        onClose={() => setShowAutoRegisterModal(false)}
        onSuccess={(data: AutoRegisterData) => {
          if (data.name) setName(data.name);
          if (data.description) setDescription(data.description);
          if (data.outputQuantity) setOutputQuantity(data.outputQuantity);
          if (data.categoryId) setSelectedCategoryId(data.categoryId);
          if (data.parts) setParts(data.parts);
          alert("레시피 자동 등록 완료!");
        }}
      />

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">새 카테고리 추가</h2>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="카테고리 이름"
              className="border border-gray-300 p-2 w-full rounded-md mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName("");
                }}
                type="button"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateCategory}
                className="bg-[#B9896D] text-white"
                type="button"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {showIngredientModal &&
        currentPartIndex !== null &&
        currentIngredientIndex !== null && (
          <IngredientSearchModal
            isOpen={showIngredientModal}
            onClose={() => setShowIngredientModal(false)}
            onSelect={(ingredient) => {
              const newParts = [...parts];
              newParts[currentPartIndex].ingredients[
                currentIngredientIndex
              ].ingredientName = ingredient.ingredientName;
              newParts[currentPartIndex].ingredients[
                currentIngredientIndex
              ].stock = ingredient.totalQuantity;
              setParts(newParts);

              setShowIngredientModal(false);

              // 포커스 이동 (DOM 업데이트 후)
              setTimeout(() => {
                ingredientAmountRefs.current[currentPartIndex][
                  currentIngredientIndex
                ]?.focus();
              }, 0);

              setCurrentPartIndex(null);
              setCurrentIngredientIndex(null);
            }}
          />
        )}

      {showPanModal && (
        <PanSearchModal
          isOpen={showPanModal}
          onClose={() => setShowPanModal(false)}
          onSelect={(selectedPan) => {
            setSelectedPan(selectedPan);
            setShowIngredientModal(false);
          }}
          onCreatePan={(type) => {
            setShowPanModal(false);
            setSelectedType(type);
            setCreatePanOpen(true);
          }}
        />
      )}

      <CreatePanModal
        isOpen={isCreatePanOpen}
        initialType={selectedType}
        onClose={() => setCreatePanOpen(false)}
        onCreate={(pan) => setSelectedPan(pan)}
      />
    </div>
  );
}
