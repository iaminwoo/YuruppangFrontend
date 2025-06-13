"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import IngredientSearchModal from "@/components/IngredientSearchModal";

interface Ingredient {
  ingredientName: string;
  requiredQuantity: number | string;
  unit: string;
}

interface Part {
  partName: string;
  ingredients: Ingredient[];
}

interface RecipeDetail {
  name: string;
  description: string;
  outputQuantity: number;
  categoryId: number; // 추가된 필드
  categoryName: string; // 추가된 필드
  parts: Part[];
}

interface ApiResponse {
  resultCode: string;
  msg: string;
  data: RecipeDetail;
}

interface Category {
  categoryId: number;
  categoryName: string;
}

export default function RecipeEditPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();
  const params = useParams();
  const recipeId = params.recipeId as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [outputQuantity, setOutputQuantity] = useState<number | string>("");
  const [parts, setParts] = useState<Part[]>([
    {
      partName: "",
      ingredients: [{ ingredientName: "", requiredQuantity: "", unit: "G" }],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 관련 상태
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
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

  // 페이지 로드 시: 레시피 디테일과 카테고리 목록 모두 불러오기
  useEffect(() => {
    if (!recipeId) return;

    // 1) 레시피 디테일
    fetch(`${apiUrl}/api/recipes/${recipeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("데이터를 불러오는데 실패했습니다.");
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (data.resultCode === "OK") {
          const r = data.data;
          setName(r.name);
          setDescription(r.description);
          setOutputQuantity(r.outputQuantity);
          setSelectedCategoryId(r.categoryId.toString()); // 카테고리 ID 세팅

          if (r.parts && Array.isArray(r.parts) && r.parts.length > 0) {
            setParts(
              r.parts.map((part: Part) => ({
                partName: part.partName || "",
                ingredients: part.ingredients.map((ing: Ingredient) => ({
                  ingredientName: ing.ingredientName || "",
                  requiredQuantity:
                    ing.requiredQuantity || "" /* 서버 필드 반영 */,
                  unit: ing.unit || "G",
                })),
              }))
            );
          } else {
            setParts([
              {
                partName: "",
                ingredients: [
                  { ingredientName: "", requiredQuantity: "", unit: "G" },
                ],
              },
            ]);
          }
        } else {
          throw new Error(data.msg || "API 오류");
        }
      })
      .catch((e) => setError(e.message));

    // 2) 카테고리 목록
    fetch(`${apiUrl}/api/categories`)
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
        setCategories([]);
      });
  }, [recipeId]);

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
      requiredQuantity: "",
      unit: "G",
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
        ingredients: [{ ingredientName: "", requiredQuantity: "", unit: "G" }],
      },
    ]);
  };

  // 파트 삭제
  const removePart = (index: number) => {
    const newParts = parts.filter((_, i) => i !== index);
    setParts(
      newParts.length > 0
        ? newParts
        : [
            {
              partName: "",
              ingredients: [
                { ingredientName: "", requiredQuantity: "", unit: "G" },
              ],
            },
          ]
    );
  };

  // 카테고리 생성 모달에서 저장
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("카테고리 이름을 입력하세요.");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "카테고리 생성 실패");
      }
      const resp = await res.json();
      const created: Category = resp.data;
      setCategories((prev) => [...prev, created]);
      setSelectedCategoryId(created.categoryId.toString());
      setNewCategoryName("");
      setShowCategoryModal(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message || "카테고리 생성 중 오류가 발생했습니다.");
      } else {
        alert("카테고리 생성 중 오류가 발생했습니다.");
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

    setLoading(true);
    setError(null);

    // parts 유효성 체크 및 클린업
    const cleanParts = parts
      .filter((part) => part.partName.trim() && part.ingredients.length > 0)
      .map((part) => ({
        partName: part.partName.trim(),
        ingredients: part.ingredients
          .filter(
            (ing) =>
              ing.ingredientName.trim() &&
              ing.requiredQuantity !== "" &&
              ing.requiredQuantity !== null &&
              !isNaN(Number(ing.requiredQuantity)) &&
              ing.unit
          )
          .map((ing) => ({
            ingredientName: ing.ingredientName.trim(),
            quantity: parseFloat(String(ing.requiredQuantity)),
            unit: ing.unit,
          })),
      }));

    const payload = {
      name: name.trim(),
      description: description.trim(),
      outputQuantity: parseInt(String(outputQuantity), 10),
      categoryId: selectedCategoryId,
      parts: cleanParts,
    };

    try {
      const res = await fetch(`${apiUrl}/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "레시피 수정 실패");
      }

      alert("레시피가 수정되었습니다.");
      router.push(`/recipes/${recipeId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "오류가 발생했습니다.");
      } else {
        setError("오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar />
      <main className="px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
        <h2 className="text-2xl font-bold text-[#4E342E] mb-4 mt-2">
          레시피 수정
        </h2>

        {/* 레시피 이름 */}
        <div>
          <label className="block mb-1 font-semibold text-[#4E342E]">
            레시피 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
          />
        </div>

        {/* 카테고리 선택 */}
        <div>
          <label className="block mb-1 font-semibold text-[#4E342E]">
            카테고리
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="border border-gray-300 p-2 rounded-md flex-grow"
            >
              <option key="default" value="">
                — 카테고리 선택 —
              </option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId.toString()}>
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

        {/* 설명 */}
        <div>
          <label className="block mb-1 font-semibold text-[#4E342E]">
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full whitespace-pre-wrap rounded border border-gray-300 p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
          />
        </div>

        {/* 생산 수량 */}
        <div>
          <label className="block mb-1 font-semibold text-[#4E342E]">
            생산 수량
          </label>
          <input
            type="number"
            min={1}
            value={outputQuantity}
            onChange={(e) => setOutputQuantity(e.target.value)}
            className="w-24 rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#D7B49E]"
          />
        </div>

        <hr className="border-[#D7B49E] my-4" />

        {/* 파트 추가/삭제 */}
        <section>
          {parts.map((part, partIndex) => (
            <div
              key={partIndex}
              className="bg-[#FFF8F0] rounded-xl shadow-md border p-4 mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                {parts.length === 1 ? (
                  <div className="p-1 text-center text-[#A97155] font-semibold w-full">
                    재료 목록
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="파트명을 입력하세요."
                    value={part.partName}
                    onChange={(e) =>
                      handlePartNameChange(partIndex, e.target.value)
                    }
                    className="border border-gray-300 p-2 rounded-md w-1/3"
                  />
                )}

                {parts.length > 1 && (
                  <button
                    onClick={() => removePart(partIndex)}
                    className="text-[#BA8F66] text-2xl hover:text-[#966E3D]"
                    aria-label="파트 삭제"
                    title="파트 삭제"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {part.ingredients.map((ingredient, ingredientIndex) => (
                  <div
                    key={ingredientIndex}
                    className="flex gap-2 items-center"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPartIndex(partIndex);
                        setCurrentIngredientIndex(ingredientIndex);
                        setShowIngredientModal(true);
                      }}
                      className={`flex-grow border border-gray-300 p-2 rounded-md text-left ${
                        ingredient.ingredientName
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {ingredient.ingredientName || "재료명을 선택하세요"}
                    </button>
                    <input
                      type="number"
                      min={0}
                      placeholder="수량"
                      value={ingredient.requiredQuantity}
                      onChange={(e) =>
                        handlePartIngredientChange(
                          partIndex,
                          ingredientIndex,
                          "requiredQuantity",
                          e.target.value
                        )
                      }
                      className="w-20 rounded-md border border-gray-300 p-2"
                    />
                    <select
                      value={ingredient.unit}
                      onChange={(e) =>
                        handlePartIngredientChange(
                          partIndex,
                          ingredientIndex,
                          "unit",
                          e.target.value
                        )
                      }
                      className="rounded-md  border border-gray-300 p-2"
                    >
                      <option value="G">G</option>
                      <option value="Kg">Kg</option>
                      <option value="ml">ml</option>
                      <option value="개">개</option>
                    </select>
                    {part.ingredients.length > 1 && (
                      <button
                        onClick={() =>
                          removePartIngredient(partIndex, ingredientIndex)
                        }
                        className="text-[#BA8F66] hover:text-[#966E3D]"
                        aria-label="재료 삭제"
                        title="재료 삭제"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

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

        {error && <p className="text-red-500">{error}</p>}

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 py-5 w-full bg-[#B9896D] text-white rounded-xl"
        >
          {loading ? "저장 중..." : "수정 완료"}
        </Button>

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
      </main>
    </div>
  );
}
