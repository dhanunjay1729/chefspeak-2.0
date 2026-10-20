import { RecipeNotes } from '../components/RecipeNotes';
import { readCookingSession, writeCookingSession, clearCookingSession } from '../utils/cookingSession';
// src/pages/RecipeView.jsx
import { useEffect, useRef, useState, Fragment } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { TTSService } from "../services/ttsService";
import { getDishById, saveCookingNotes } from "../services/userService";
import { useTimer } from "../hooks/useTimer";
import { RecipeStep } from "../components/RecipeStep";
import { TimerDisplay } from "../components/TimerDisplay";
import { NavigationControls } from "../components/NavigationControls";
import { NutritionInfo } from "../components/NutritionInfo";
import { IngredientsInfo } from "../components/IngredientsInfo"; // ✅ Import
import { FavoriteButton } from "../components/FavoriteButton"; // ✅ Import
import { AudioControls } from "../components/AudioControls";
import Header from "../components/Header"; 
import { useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ChefHat, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalyticsService } from "../services/analyticsService"; // ✅ Import
import { recipeApiService } from "../services/recipeApiService";
import { recipeTextFields, applyRecipeTextTranslations } from "../../shared/recipeTranslation";
import { DEFAULT_LANGUAGE, getLanguage } from "../../shared/languages";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function RecipeView() {
  const { user } = useAuth();
  const { preferredLanguage, loading: profileLoading, error: profileError, refresh: refreshProfile } = useUserProfile();
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("English");
  const [recipe, setRecipe] = useState(null);
  const [displayRecipe, setDisplayRecipe] = useState(null);
  const [translationError, setTranslationError] = useState(false);
  const [translationRetry, setTranslationRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Recipe state
  const [steps, setSteps] = useState([]);
  const [ingredients, setIngredients] = useState([]); // ✅ Add ingredients state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nutritionInfo, setNutritionInfo] = useState(null);

  const { remaining, deadline, startTimer, stopTimer, restoreTimer, addMinute } = useTimer();
  const [finished, setFinished] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  
  // ✅ Create TTS instance ONCE using useRef (persists across re-renders)
  const ttsService = useRef(new TTSService()).current;

  const firstStepSpokenRef = useRef(false);
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);

  // ✅ Add ref to track the active step element
  const activeStepRef = useRef(null);

  // Load recipe from database
  useEffect(() => {
    if (profileLoading) return;
    let active = true;
    setLoading(true);
    setError(null);
    const loadRecipe = async () => {
      if (!user?.uid || !recipeId) {
        setLoading(false);
        return;
      }

      try {
        const recipeData = await getDishById(user.uid, recipeId);
        if (recipeData) {
          let shown = recipeData;
          setTranslationError(false);
          const savedLanguage = getLanguage(recipeData.language)?.code || DEFAULT_LANGUAGE;
          if (!profileError && savedLanguage !== preferredLanguage) {
            try {
              let translated = recipeData.translations?.[preferredLanguage];
              if (!translated) {
                const fields = recipeTextFields(recipeData);
                const text = await recipeApiService.translateRecipe(fields.map(field => field.text), preferredLanguage);
                translated = applyRecipeTextTranslations(recipeData, fields, text, preferredLanguage);
                updateDoc(doc(db, 'users', user.uid, recipeData.recipeCollection, recipeId), {
                  [`translations.${preferredLanguage}`]: translated,
                }).catch(error => console.warn('Could not cache translated recipe:', error));
              }
              shown = { ...recipeData, ...translated, language: preferredLanguage };
            } catch (translationFailure) {
              console.error('Could not translate saved recipe:', translationFailure);
              if (active) setTranslationError(true);
            }
          }
          if (!active) return;
          const session = readCookingSession(user.uid);
          if (session?.path === `/recipe/${recipeId}`) {
            setCurrentStepIndex(session.currentStepIndex);
            setCheckedIds(session.checkedIds || []);
            restoreTimer(session.deadline);
            setTimerOwnerIndex(session.timerOwnerIndex);
            firstStepSpokenRef.current = true;
          }
          setRecipe(recipeData);
          setDisplayRecipe(shown);
          setSteps(shown.recipeSteps || []);
          setIngredients(shown.ingredients || []); // ✅ Load ingredients
          setNutritionInfo(recipeData.nutritionInfo || null);
          setLanguage(shown.language || DEFAULT_LANGUAGE);
        } else {
          if (active) setError("Recipe not found");
        }
      } catch (err) {
        console.error("Failed to load recipe:", err);
        if (active) setError("Failed to load recipe");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRecipe();
    return () => { active = false; };
  }, [user?.uid, recipeId, restoreTimer, preferredLanguage, profileLoading, profileError, translationRetry]);

  useEffect(() => {
    if (loading || !displayRecipe || !steps.length || finished) return;
    writeCookingSession(user?.uid, {
      path: `/recipe/${recipeId}`, recipe: displayRecipe, currentStepIndex, deadline, timerOwnerIndex, checkedIds,
    });
  }, [loading, displayRecipe, steps.length, finished, user?.uid, recipeId, currentStepIndex, deadline, timerOwnerIndex, checkedIds]);

  const finishCooking = () => {
    clearCookingSession(user?.uid);
    setFinished(true);
    stopTimer();
    ttsService.stop();
  };

  // Speak first step when loaded
  useEffect(() => {
    if (!firstStepSpokenRef.current && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, language, ttsService]);

  // Navigation handlers
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      return steps[newIndex];
    }
    return null;
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      return steps[newIndex];
    }
    return null;
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

  // Start a timer and remember which step owns it
  const handleStartTimerForStep = (index) => (seconds) => {
    setTimerOwnerIndex(index);
    startTimer(seconds);
  };

  // ✅ CLEANUP: Stop audio when component unmounts
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [ttsService]);

  // ✅ Auto-scroll to active step when it changes
  useEffect(() => {
    if (activeStepRef.current && steps.length > 0) {
      activeStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Centers the step in the viewport
        inline: 'nearest'
      });
    }
  }, [currentStepIndex, steps.length]);

  // Show sexy loading animation
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/60 dark:from-amber-900/20 via-[#FDFCFB] dark:via-zinc-950 to-[#FDFCFB] dark:to-zinc-950 py-10 px-4 flex flex-col items-center justify-center transition-colors">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-amber-200/60 dark:border-amber-900/30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-8 shadow-2xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden">
              {/* Animated background gradient orbs */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fuchsia-400/20 to-transparent rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-amber-400/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              <div className="relative flex flex-col items-center gap-6">
                {/* Animated cooking pot with steam */}
                <div className="relative">
                  {/* Main chef hat */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-rose-500/50 dark:shadow-rose-900/50">
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
                  <p className="text-xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600 dark:from-amber-400 dark:via-rose-400 dark:to-fuchsia-400 bg-clip-text text-transparent animate-pulse">
                    📖 Loading your recipe...
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Preparing your cooking instructions</span>
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
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-500 italic text-center max-w-xs animate-fade-in-out">
                  💡 Your delicious recipe is almost ready!
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Animations */}
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
        </div>
      </>
    );
  }

  // Show error state
  if (error || !recipe) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 py-10 px-4 flex flex-col items-center justify-center transition-colors">
          <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error || "Recipe not found"}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 shadow-sm transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/60 dark:from-amber-900/20 via-[#FDFCFB] dark:via-zinc-950 to-[#FDFCFB] dark:to-zinc-950 py-10 px-4 flex flex-col items-center transition-colors">
        {/* Header with back button and recipe info */}
        <div className="w-full max-w-md mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl border border-zinc-200/60 dark:border-zinc-800 p-6 mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-3">{displayRecipe?.dishName || recipe.dishName}</h1>
            <div className="flex gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {getLanguage(language)?.name || language}
              </span>
              {recipe.people && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {recipe.people} servings
                </span>
              )}
            </div>
            {recipe.notes && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 italic">
                "{recipe.notes}"
              </p>
            )}
          </div>
          {translationError && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
              This saved recipe could not be shown in {getLanguage(preferredLanguage)?.name}. It is showing its original language.
              <button type="button" onClick={() => setTranslationRetry(value => value + 1)}
                className="ml-2 font-semibold underline">Try again</button>
            </div>
          )}
          {profileError && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
              Your language setting could not be loaded. This recipe is showing its saved language.
              <button type="button" onClick={refreshProfile} className="ml-2 font-semibold underline">Retry</button>
            </div>
          )}
        </div>

        {/* ✅ Nutrition Info - separate */}
        <NutritionInfo nutritionInfo={nutritionInfo} isLoading={false} />
        
        {/* ✅ Ingredients Info - separate */}
        <IngredientsInfo ingredients={ingredients} isLoading={false} checkedIds={checkedIds} onToggle={id => setCheckedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])} />
        
        {/* ✅ Favorite button */}
        {recipe && (
          <div className="w-full max-w-md mb-6">
            <FavoriteButton 
              recipe={recipe}
              className="w-full justify-center"
            />
          </div>
        )}

        {/* Recipe Steps */}
        <div className="space-y-4 w-full max-w-md pb-24">
          {steps.map((step, index) => (
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
                <div className="pl-4">
                  <TimerDisplay remaining={remaining} />
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        stopTimer();
                        setTimerOwnerIndex(null);
                      }}
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold
                                 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 active:bg-red-200 transition-colors shadow-sm"
                    >
                      Stop
                    </button>
                    <button
                      type="button"
                      onClick={addMinute}
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold
                                 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 active:bg-amber-200 transition-colors shadow-sm"
                    >
                      +1 min
                    </button>
                  </div>
                </div>
              )}
            </Fragment>
          ))}

          {steps.length === 0 && (
            <div className="text-center text-zinc-500 dark:text-zinc-400 py-10 font-medium">
              No recipe steps found.
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <RecipeNotes notes={recipe.cookingNotes || ''} onSave={async notes => {
          await saveCookingNotes(user.uid, recipe.recipeCollection, recipeId, notes);
          setRecipe(current => ({ ...current, cookingNotes: notes }));
        }} />
        {!finished && <button type="button" onClick={finishCooking} className="my-6 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold">Finish cooking</button>}
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
