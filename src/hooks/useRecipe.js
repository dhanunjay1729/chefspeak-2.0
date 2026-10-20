import { useState, useRef, useCallback } from 'react';
import { RecipeApiService } from '../services/recipeApiService';
import { createRecipeAssembler } from '../utils/recipeData';
import { readRecipeStream } from '../utils/sse';

export function useRecipe() {
  const [steps, setSteps] = useState([]);
  const [ingredients, setIngredients] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [error, setError] = useState(null);
  const service = useRef(new RecipeApiService()).current;
  const requestId = useRef(0);

  const fetchRecipeSteps = async (dish, people, extraNotes, language, userPreferences = {}) => {
    const id = ++requestId.current;
    const active = () => id === requestId.current;
    setIsLoading(true);
    setIsLoadingNutrition(true);
    setSteps([]);
    setIngredients('');
    setCurrentStepIndex(0);
    setNutritionInfo(null);
    setError(null);
    const newAssembler = () => createRecipeAssembler(recipe => {
      if (active()) {
        setIngredients(recipe.ingredients);
        setSteps(recipe.steps);
      }
    });
    let assembler = newAssembler();
    try {
      const response = await service.fetchRecipeSteps(dish, people, extraNotes, language, userPreferences, { outputFormat: 'structured' });
      await readRecipeStream(response.body, content => assembler.append(content), () => {
        assembler = newAssembler();
        if (active()) {
          setIngredients('');
          setSteps([]);
          setCurrentStepIndex(0);
        }
      });
      const recipe = assembler.finish();
      if (!active()) return;
      setIsLoading(false);
      try {
        const nutritionResponse = await service.fetchNutritionInfo(dish, people, extraNotes, language, userPreferences, recipe.ingredients);
        const nutrition = await nutritionResponse.json();
        if (active()) setNutritionInfo(nutrition.error ? null : nutrition);
      } catch {
        if (active()) setNutritionInfo(null);
      }
      return recipe;
    } catch (err) {
      if (active()) setError(err.message || 'Failed to generate recipe');
      throw err;
    } finally {
      if (active()) {
        setIsLoading(false);
        setIsLoadingNutrition(false);
      }
    }
  };

  const restoreRecipe = useCallback((recipe, index = 0) => {
    requestId.current++;
    setIngredients(recipe.ingredients || '');
    setSteps(recipe.recipeSteps || []);
    setNutritionInfo(recipe.nutritionInfo || null);
    setCurrentStepIndex(index);
    setIsLoading(false);
    setIsLoadingNutrition(false);
    setError(null);
  }, []);

  const navigateToStep = (index) => {
    const next = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStepIndex(next);
    return steps[next];
  };
  return {
    steps, ingredients, currentStepIndex, nutritionInfo, isLoading, isLoadingNutrition, error,
    hasIngredients: Boolean(ingredients), ingredientsComplete: Boolean(ingredients),
    isLoadingIngredients: isLoading && !ingredients,
    fetchRecipeSteps, navigateToStep, restoreRecipe,
    handleNext: () => navigateToStep(currentStepIndex + 1),
    handleBack: () => navigateToStep(currentStepIndex - 1),
  };
}
