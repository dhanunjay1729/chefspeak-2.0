// src/pages/Assistant.jsx
import { useEffect, useRef, useState, Fragment } from "react"; // ✅ Make sure useRef is imported
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { TTSService } from "../services/ttsService";
import { UserService } from "../services/userService";
import { useRecipe } from "../hooks/useRecipe";
import { useTimer } from "../hooks/useTimer";
import { RecipeForm } from "../components/RecipeForm";
import { RecipeStep } from "../components/RecipeStep";
import { TimerDisplay } from "../components/TimerDisplay";
import { NavigationControls } from "../components/NavigationControls";
import { NutritionInfo } from "../components/NutritionInfo";
import { IngredientsInfo } from "../components/IngredientsInfo";
import { FavoriteButton } from "../components/FavoriteButton";
import { NonVegWarningDialog } from "../components/NonVegWarningDialog";
import { DishAnalysisService } from "../services/dishAnalysisService";
import { addRecentDish } from "../services/userService";
import Header from "../components/Header"; 
import { useSearchParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ChefHat, Sparkles } from "lucide-react";
import { AudioControls } from "../components/AudioControls";
import { LoadingSpinner } from "../components/LoadingSpinner"; // ✅ Import
import { AnalyticsService } from "../services/analyticsService"; // ✅ Import

export default function Assistant() {
  const { user } = useAuth();
  const { preferredLanguage, dietType, allergies, dislikes, skillLevel, refreshProfile } = useUserProfile();
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState("English");
  const [selectedDish, setSelectedDish] = useState("");
  
  const [prefilledData, setPrefilledData] = useState(null);
  
  const [showNonVegWarning, setShowNonVegWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [detectedIngredients, setDetectedIngredients] = useState([]);

  const {
    steps,
    ingredients,
    hasIngredients,
    ingredientsComplete,
    currentStepIndex,
    isLoading,
    isLoadingIngredients,
    nutritionInfo,
    isLoadingNutrition,
    fetchRecipeSteps,
    fetchNutritionInfo,
    handleNext,
    handleBack,
  } = useRecipe();

  const { remaining, startTimer } = useTimer();
  
  // ✅ Create TTS instance ONCE using useRef (persists across re-renders)
  const ttsService = useRef(new TTSService()).current;

  const firstStepSpokenRef = useRef(false);
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);
  const [stateRestored, setStateRestored] = useState(false);

  // ✅ Add ref to track the active step element
  const activeStepRef = useRef(null);

  useEffect(() => {
    setLanguage(preferredLanguage);
  }, [preferredLanguage]);

  useEffect(() => {
    const dishFromUrl = searchParams.get('dish');
    const peopleFromUrl = searchParams.get('people');
    const languageFromUrl = searchParams.get('language');
    const ingredientsFromUrl = searchParams.get('ingredients');
    
    if (dishFromUrl) {
      const notes = ingredientsFromUrl 
        ? `Use these ingredients: ${ingredientsFromUrl}`
        : '';
      
      setPrefilledData({
        dishName: dishFromUrl,
        servings: peopleFromUrl ? parseInt(peopleFromUrl, 10) : 2,
        notes: notes
      });
      setSelectedDish(dishFromUrl);
      
      if (languageFromUrl) {
        setLanguage(languageFromUrl);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!firstStepSpokenRef.current && ingredientsComplete && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, ingredientsComplete, language, ttsService]);

  useEffect(() => {
    const saveCompleteRecipe = async () => {
      if (
        user?.uid &&
        selectedDish &&
        ingredientsComplete &&
        steps.length > 0 &&
        !isLoading &&
        !isLoadingNutrition
      ) {
        try {
          await addRecentDish(user.uid, {
            dishName: selectedDish,
            imageUrl: undefined,
            language,
            people: prefilledData?.servings || 2,
            notes: prefilledData?.notes || '',
            ingredients: ingredients,
            recipeSteps: steps,
            nutritionInfo: nutritionInfo || null,
          });
        } catch (error) {
          console.error("Failed to save complete recipe:", error);
        }
      }
    };

    saveCompleteRecipe();
  }, [
    user?.uid,
    selectedDish,
    ingredientsComplete,
    steps,
    ingredients,
    nutritionInfo,
    isLoading,
    isLoadingNutrition,
    language,
    prefilledData?.servings,
    prefilledData?.notes
  ]);

  const processRecipeRequest = async (formData, userPreferences) => {
    const { dishName, servings, notes } = formData;
    
    setSelectedDish(dishName);
    firstStepSpokenRef.current = false;
    setTimerOwnerIndex(null);

    setPrefilledData({ dishName, servings, notes });

    fetchNutritionInfo(dishName, servings, notes, language, userPreferences).catch(() => {});
    fetchRecipeSteps(dishName, servings, notes, language, userPreferences).catch(() => {});
  };

  const handleFormSubmit = async ({ dishName, servings, notes }) => {
    sessionStorage.removeItem('chefspeak_assistant_state');
    
    const userPreferences = {
      dietType,
      allergies,
      dislikes,
      skillLevel
    };

    if ((dietType === 'veg' || dietType === 'vegan') && DishAnalysisService.isNonVegDish(dishName)) {
      const detected = DishAnalysisService.getDetectedNonVegIngredients(dishName);
      setDetectedIngredients(detected);
      setPendingFormData({ dishName, servings, notes });
      setShowNonVegWarning(true);
      return;
    }

    await processRecipeRequest({ dishName, servings, notes }, userPreferences);

    // ✅ Track recipe generation
    AnalyticsService.trackRecipeGenerated(dishName, language);
  };

  const updateUserDietPreference = async (newDietType) => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        diet: newDietType,
        updatedAt: Date.now()
      });
      
      if (refreshProfile) {
        await refreshProfile();
      }
      
      console.log(`Updated user diet preference to: ${newDietType}`);
    } catch (error) {
      console.error("Failed to update diet preference:", error);
      throw error;
    }
  };

  const handleNonVegWarningResponse = async (action) => {
    if (!pendingFormData) return;

    const userPreferences = {
      dietType,
      allergies,
      dislikes,
      skillLevel
    };

    if (action === 'vegetarian') {
      const vegDishName = `vegetarian ${pendingFormData.dishName}`;
      await processRecipeRequest({
        ...pendingFormData,
        dishName: vegDishName
      }, userPreferences);
    } else if (action === 'continue') {
      try {
        await updateUserDietPreference('nonveg');
        
        const updatedPreferences = {
          ...userPreferences,
          dietType: 'nonveg'
        };
        
        await processRecipeRequest(pendingFormData, updatedPreferences);
        
        console.log("Your diet preference has been updated to Non-Vegetarian");
      } catch (error) {
        console.error("Failed to update diet preference:", error);
        const overriddenPreferences = {
          ...userPreferences,
          dietType: 'nonveg'
        };
        await processRecipeRequest(pendingFormData, overriddenPreferences);
      }
    }

    setShowNonVegWarning(false);
    setPendingFormData(null);
  };

  // ✅ UPDATED: Stop previous audio before speaking
  const handleSpeak = (text) => {
    ttsService.speak(text, language);
    
    // ✅ Track TTS usage
    AnalyticsService.trackTTSUsed(language);
  };

  // ✅ UPDATED: Stop previous audio before speaking next step
  const handleNavigateNext = () => {
    const nextStep = handleNext();
    if (nextStep) {
      ttsService.speak(nextStep.text, language).catch(() => {});
    }
  };

  // ✅ UPDATED: Stop previous audio before speaking previous step
  const handleNavigateBack = () => {
    const prevStep = handleBack();
    if (prevStep) {
      ttsService.speak(prevStep.text, language).catch(() => {});
    }
  };

  // ✅ UPDATED: Stop previous audio before repeating
  const handleRepeat = () => {
    if (steps[currentStepIndex]) {
      ttsService.speak(steps[currentStepIndex].text, language).catch(() => {});
    }
  };

  const handleStartTimerForStep = (index) => (seconds) => {
    setTimerOwnerIndex(index);
    startTimer(seconds);
  };

  const currentRecipe = selectedDish && ingredientsComplete && steps.length > 0 ? {
    dishName: selectedDish,
    language,
    people: prefilledData?.servings || 2,
    notes: prefilledData?.notes || '',
    ingredients: ingredients,
    recipeSteps: steps,
    nutritionInfo: nutritionInfo || null,
  } : null;

  useEffect(() => {
    if (stateRestored) return;

    const savedState = sessionStorage.getItem('chefspeak_assistant_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        const dishFromUrl = searchParams.get('dish');
        if (!dishFromUrl && state.selectedDish) {
          setSelectedDish(state.selectedDish);
          setLanguage(state.language || preferredLanguage);
          setPrefilledData(state.prefilledData || null);
        }
      } catch (error) {
        console.error('Failed to restore state:', error);
      }
    }
    setStateRestored(true);
  }, [stateRestored, searchParams, preferredLanguage]);

  useEffect(() => {
    if (!stateRestored) return;

    const stateToPersist = {
      selectedDish,
      language,
      prefilledData,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('chefspeak_assistant_state', JSON.stringify(stateToPersist));
  }, [selectedDish, language, prefilledData, stateRestored]);

  // ✅ CLEANUP: Stop audio when component unmounts
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [ttsService]);

  // ✅ Auto-scroll to active step when it changes
  useEffect(() => {
    if (activeStepRef.current && ingredientsComplete && steps.length > 0) {
      activeStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Centers the step in the viewport
        inline: 'nearest'
      });
    }
  }, [currentStepIndex, ingredientsComplete, steps.length]);

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

        {/* Nutrition Info - separate */}
        <NutritionInfo nutritionInfo={nutritionInfo} isLoading={isLoadingNutrition} />
        
        {/* Ingredients Info - separate */}
        <IngredientsInfo ingredients={ingredients} isLoading={isLoadingIngredients} />
        
        {/* Favorite button */}
        {currentRecipe && !isLoading && !isLoadingNutrition && (
          <div className="w-full max-w-md mb-4">
            <FavoriteButton 
              recipe={currentRecipe}
              className="w-full justify-center"
              onFavoriteChange={(favorited) => {}}
            />
          </div>
        )}

        {/* Recipe steps loading animation */}
        {isLoading && steps.length === 0 && (
          <div className="w-full max-w-md mb-6">
            {/* Animated background gradient orbs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fuchsia-400/20 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-amber-400/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative flex flex-col items-center gap-6">
              {/* Animated cooking pot with steam */}
              <div className="relative">
                {/* Main chef hat */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-rose-500/50">
                  <ChefHat className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: '1.5s' }} />
                </div>
                
                {/* Rotating border */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400 border-r-rose-500 animate-spin" style={{ animationDuration: '2s' }} />
                
                {/* Pulsing glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-fuchsia-500 animate-ping opacity-20" />
                
                {/* Steam bubbles */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-float" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 rounded-full bg-rose-400/60 animate-float" style={{ animationDelay: '0.3s' }} />
                  <div className="w-2 h-2 rounded-full bg-fuchsia-400/60 animate-float" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>

              {/* Animated text */}
              <div className="text-center space-y-3">
                <p className="text-xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent animate-pulse">
                  👨‍🍳 Crafting your recipe...
                </p>
                <p className="text-sm text-zinc-600 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>Preparing step-by-step instructions</span>
                  <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
                </p>
              </div>

              {/* Animated cooking process dots */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 animate-bounce shadow-lg shadow-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 animate-bounce shadow-lg shadow-rose-500/50" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 animate-bounce shadow-lg shadow-fuchsia-500/50" style={{ animationDelay: '300ms' }} />
              </div>

              {/* Progress bar with shimmer */}
              <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 rounded-full animate-progress-shimmer" />
              </div>

              {/* Cooking tips */}
              <div className="text-xs text-zinc-500 italic text-center max-w-xs animate-fade-in-out">
                💡 Pro tip: The secret ingredient is always love!
              </div>
            </div>
          </div>
        )}

        {/* Recipe Steps */}
        <div className="space-y-3 w-full max-w-md">
          {ingredientsComplete && steps.map((step, index) => (
            <Fragment key={index}>
              {/* ✅ Add ref to the active step */}
              <div ref={index === currentStepIndex ? activeStepRef : null}>
                <RecipeStep
                  step={step}
                  index={index}
                  isActive={index === currentStepIndex}
                  onSpeak={handleSpeak}
                  onStartTimer={handleStartTimerForStep(index)}
                />
              </div>
              
              {index === currentStepIndex && (
                <div className="w-full px-2">
                  <AudioControls ttsService={ttsService} />
                </div>
              )}
              
              {timerOwnerIndex === index && remaining > 0 && (
                <div className="pl-3">
                  <TimerDisplay remaining={remaining} />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        startTimer(0);
                        setTimerOwnerIndex(null);
                      }}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200"
                    >
                      Stop
                    </button>
                    <button
                      type="button"
                      onClick={() => startTimer(remaining + 60)}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-amber-50 text-amber-800 hover:bg-amber-100 active:bg-amber-200"
                    >
                      +1 min
                    </button>
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <NavigationControls
          onBack={handleNavigateBack}
          onRepeat={handleRepeat}
          onNext={handleNavigateNext}
          hasSteps={ingredientsComplete && steps.length > 0}
        />

        <NonVegWarningDialog
          isOpen={showNonVegWarning}
          onClose={() => {
            setShowNonVegWarning(false);
            setPendingFormData(null);
          }}
          onContinue={handleNonVegWarningResponse}
          dishName={pendingFormData?.dishName}
          detectedIngredients={detectedIngredients}
        />
      </div>

      {/* ✅ Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-20px) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        @keyframes fade-in-out {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .animate-float {
          animation: float 2s ease-in-out infinite;
        }

        .animate-progress-shimmer {
          animation: progress-shimmer 2s ease-in-out infinite;
          width: 50%;
        }

        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
