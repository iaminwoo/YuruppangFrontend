"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface RecipeItem {
  recipeId: number;
  recipeName: string;
  outputQuantity: number;
  favorite: boolean;
}

interface ApiResponse {
  resultCode: string;
  msg: string;
  data: {
    content: RecipeItem[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalPages: number;
  };
}

interface Category {
  categoryId: number;
  categoryName: string;
}

export default function RecipeListPage() {
  const router = useRouter();

  // 기존 상태
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [addedRecipes, setAddedRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [keyword, setKeyword] = useState<string>("");
  const [sortBy, setSortBy] = useState<"id" | "name">("id");
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // 카테고리 목록 가져오기 (초기 한 번)
  useEffect(() => {
    fetchWithAuth(`${apiUrl}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.resultCode === "OK") {
          setCategoryList(data.data);
        }
      })
      .catch(() => {
        // 실패 시 빈 배열 유지
      });
  }, []);

  // 서버에서 레시피 목록을 가져오는 함수
  const fetchRecipes = (
    pageNumber: number,
    categoryId: number | null,
    showLoading = false
  ) => {
    if (showLoading) setLoading(true);
    setError(null);

    // 기본 URL
    let url = `${apiUrl}/api/recipes?page=${pageNumber}&sortBy=${encodeURIComponent(
      sortBy
    )}`;

    // 카테고리 파라미터가 있으면 추가
    if (categoryId !== null && categoryId !== undefined) {
      url += `&category=${encodeURIComponent(categoryId)}`;
    }

    // 즐겨찾기 필터가 true면 추가
    if (favorite) {
      url += `&favorite=true`;
    }

    // 검색어가 빈 문자열이 아니면 파라미터 추가
    const trimmed = keyword.trim();
    if (trimmed.length > 0) {
      url += `&keyword=${encodeURIComponent(trimmed)}`;
    }

    fetchWithAuth(url)
      .then((res) => {
        if (!res.ok) throw new Error("네트워크 응답 오류");
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (data.resultCode === "OK") {
          setRecipes(data.data.content);

          if (data.data.pageable.pageNumber !== page) {
            setPage(data.data.pageable.pageNumber);
          }

          setTotalPages(data.data.totalPages);
        } else {
          setError(data.msg || "API 오류");
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => {
        if (showLoading) setLoading(false);
        if (initialLoading) setInitialLoading(false);
      });
  };

  useEffect(() => {
    fetchRecipes(page, selectedCategory, initialLoading);
  }, [page, selectedCategory, favorite, sortBy]);

  // 이전/다음 페이지 버튼 핸들러
  const handlePrev = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };
  const handleNext = () => {
    if (page + 1 < totalPages) {
      setPage(page + 1);
    }
  };

  // 레시피 추가/제거 및 제작 로직은 기존과 동일
  const handleAdd = (recipe: RecipeItem) => {
    if (!addedRecipes.find((r) => r.recipeId === recipe.recipeId)) {
      setAddedRecipes([recipe, ...addedRecipes]);
    }
  };
  const handleRemove = (recipeId: number) => {
    setAddedRecipes(addedRecipes.filter((r) => r.recipeId !== recipeId));
  };
  const handleProduce = async () => {
    const body = {
      recipes: addedRecipes.map((recipe) => recipe.recipeId),
    };

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("제작 요청 실패");
      const data = await res.json();
      if (data.resultCode === "OK" && data.data.planId) {
        router.push(`/plans/${data.data.planId}`);
      } else {
        alert("제작 실패: " + data.msg);
      }
    } catch (err) {
      alert("에러 발생: " + (err as Error).message);
    }
  };

  // 즐겨찾기 토글 로직 (기존)
  const toggleFavorite = async (recipeId: number) => {
    try {
      const res = await fetchWithAuth(
        `${apiUrl}/api/recipes/${recipeId}/favorite`,
        {
          method: "PATCH",
        }
      );
      if (!res.ok) throw new Error("즐겨찾기 변경 실패");
      setRecipes((prev) =>
        prev.map((r) =>
          r.recipeId === recipeId ? { ...r, favorite: !r.favorite } : r
        )
      );
    } catch (err) {
      alert("즐겨찾기 토글 에러: " + (err as Error).message);
    }
  };

  // 검색 버튼 클릭 시 페이지를 0으로 초기화
  const handleSearch = () => {
    setPage(0);
    fetchRecipes(0, selectedCategory, true);
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen font-sans flex flex-col">
      <Navbar />

      <main className="px-4 py-6 max-w-3xl mx-auto w-full flex-grow">
        {/* 로딩 / 에러 표시 */}
        {initialLoading && loading && (
          <div className="p-4 text-center text-[#A97155]">로딩중...</div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500">에러: {error}</div>
        )}

        {/* 추가된 레시피 */}
        {addedRecipes.length > 0 && (
          <div className="mb-6 p-4 bg-[#FFF1D0] rounded-xl shadow-md">
            <h3 className="font-bold text-xl text-[#4E342E] mb-2">
              추가된 레시피
            </h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {addedRecipes.map((recipe) => (
                <button
                  key={recipe.recipeId}
                  onClick={() => handleRemove(recipe.recipeId)}
                  className="px-3 py-1 bg-[#D7B49E] text-md font-semibold text-white rounded-full hover:bg-[#B89B7D]"
                  title="클릭 시 제거"
                >
                  {recipe.recipeName}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleProduce}
                className="bg-[#A97155] text-white text-base py-2 rounded-xl"
              >
                베이킹 플랜 제작
              </Button>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-[#4E342E] mb-3 mt-3">
          레시피 목록
        </h2>

        {/* ───────────────────────────────────────────── */}
        {/* 검색창 + 정렬 드롭다운 영역 */}
        <div className="flex gap-2 mb-4 items-center">
          {/* 검색 input */}
          <input
            type="text"
            placeholder="레시피 이름 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 min-w-0 text-sm border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#A97155]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          {/* 검색 버튼 */}
          <Button
            onClick={handleSearch}
            className="bg-[#A97155] text-white px-4 py-4 rounded-xl"
          >
            검색
          </Button>
        </div>
        {/* ───────────────────────────────────────────── */}

        {/* 카테고리 필터 버튼 영역 */}
        <div className="flex flex-col">
          {categoryList.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2 text-sm">
              <button
                className={`px-3 py-1 rounded-xl font-semibold ${
                  selectedCategory === null
                    ? "bg-[#A97155] text-white"
                    : "bg-[#F2E3D5]"
                }`}
                onClick={() => {
                  setSelectedCategory(null);
                  setPage(0);
                }}
              >
                전체
              </button>
              {categoryList.map((cat) => (
                <button
                  key={cat.categoryId}
                  className={`px-3 py-1 rounded-xl font-semibold ${
                    selectedCategory === cat.categoryId
                      ? "bg-[#A97155] text-white"
                      : "bg-[#F2E3D5]"
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat.categoryId);
                    setPage(0);
                  }}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center text-sm">
            {/* 정렬 기준 select */}
            <select
              value={sortBy}
              onChange={(e) => {
                // "id" or "name"을 사용
                setSortBy(e.target.value as "id" | "name");
                setPage(0); // 정렬 기준이 바뀌면 페이지 0으로
              }}
              className="border border-gray-300 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#A97155]"
            >
              <option value="id">최신순</option>
              <option value="name">이름순</option>
            </select>

            {/* 즐겨찾기 토글 버튼 */}
            <button
              className={`px-3 py-1 rounded-xl font-semibold ${
                favorite
                  ? "bg-pink-400 hover:bg-pink-500 text-white"
                  : "bg-[#F2E3D5] hover:bg-[#e5d2c2] text-gray-800"
              }`}
              onClick={() => {
                setFavorite(!favorite);
                setPage(0);
              }}
            >
              ♥ 즐겨찾기
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-300 my-4" />

        {/* 레시피 리스트 */}
        <ul className="space-y-4">
          {recipes.map((recipe) => (
            <li
              key={recipe.recipeId}
              className="p-4 bg-[#FFEED9] rounded-xl text-[#A97155] shadow-md flex justify-between items-center"
            >
              <Button
                onClick={() => handleAdd(recipe)}
                className="mr-3 py-3 bg-[#D7B49E] text-white text-sm rounded-xl"
              >
                추가
              </Button>

              <div
                onClick={() => router.push(`/recipes/${recipe.recipeId}`)}
                className="cursor-pointer flex-1"
              >
                <div className="flex justify-between items-center text-base font-medium">
                  <span className="text-lg font-bold">{recipe.recipeName}</span>
                  <span className="text-sm text-right text-gray-700">
                    완성 수량: {recipe.outputQuantity}개
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleFavorite(recipe.recipeId)}
                className={`ml-3 text-xl bg-transparent transition duration-200 relative top-[1px] ${
                  recipe.favorite ? "text-pink-400" : "text-gray-400"
                }`}
                title={recipe.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                ♥
              </button>
            </li>
          ))}
        </ul>

        {/* 페이징 버튼 */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={handlePrev}
            disabled={page === 0}
            className="w-24 bg-[#D7B49E] text-white py-2 rounded-xl disabled:bg-[#F1DCCB] disabled:text-[#C1A188]"
          >
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={page + 1 >= totalPages}
            className="w-24 bg-[#D7B49E] text-white py-2 rounded-xl disabled:bg-[#F1DCCB] disabled:text-[#C1A188]"
          >
            다음
          </Button>
        </div>
      </main>
    </div>
  );
}
