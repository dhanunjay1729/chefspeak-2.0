// src/pages/Assistant.jsx
import { useEffect, useRef, useState, Fragment } from "react";
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
import { addRecentDish } from "../services/userService";
import Header from "../components/Header"; 
import { useSearchParams } from "react-router-dom";

export default function Assistant() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState("English");
  const [selectedDish, setSelectedDish] = useState("");
  
  // Pre-filled form data from URL params
  const [prefilledData, setPrefilledData] = useState(null);

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
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);

  useEffect(() => {
    const loadUserLanguage = async () => {
      const userLanguage = await UserService.getUserLanguage(user);
      setLanguage(userLanguage || "English");
    };
    loadUserLanguage();
  }, [user]);

  // Extract URL parameters on component mount
  useEffect(() => {
    const dishFromUrl = searchParams.get('dish');
    const peopleFromUrl = searchParams.get('people');
    const languageFromUrl = searchParams.get('language');
    
    if (dishFromUrl) {
      setPrefilledData({
        dishName: dishFromUrl,
        servings: peopleFromUrl ? parseInt(peopleFromUrl, 10) : 2,
        notes: ''
      });
      setSelectedDish(dishFromUrl);
      
      if (languageFromUrl) {
        setLanguage(languageFromUrl);
      }
    }
  }, [searchParams]);

  // Speak as soon as the first step appears (don't block UI)
  useEffect(() => {
    if (!firstStepSpokenRef.current && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, language, ttsService]);

  const handleFormSubmit = async ({ dishName, servings, notes }) => {
    setSelectedDish(dishName);
    firstStepSpokenRef.current = false; // reset for new recipe
    setTimerOwnerIndex(null); // clear any previous timer owner

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

  // Start a timer and remember which step owns it
  const handleStartTimerForStep = (index) => (seconds) => {
    setTimerOwnerIndex(index);
    startTimer(seconds);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">ChefSpeak Assistant</h1>

        <RecipeForm 
          onSubmit={handleFormSubmit} 
          isLoading={isLoading}
          initialData={prefilledData}
        />

        <NutritionInfo nutritionInfo={nutritionInfo} isLoading={isLoadingNutrition} />

        <div className="space-y-3 w-full max-w-md">
          {steps.map((step, index) => (
            <Fragment key={index}>
              <RecipeStep
                step={step}
                index={index}
                isActive={index === currentStepIndex}
                onSpeak={handleSpeak}
                onStartTimer={handleStartTimerForStep(index)}
              />
              {timerOwnerIndex === index && remaining > 0 && (
                <div className="pl-3">
                  <TimerDisplay remaining={remaining} />
                  {/* Controls under the inline time remaining */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        startTimer(0);
                        setTimerOwnerIndex(null);
                      }}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200
                                 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
                    >
                      Stop
                    </button>
                    <button
                      type="button"
                      onClick={() => startTimer(remaining + 60)}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-amber-50 text-amber-800 hover:bg-amber-100 active:bg-amber-200
                                 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                    >
                      +1 min
                    </button>
                  </div>
                </div>
              )}
            </Fragment>
          ))}

          {isLoading && steps.length === 0 && (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          )}
        </div>

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
