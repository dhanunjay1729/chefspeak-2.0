import { readLocalCookingNotes, writeLocalCookingNotes } from '../utils/localRecipeNotes';
import { RecipeNotes } from '../components/RecipeNotes';
import { readCookingSession, writeCookingSession, clearCookingSession } from '../utils/cookingSession';
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
import { addRecentDish, saveCookingNotes } from "../services/userService";
import Header from "../components/Header"; 
import { useSearchParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ChefHat, Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import { AudioControls } from "../components/AudioControls";
import { LoadingSpinner } from "../components/LoadingSpinner"; // ✅ Import
import { AnalyticsService } from "../services/analyticsService"; // ✅ Import
import { toast } from "../contexts/ToastContext";

export default function Assistant() {
  const { user } = useAuth();
  const { preferredLanguage, dietType, allergies, dislikes, skillLevel, refresh: refreshProfile } = useUserProfile();
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
    ingredientsComplete,
    currentStepIndex,
    isLoading,
    isLoadingIngredients,
    nutritionInfo,
    isLoadingNutrition,
    error: recipeError,
    fetchRecipeSteps,
    restoreRecipe,
    handleNext,
    handleBack,
  } = useRecipe();

  const { remaining, deadline, startTimer, stopTimer, restoreTimer, addMinute } = useTimer();
  
  // ✅ Create TTS instance ONCE using useRef (persists across re-renders)
  const ttsService = useRef(new TTSService()).current;

  const firstStepSpokenRef = useRef(false);
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);
  const [stateRestored, setStateRestored] = useState(false);
  const [finished, setFinished] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  const [cookingNotes, setCookingNotes] = useState('');
  const [savedRecipeId, setSavedRecipeId] = useState(null);
  const generationRef = useRef(0);
  const recipeSavedRef = useRef(false); // ✅ FIX #5: Prevent duplicate saves

  // ✅ Add ref to track the active step element
  const activeStepRef = useRef(null);

  useEffect(() => {
    if (readCookingSession(user?.uid)?.path !== "/assistant" && !searchParams.get("language")) setLanguage(preferredLanguage);
  }, [preferredLanguage, user?.uid, searchParams]);

  useEffect(() => {
    const dishFromUrl = searchParams.get('dish');
    const peopleFromUrl = searchParams.get('people');
    const languageFromUrl = searchParams.get('language');
    const ingredientsFromUrl = searchParams.get('ingredients');
    
    if (dishFromUrl) {
      const required = searchParams.get('required');
      const optional = searchParams.get('optional');
      const notes = [
        ingredientsFromUrl ? `Available ingredients: ${ingredientsFromUrl}.` : '',
        required ? `Use this dish plan's required ingredients: ${required}. Do not introduce other required ingredients.` : '',
        optional ? `Optional garnishes (omit if unavailable): ${optional}.` : '',
      ].filter(Boolean).join(' ');
      
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
    if (stateRestored && !firstStepSpokenRef.current && ingredientsComplete && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, ingredientsComplete, language, ttsService, stateRestored]);

  // ✅ FIX #5: Save recipe only ONCE, after both loading states resolve
  useEffect(() => {
    // Reset the saved flag when a new recipe starts loading
    if (isLoading || isLoadingNutrition) {
      recipeSavedRef.current = false;
      return;
    }

    // Don't save if already saved, or if no recipe data
    if (
      recipeSavedRef.current ||
      recipeError ||
      !user?.uid ||
      !selectedDish ||
      !ingredientsComplete ||
      steps.length === 0
    ) return;

    recipeSavedRef.current = true;

    const generation = generationRef.current;
    addRecentDish(user.uid, {
      dishName: selectedDish,
      imageUrl: undefined,
      language,
      people: prefilledData?.servings || 2,
      notes: prefilledData?.notes || '',
      ingredients: ingredients,
      recipeSteps: steps,
      nutritionInfo: nutritionInfo || null,
      cookingNotes,
    }).then(id => {
      if (generation === generationRef.current) setSavedRecipeId(id);
    }).catch(() => {
      if (generation === generationRef.current) {
        recipeSavedRef.current = false;
        toast.error('Unable to save recipe history. Keep this page open to continue cooking.');
      }
    });
  }, [isLoading, isLoadingNutrition, user?.uid, selectedDish, ingredientsComplete, steps, ingredients, nutritionInfo, language, prefilledData, recipeError, cookingNotes]);

  const processRecipeRequest = async (formData, userPreferences) => {
    const { dishName, servings, notes } = formData;
    
    generationRef.current++;
    setSavedRecipeId(null);
    setCookingNotes('');
    setCheckedIds([]);
    clearCookingSession(user?.uid);
    setFinished(false);
    stopTimer();
    ttsService.stop();
    setSelectedDish(dishName);
    firstStepSpokenRef.current = false;
    setTimerOwnerIndex(null);

    setPrefilledData({ dishName, servings, notes });

    const generation = generationRef.current;
    fetchRecipeSteps(dishName, servings, notes, language, userPreferences).then(recipe => {
      if (generation === generationRef.current && !user?.uid && recipe) setCookingNotes(readLocalCookingNotes({ dishName, ingredients: recipe.ingredients }) || '');
    }).catch(() => {
      toast.error("Unable to generate recipe steps. Tap 'Try Again' to retry.");
    });
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
    } catch (error) {
      console.error("Failed to update diet preference:", error.message);
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
      } catch (error) {
        console.error("Failed to update diet preference:", error.message);
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
    cookingNotes,
  } : null;

  useEffect(() => {
    const session = readCookingSession(user?.uid);
    if (session?.path === '/assistant' && (!searchParams.get('dish') || session.search === searchParams.toString())) {
      firstStepSpokenRef.current = true;
      recipeSavedRef.current = Boolean(session.savedRecipeId);
      setSavedRecipeId(session.savedRecipeId || null);
      setCookingNotes((!user?.uid ? readLocalCookingNotes(session.recipe) : null) ?? session.recipe.cookingNotes ?? '');
      setCheckedIds(session.checkedIds || []);
      setSelectedDish(session.recipe.dishName);
      setLanguage(session.recipe.language || preferredLanguage);
      setPrefilledData({ dishName: session.recipe.dishName, servings: session.recipe.people || 2, notes: session.recipe.notes || '' });
      restoreRecipe(session.recipe, session.currentStepIndex);
      restoreTimer(session.deadline);
      setTimerOwnerIndex(session.timerOwnerIndex);
    }
    setStateRestored(true);
    // Restore once when this page opens; later profile changes must not reset cooking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stateRestored || finished || isLoading || recipeError || !selectedDish || !steps.length) return;
    writeCookingSession(user?.uid, {
      path: '/assistant', search: searchParams.toString(), recipeSaved: recipeSavedRef.current, savedRecipeId, checkedIds,
      recipe: { dishName: selectedDish, language, people: prefilledData?.servings || 2, notes: prefilledData?.notes || '', ingredients, recipeSteps: steps, nutritionInfo, cookingNotes },
      currentStepIndex, deadline, timerOwnerIndex,
    });
  }, [stateRestored, finished, isLoading, recipeError, user?.uid, selectedDish, language, prefilledData, ingredients, steps, nutritionInfo, currentStepIndex, deadline, timerOwnerIndex, savedRecipeId, checkedIds, cookingNotes, searchParams]);

  const finishCooking = () => {
    clearCookingSession(user?.uid);
    setFinished(true);
    stopTimer();
    ttsService.stop();
    toast.success('Cooking finished. Your recipe is still available below.');
  };

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
      <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/60 dark:from-amber-900/20 via-[#FDFCFB] dark:via-zinc-950 to-[#FDFCFB] dark:to-zinc-950 selection:bg-amber-100 selection:text-amber-900 dark:selection:bg-amber-900/30 dark:selection:text-amber-100 font-sans transition-colors duration-300 py-10 px-4 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-100 tracking-tight text-center">
          ChefSpeak Assistant
        </h1>

        <RecipeForm 
          onSubmit={handleFormSubmit} 
          isLoading={isLoading}
          initialData={prefilledData}
        />

        {/* Nutrition Info - separate */}
        {(ingredientsComplete || isLoadingNutrition) && <NutritionInfo nutritionInfo={nutritionInfo} isLoading={isLoadingNutrition} />}
        
        {/* Ingredients Info - separate */}
        {(ingredientsComplete || isLoadingIngredients) && <IngredientsInfo ingredients={ingredients} isLoading={isLoadingIngredients} checkedIds={checkedIds} onToggle={id => setCheckedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])} />}
        
        {/* Favorite button */}
        {currentRecipe && !isLoading && !isLoadingNutrition && (
          <div className="w-full max-w-md mb-4">
            <FavoriteButton 
              recipe={currentRecipe}
              className="w-full justify-center"
            />
          </div>
        )}

        {/* Error Display */}
        {recipeError && (
          <div className="w-full max-w-md mb-6 p-4 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400 shadow-sm flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-2 font-semibold text-red-900 dark:text-red-300">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0" />
              <span>Unable to generate recipe</span>
            </div>
            <p className="text-sm text-red-700 leading-relaxed">
              {recipeError.includes("failed:") || recipeError.includes("Failed")
                ? "The recipe service is momentarily unavailable. Please check your connection or try again."
                : recipeError}
            </p>
            {prefilledData && (
              <button
                type="button"
                onClick={() => {
                  const userPreferences = {
                    dietType,
                    allergies,
                    dislikes,
                    skillLevel,
                  };
                  processRecipeRequest(prefilledData, userPreferences);
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Retrying...' : 'Try Again'}</span>
              </button>
            )}
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
                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2">
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
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 rounded-full animate-progress-shimmer" />
              </div>

              {/* Cooking tips */}
              <div className="text-xs text-zinc-500 dark:text-zinc-400 italic text-center max-w-xs animate-fade-in-out">
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
                  ingredients={ingredients}
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
                        stopTimer();
                        setTimerOwnerIndex(null);
                      }}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200"
                    >
                      Stop
                    </button>
                    <button
                      type="button"
                      onClick={addMinute}
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

        {!isLoading && steps.length > 0 && <RecipeNotes notes={cookingNotes} localOnly={!user?.uid} disabled={Boolean(user?.uid) && !savedRecipeId} onSave={async notes => {
          if (user?.uid) await saveCookingNotes(user.uid, 'recentDishes', savedRecipeId, notes);
          else if (!writeLocalCookingNotes(currentRecipe, notes)) throw new Error('Notes could not be stored');
          setCookingNotes(notes);
        }} />}
        {!isLoading && steps.length > 0 && !finished && (
          <button type="button" onClick={finishCooking} className="my-6 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold">Finish cooking</button>
        )}
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
