import { PanResponse } from "../recipes/CreatePanModal";

export interface Ingredient {
  ingredientId: number;
  name: string;
  requiredQuantity: number;
  currentStock: number;
  lackingQuantity: number;
}

export interface RecipeIngredient {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  originalQuantity: number;
  customizedQuantity: number | string;
}

export interface Part {
  partName: string;
  percent: number;
  comparedIngredients: RecipeIngredient[];
}

export interface Recipe {
  recipeId: number;
  name: string;
  description: string;
  totalPrice: number;
  customName: string;
  customDescription: string;
  pan: PanResponse;
  outputQuantity: number;
  goalQuantity: number | string;
  percent: number;
  comparedParts: Part[];
}

export interface PlanDetail {
  name: string;
  memo: string;
  isComplete: boolean;
  recipeDetails: Recipe[];
  lackIngredients: Ingredient[];
}

export interface ApiResponse<T> {
  resultCode: string;
  msg: string;
  data: T;
}

export interface PlanDetailResponse {
  planId: number;
  name: string;
  memo: string;
  isComplete: boolean;
  recipeDetails: ApiRecipeDetail[];
  lackIngredients: Ingredient[];
}

export interface RecipeSearchItem {
  recipeId: number;
  recipeName: string;
  outputQuantity: number;
  favorite: boolean;
}

export interface RecipeSearchResponse {
  content: RecipeSearchItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
}

export interface ApiRecipeDetail {
  recipeId: number;
  recipeName: string;
  recipeDescription: string;
  totalPrice: number;
  customRecipeName: string;
  customRecipeDescription: string;
  pan: PanResponse;
  outputQuantity: number;
  goalQuantity: number | string;
  percent: number;
  comparedParts: ApiComparedPart[];
}

export interface ApiComparedPart {
  partName: string;
  percent: number;
  comparedIngredients: ApiComparedIngredient[];
}

export interface ApiComparedIngredient {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  originalQuantity: number;
  customizedQuantity: number | string;
}