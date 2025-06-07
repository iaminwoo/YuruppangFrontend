"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import IngredientSearchModal from "@/components/IngredientSearchModal";

interface Ingredient {
  ingredientName: string;
  quantity: number | string;
  unit: string;
}

interface Part {
  partName: string;
  ingredients: Ingredient[];
}

interface Category {
  categoryId: number;
  categoryName: string;
}

export default function RecipeForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [outputQuantity, setOutputQuantity] = useState<number | string>("");

  // 파트 상태
  const [parts, setParts] = useState<Part[]>([
    {
      partName: "",
      ingredients: [{ ingredientName: "", quantity: "", unit: "g" }],
    },
  ]);

  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // 카테고리 관련 상태
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

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

  // 컴포넌트 마운트 시 카테고리 목록 불러오기
  useEffect(() => {
    fetch("http://localhost:8080/api/categories")
      .then((res) => {
        if (!res.ok) throw new Error("카테고리 조회 실패");
        return res.json();
      })
      .then((resp) => {
        // resp.data가 배열이 맞는지 재확인하고, 그대로 categories에 할당
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

  // 파트 이름 변경
  const handlePartNameChange = (index: number, value: string) => {
    const newParts = [...parts];
    newParts[index].partName = value;
    setParts(newParts);
  };

  // 파트 재료 변경
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

  // 파트 재료 추가
  const addPartIngredient = (partIndex: number) => {
    const newParts = [...parts];
    newParts[partIndex].ingredients.push({
      ingredientName: "",
      quantity: "",
      unit: "g",
    });
    setParts(newParts);
  };

  // 파트 재료 삭제
  const removePartIngredient = (partIndex: number, ingredientIndex: number) => {
    const newParts = [...parts];
    if (newParts[partIndex].ingredients.length === 1) return; // 최소 1개 유지
    newParts[partIndex].ingredients.splice(ingredientIndex, 1);
    setParts(newParts);
  };

  // 파트 추가
  const addPart = () => {
    setParts([
      ...parts,
      {
        partName: "",
        ingredients: [{ ingredientName: "", quantity: "", unit: "g" }],
      },
    ]);
  };

  // 파트 삭제
  const removePart = (index: number) => {
    const newParts = parts.filter((_, i) => i !== index);
    setParts(newParts);
  };

  // 카테고리 생성 모달에서 저장
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("카테고리 이름을 입력하세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/categories", {
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
      // 카테고리 목록 갱신 & 바로 선택
      setCategories((prev) => [...prev, created]);
      setSelectedCategoryId(created.categoryId);
      setNewCategoryName("");
      setShowCategoryModal(false);
    } catch (error: any) {
      alert(error.message || "카테고리 생성 중 오류가 발생했습니다.");
    }
  };

  const handleSubmit = async () => {
    // 1) 기본 입력 값 체크
    if (
      !name.trim() ||
      !description.trim() ||
      !outputQuantity ||
      selectedCategoryId === ""
    ) {
      alert("이름, 설명, 생산 수량, 카테고리는 필수 입력입니다.");
      return;
    }

    // 2) 제출 직전에 “파트가 하나이고 이름이 없다면 '기본'으로 채워주기”
    const adjustedParts: Part[] = parts.map((p) => ({
      partName: p.partName.trim(),
      ingredients: [...p.ingredients],
    }));
    if (adjustedParts.length === 1 && adjustedParts[0].partName === "") {
      adjustedParts[0].partName = "기본";
    }

    // 3) 재료 정보만 깔끔하게 뽑아서 cleanParts 생성
    const cleanParts = adjustedParts
      // partName은 무조건 하나 이상 있기 때문에 filter는 ingredients 길이만 검사
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
      // 혹시 필터링 결과 파트 안에 재료가 하나도 없다면 그 파트는 제외
      .filter((part) => part.ingredients.length > 0);

    // 4) 최종적으로 cleanParts가 비어 있으면 경고
    if (cleanParts.length === 0) {
      alert("최소 한 개 이상의 재료를 가진 파트가 필요합니다.");
      return;
    }

    // 5) 서버로 보낼 payload 구성
    const payload = {
      name: name.trim(),
      description: description.trim(),
      outputQuantity: parseInt(String(outputQuantity), 10),
      categoryId: selectedCategoryId,
      parts: cleanParts,
    };

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/recipes", {
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
    } catch (err) {
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar />
      <main className="px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
        <h2 className="text-2xl font-bold text-[#4E342E] mb-4 mt-2">
          레시피 등록
        </h2>

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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 p-2 w-full rounded-md"
            placeholder="레시피 설명"
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

        {/* 파트 추가/삭제 */}
        <section>
          <h3 className="block font-semibold mb-1 text-[#4E342E]">재료 목록</h3>
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePart(partIndex)}
                    type="button"
                  >
                    파트 삭제
                  </Button>
                )}
              </div>

              {/* 해당 파트 재료들 */}
              {part.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  {/* ① 재료명 대신 모달 트리거 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPartIndex(partIndex);
                      setCurrentIngredientIndex(i);
                      setShowIngredientModal(true);
                    }}
                    className={`flex-grow border border-gray-300 p-1 rounded-md text-left ${
                      ing.ingredientName ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {ing.ingredientName || "재료명을 선택하세요"}
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
                      onClick={() => removePartIngredient(partIndex, i)}
                      type="button"
                    >
                      삭제
                    </Button>
                  )}
                </div>
              ))}

              <Button
                variant="link"
                size="sm"
                onClick={() => addPartIngredient(partIndex)}
                type="button"
                className="mt-1"
              >
                + 재료 추가
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addPart} type="button">
            + 파트 추가
          </Button>
        </section>

        {/* 최종 등록 버튼 */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 py-5 w-full bg-[#B9896D] text-white rounded-xl"
        >
          {loading ? "저장 중..." : "레시피 등록"}
        </Button>
      </main>

      {/* 새 카테고리 추가 모달 */}
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
                className="bg-blue-500 text-white"
                type="button"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 재료 검색/추가 모달 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showIngredientModal &&
        currentPartIndex !== null &&
        currentIngredientIndex !== null && (
          <IngredientSearchModal
            isOpen={showIngredientModal}
            onClose={() => setShowIngredientModal(false)}
            onSelect={(ingredientName: string) => {
              // 선택된 재료명을 해당 위치에 반영
              const newParts = [...parts];
              newParts[currentPartIndex].ingredients[
                currentIngredientIndex
              ].ingredientName = ingredientName;
              setParts(newParts);

              // 모달 닫기 및 인덱스 리셋
              setShowIngredientModal(false);
              setCurrentPartIndex(null);
              setCurrentIngredientIndex(null);
            }}
          />
        )}
    </div>
  );
}
