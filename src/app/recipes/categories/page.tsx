"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Category {
  categoryId: number;
  categoryName: string;
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedName, setEditedName] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [recipesInCategory, setRecipesInCategory] = useState<
    { recipeId: number; recipeName: string }[]
  >([]);
  const [recipeReassignments, setRecipeReassignments] = useState<
    { recipeId: number; newCategoryId: number }[]
  >([]);

  const fetchCategories = () => {
    fetch("http://localhost:8080/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.resultCode === "OK") {
          setCategories(data.data);
        }
      });
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setEditedName(category.categoryName);
  };

  const handleEditSave = () => {
    if (!editedName.trim() || !editingCategory) return;

    fetch(
      `http://localhost:8080/api/categories/${editingCategory.categoryId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.resultCode === "OK") {
          setEditingCategory(null);
          setEditedName("");
          fetchCategories();
        } else {
          alert("수정 실패: " + data.msg);
        }
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    fetch("http://localhost:8080/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.resultCode === "OK") {
          setNewCategoryName("");
          fetchCategories();
        } else {
          alert("추가 실패: " + data.msg);
        }
      });
  };

  const handleDelete = (id: number) => {
    if (!confirm("정말 삭제할까요?")) return;

    fetch(`http://localhost:8080/api/categories/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.resultCode === "OK") {
          fetchCategories();
        } else {
          alert("삭제 실패: " + data.msg);
        }
      });
  };

  const handleDeleteClick = async (category: Category) => {
    // 카테고리 내 레시피 목록을 가져오는 API 호출
    const res = await fetch(
      `http://localhost:8080/api/categories/${category.categoryId}/recipes`
    );
    const data = await res.json();

    if (data.resultCode === "OK") {
      setCategoryToDelete(category);
      setRecipesInCategory(data.data); // [{recipeId, recipeName}]
      // 초기값 설정
      setRecipeReassignments(
        data.data.map((recipe: any) => ({
          recipeId: recipe.recipeId,
          newCategoryId: 0, // 사용자가 선택해야 함
        }))
      );
    }
  };

  const handleReassignmentChange = (
    recipeId: number,
    newCategoryId: number
  ) => {
    setRecipeReassignments((prev) =>
      prev.map((item) =>
        item.recipeId === recipeId ? { ...item, newCategoryId } : item
      )
    );
  };

  const handleConfirmDelete = () => {
    if (recipeReassignments.some((r) => r.newCategoryId === 0)) {
      alert("모든 레시피의 새로운 카테고리를 선택해주세요.");
      return;
    }

    fetch(
      `http://localhost:8080/api/categories/${categoryToDelete?.categoryId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes: recipeReassignments }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.resultCode === "OK") {
          setCategoryToDelete(null);
          setRecipesInCategory([]);
          setRecipeReassignments([]);
          fetchCategories();
        } else {
          alert("삭제 실패: " + data.msg);
        }
      });
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans">
      <Navbar />
      <main className="px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
        <h2 className="text-2xl font-bold text-[#4E342E] mb-4">
          카테고리 관리
        </h2>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="새 카테고리 이름"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button
            onClick={handleAddCategory}
            className="bg-[#A97155] text-white px-4"
          >
            추가
          </Button>
        </div>

        <ul className="space-y-3">
          {categories.map((cat) => (
            <li
              key={cat.categoryId}
              className="flex justify-between items-center p-3 bg-[#FFEED9] rounded-md shadow-sm"
            >
              <span className="text-lg font-medium text-[#4E342E]">
                {cat.categoryName}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEditClick(cat)}
                  className="bg-green-400 text-white px-3 py-1 text-sm rounded-md"
                >
                  수정
                </Button>
                <Button
                  onClick={() => handleDeleteClick(cat)}
                  className="bg-red-400 text-white px-3 py-1 text-sm rounded-md"
                >
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {editingCategory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm sm:max-w-lg mx-4 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">카테고리 이름 수정</h2>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="새 이름"
              className="border border-gray-300 p-2 w-full rounded-md mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
                type="button"
              >
                취소
              </Button>
              <Button
                onClick={handleEditSave}
                className="bg-green-500 text-white"
                type="button"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm sm:max-w-lg space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold">
              '{categoryToDelete.categoryName}' 카테고리 삭제
            </h2>
            {recipesInCategory.length > 0 && (
              <p className="text-sm text-gray-600">
                포함된 레시피를 다른 카테고리로 옮긴 후 삭제할 수 있습니다.
              </p>
            )}
            {recipesInCategory.map((recipe) => (
              <div key={recipe.recipeId} className="flex items-center gap-2">
                <span className="w-1/2">{recipe.recipeName}</span>
                <select
                  className="w-1/2 border p-1 rounded"
                  value={
                    recipeReassignments.find(
                      (r) => r.recipeId === recipe.recipeId
                    )?.newCategoryId || 0
                  }
                  onChange={(e) =>
                    handleReassignmentChange(
                      recipe.recipeId,
                      Number(e.target.value)
                    )
                  }
                >
                  <option value={0}>카테고리 선택</option>
                  {categories
                    .filter((c) => c.categoryId !== categoryToDelete.categoryId)
                    .map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                </select>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCategoryToDelete(null)}
              >
                취소
              </Button>
              <Button
                className="bg-red-500 text-white"
                onClick={handleConfirmDelete}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
