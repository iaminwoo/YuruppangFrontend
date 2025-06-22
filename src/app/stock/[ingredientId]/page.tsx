"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface IngredientResponse {
  ingredientId: number;
  name: string;
  unit: string;
  unitPrice: number;
  totalStock: number;
  density: number;
}

export default function StockPage() {
  const { ingredientId } = useParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [ingredient, setIngredient] = useState<IngredientResponse | null>(null);
  const [unitVolume, setUnitVolume] = useState("");
  const [unitWeight, setUnitWeight] = useState("");
  const [loading, setLoading] = useState(false);

  // 단위 선택 상태
  const [newUnit, setNewUnit] = useState<string>("");

  useEffect(() => {
    if (!ingredientId) return;

    fetchWithAuth(`${apiUrl}/api/ingredients/${ingredientId}`)
      .then((res) => res.json())
      .then((data) => {
        setIngredient(data.data);
      })
      .catch((err) => {
        alert("재료 정보를 불러오는데 실패했습니다.");
        console.error(err);
      });
  }, [ingredientId, apiUrl]);

  useEffect(() => {
    if (ingredient) {
      setNewUnit(ingredient.unit); // 기존 단위로 설정
    }
  }, [ingredient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredientId || !unitVolume || !unitWeight) {
      alert("모든 값을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithAuth(
        `${apiUrl}/api/ingredients/${ingredientId}/recalculate-quantity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            unitVolume: parseFloat(unitVolume),
            unitWeight: parseFloat(unitWeight),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("서버 오류");
      }

      const result = await res.json();
      setIngredient(result.data);
      setUnitVolume("");
      setUnitWeight("");
      alert("밀도 및 수량이 성공적으로 변경되었습니다.");
    } catch (error) {
      alert("밀도 변경 요청 중 문제가 발생했습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const ingredientUnits = ["g", "ml", "개"];

  // 단위 변경 핸들러
  const handleUnitChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientId || !newUnit) {
      alert("단위를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithAuth(
        `${apiUrl}/api/ingredients/${ingredientId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newUnit, // 서버에서 IngredientUnit enum의 name(G, ML, EA)을 받아야 하므로 key를 맞춤
          }),
        }
      );

      if (!res.ok) {
        throw new Error("서버 오류");
      }

      const result = await res.json();
      setIngredient(result.data);
      setNewUnit(result.data.unit);
      alert("단위가 성공적으로 변경되었습니다.");
    } catch (error) {
      alert("단위 변경 요청 중 문제가 발생했습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar pageTitle={`${ingredient?.name ?? "재료"} 세부 페이지`} />

      <div className="px-4 py-6 max-w-4xl mx-auto w-full space-y-4">
        <h2 className="text-xl font-bold text-[#4E342E] mb-4 mt-2">
          재료 디테일
        </h2>

        <div>
          {ingredient ? (
            <>
              <div className="flex flex-col gap-3 rounded-lg p-4 w-full text-sm bg-[#FFEED9] rounded-xl">
                <p>
                  <strong>이름 :</strong> {ingredient.name}
                </p>
                <p>
                  <strong>단위 :</strong> {ingredient.unit}
                </p>
                <p>
                  <strong>총 재고 :</strong> {ingredient.totalStock} g
                </p>
                <p>
                  <strong>단위당 가격 :</strong> {ingredient.unitPrice}원
                </p>
                <p>
                  <strong>밀도 :</strong> {ingredient.density} g/
                  {ingredient.unit}
                </p>
              </div>

              <div className="h-px bg-gray-300 my-4" />

              <h2 className="text-xl font-bold text-[#4E342E]">
                재료 단위 변경
              </h2>

              <form onSubmit={handleUnitChangeSubmit} className="space-y-2">
                <div className="w-full text-sm bg-[#FFEED9] rounded-xl flex flex-col gap-3 px-3 py-6">
                  <p>재료의 단위를 변경합니다. (g / ml / 개)</p>

                  <div className="flex items-center gap-2">
                    <label htmlFor="unit-select" className="font-semibold">
                      변경할 단위:
                    </label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                    >
                      <option value="" disabled>
                        단위 선택
                      </option>
                      {ingredientUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-24 bg-[#D7B49E] text-white py-5 mt-3 rounded-xl hover:bg-[#c4a58e] disabled:opacity-50"
                >
                  {loading ? "저장 중..." : "단위 저장"}
                </Button>
              </form>

              <div className="h-px bg-gray-300 my-4" />

              <h2 className="text-xl font-bold text-[#4E342E] mb-4 mt-2">
                재료 밀도 변경
              </h2>

              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="w-full text-sm bg-[#FFEED9] rounded-xl flex flex-col gap-3 px-3 py-6">
                  <div className="flex flex-col gap-2">
                    <p>재료의 밀도를 변경합니다.</p>
                    <p>단위에 맞게 부피 및 개수의 무게를 측정해주세요.</p>
                    <p>(예: 100 ml = 104 g, 1 개 = 50g)</p>
                    <p>입력하신 밀도에 맞게 재고량이 변화합니다.</p>
                  </div>

                  <div className="h-px bg-gray-300" />
                  <div className="font-semibold flex flex-col sm:flex-row gap-1">
                    <p>
                      <span className="px-2 py-1">{ingredient.name}</span>
                      <span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="ex) 100"
                          className="border rounded px-2 py-1 w-20 mx-2"
                          value={unitVolume}
                          onChange={(e) => setUnitVolume(e.target.value)}
                        />{" "}
                        {ingredient?.unit} 의 무게는
                      </span>
                    </p>

                    <span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ex) 103"
                        className="border rounded px-2 py-1 w-20 mx-2"
                        value={unitWeight}
                        onChange={(e) => setUnitWeight(e.target.value)}
                      />{" "}
                      g 입니다.
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-24 bg-[#D7B49E] text-white py-5 mt-3 rounded-xl hover:bg-[#c4a58e] disabled:opacity-50"
                >
                  {loading ? "저장 중..." : "밀도 저장"}
                </Button>
              </form>
            </>
          ) : (
            <p>재료 정보를 불러오는 중...</p>
          )}
        </div>
      </div>
    </div>
  );
}
