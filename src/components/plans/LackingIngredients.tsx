import React from "react";

interface LackingIngredient {
  ingredientId: number | null | undefined;
  name: string;
  requiredQuantity: number;
  currentStock: number;
  lackingQuantity: number;
}

interface LackingIngredientsSectionProps {
  isComplete: boolean;
  lackIngredients: LackingIngredient[];
  setReplaceTarget: (target: {
    ingredientId: number | null | undefined;
    name: string;
  }) => void;
  setShowIngredientModal: (show: boolean) => void;
}

const LackingIngredientsSection: React.FC<LackingIngredientsSectionProps> = ({
  isComplete,
  lackIngredients,
  setReplaceTarget,
  setShowIngredientModal,
}) => {
  if (isComplete || lackIngredients.length === 0) {
    return null; // 완료되었거나 부족한 재료가 없으면 아무것도 렌더링하지 않음
  }

  return (
    <section>
      <h2 className="text-xl font-extrabold text-[#4E342E] mb-2">
        🛒 부족한 재료{" "}
        <span className="block sm:inline text-base font-bold text-gray-500">
          (재료 클릭시 쿠팡으로 이동합니다.)
        </span>
      </h2>
      <div className="space-y-3">
        <div className="bg-[#FFD8A9] rounded-xl shadow-md border px-6 py-2 flex items-center justify-between text-[#4E342E] font-semibold">
          <div className="flex-5 text-center">재료명</div>
          <div className="flex-5 text-center">필요량</div>
          <div className="flex-5 text-center">보유량</div>
          <div className="flex-5 text-center">부족량</div>
          <div className="flex-2 text-center"></div>
        </div>
        {lackIngredients.map((item) => (
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
            <button
              type="button"
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setReplaceTarget({
                  ingredientId: item.ingredientId,
                  name: item.name,
                });
                setShowIngredientModal(true);
              }}
            >
              교체하기
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LackingIngredientsSection;
