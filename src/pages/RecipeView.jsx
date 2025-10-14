// src/pages/RecipeView.jsx
import { useEffect, useRef, useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getDishById } from "../services/userService";
import { TTSService } from "../services/ttsService";
import { useTimer } from "../hooks/useTimer";
import { RecipeStep } from "../components/RecipeStep";
import { NavigationControls } from "../components/NavigationControls";
import { NutritionInfo } from "../components/NutritionInfo";
import { TimerDisplay } from "../components/TimerDisplay";
import Header from "../components/Header";

export default function RecipeView() {
  const { user } = useAuth();
  const { dishId } = useParams();
  const [dish, setDish] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const { remaining, startTimer } = useTimer();
  const ttsService = new TTSService();
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);
  const firstStepSpokenRef = useRef(false);

  useEffect(() => {
    const fetchDish = async () => {
      if (!user?.uid || !dishId) return;
      const data = await getDishById(user.uid, dishId);
      setDish(data || null);
    };
    fetchDish();
  }, [user, dishId]);

  // Speak first step automatically once loaded
  useEffect(() => {
    if (
      dish &&
      dish.recipeSteps &&
      dish.recipeSteps.length > 0 &&
      !firstStepSpokenRef.current
    ) {
      firstStepSpokenRef.current = true;
      ttsService.speak(dish.recipeSteps[0].text, dish.language || "English").catch(() => {});
    }
  }, [dish, ttsService]);

  if (!dish) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          Loading recipe...
        </div>
      </>
    );
  }

  const steps = dish.recipeSteps || [];

  const handleSpeak = (text) => {
    ttsService.speak(text, dish.language || "English").catch(() => {});
  };

  const handleNavigateNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      ttsService.speak(steps[next].text, dish.language || "English").catch(() => {});
    }
  };

  const handleNavigateBack = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      ttsService.speak(steps[prev].text, dish.language || "English").catch(() => {});
    }
  };

  const handleRepeat = () => {
    if (steps[currentStepIndex]) {
      ttsService.speak(steps[currentStepIndex].text, dish.language || "English").catch(() => {});
    }
  };

  const handleStartTimerForStep = (index) => (seconds) => {
    setTimerOwnerIndex(index);
    startTimer(seconds);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">{dish.dishName}</h1>

        <NutritionInfo
          nutritionInfo={dish.nutritionInfo}
          isLoading={false}
        />

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
          hasSteps={steps.length > 0}
        />
      </div>
    </>
  );
}