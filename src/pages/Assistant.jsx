// src/pages/Assistant.jsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { TTSService } from "../services/ttsService";
import { UserService } from "../services/userService";
import { useRecipe } from "../hooks/useRecipe";
import { useTimer } from "../hooks/useTimer";
import { RecipeForm } from "../components/RecipeForm";
import { RecipeStep } from "../components/RecipeStep";
import { TimerDisplay } from "../components/TimerDisplay";
import { NavigationControls } from "../components/NavigationControls";
import { NutritionInfo } from "../components/NutritionInfo";
import DishImage from "../components/DishImage";
import { addRecentDish } from "../services/userService";
import Header from "../components/Header"; 


export default function Assistant() {
  const { user } = useAuth();
  const [language, setLanguage] = useState("English");
  const [selectedDish, setSelectedDish] = useState("");

  const {
    steps,
    currentStepIndex,
    isLoading,
    nutritionInfo,
    isLoadingNutrition,
    fetchRecipeSteps,
    fetchNutritionInfo,
    handleNext,
    handleBack,
  } = useRecipe();

  const { remaining, startTimer } = useTimer();
  const ttsService = new TTSService();

  const firstStepSpokenRef = useRef(false);

  useEffect(() => {
    const loadUserLanguage = async () => {
      const userLanguage = await UserService.getUserLanguage(user);
      setLanguage(userLanguage || "English");
    };
    loadUserLanguage();
  }, [user]);

  // Speak as soon as the first step appears (don’t block UI)
  useEffect(() => {
    if (!firstStepSpokenRef.current && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, language, ttsService]);

  const handleFormSubmit = async ({ dishName, servings, notes }) => {
    setSelectedDish(dishName);
    firstStepSpokenRef.current = false; // reset for new recipe

    // Fire both, but do NOT await nutrition; steps stream to UI
    fetchNutritionInfo(dishName, servings, notes, language).catch(() => {});
    fetchRecipeSteps(dishName, servings, notes, language).catch(() => {});

    // Save recent dish entry
    try {
      if (user?.uid) {
        await addRecentDish(user.uid, {
          dishName,
          imageUrl: undefined, // set when available
          language,
          people: servings,
          notes, // extraNotes equivalent
        });
      }
    } catch (e) {
      console.log("recent dish save failed:", e);
    }
  };

  const handleSpeak = (text) => {
    ttsService.speak(text, language).catch(() => {});
  };

  const handleNavigateNext = () => {
    const nextStep = handleNext();
    if (nextStep) ttsService.speak(nextStep.text, language).catch(() => {});
  };

  const handleNavigateBack = () => {
    const prevStep = handleBack();
    if (prevStep) ttsService.speak(prevStep.text, language).catch(() => {});
  };

  const handleRepeat = () => {
    if (steps[currentStepIndex]) {
      ttsService.speak(steps[currentStepIndex].text, language).catch(() => {});
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">ChefSpeak Assistant</h1>

        <RecipeForm onSubmit={handleFormSubmit} isLoading={isLoading} />

        {selectedDish && (
          <div className="mb-6">
            <DishImage dishName={selectedDish} />
          </div>
        )}

        <NutritionInfo nutritionInfo={nutritionInfo} isLoading={isLoadingNutrition} />

        <div className="space-y-3 w-full max-w-md">
          {steps.map((step, index) => (
            <RecipeStep
              key={index}
              step={step}
              index={index}
              isActive={index === currentStepIndex}
              onSpeak={handleSpeak}
              onStartTimer={startTimer}
            />
          ))}

          {isLoading && steps.length === 0 && (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          )}
        </div>

        <TimerDisplay remaining={remaining} />

        <NavigationControls
          onBack={handleNavigateBack}
          onRepeat={handleRepeat}
          onNext={handleNavigateNext}
          hasSteps={steps.length > 0}
        />
      </div>
    </>
  );
}
