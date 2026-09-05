// src/pages/Help.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import {
  ChefHat,
  Sparkles,
  Volume2,
  Timer,
  Salad,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  HelpCircle,
  Clock,
  Heart,
  Globe,
  Utensils,
} from "lucide-react";

export default function Help() {
  const [openSection, setOpenSection] = useState("getting-started");

  const toggleSection = (sectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const AccordionItem = ({ id, title, icon: Icon, badge, children }) => {
    const isOpen = openSection === id;
    return (
      <div
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          isOpen
            ? "border-amber-300/80 bg-white shadow-md shadow-amber-500/5 ring-1 ring-amber-400/20"
            : "border-zinc-200 bg-white/90 hover:border-zinc-300 backdrop-blur-sm"
        }`}
      >
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                isOpen
                  ? "bg-gradient-to-br from-amber-500 to-fuchsia-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
                {title}
              </h2>
              {badge && (
                <span className="inline-block self-start sm:self-auto text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  {badge}
                </span>
              )}
            </div>
          </div>
          <div className="text-zinc-400 shrink-0 ml-2">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-amber-600" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-2 border-t border-zinc-100 text-zinc-600 text-sm sm:text-base leading-relaxed animate-in fade-in duration-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />

      {/* Decorative ambient background flair */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-amber-200/30 via-rose-200/30 to-fuchsia-200/30 blur-3xl" />
      </div>

      <main className="min-h-screen pb-16">
        <div className="mx-auto max-w-4xl px-4 pt-10 space-y-10">
          {/* Hero Header */}
          <section className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-fuchsia-500/10 text-amber-700 border border-amber-300/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Voice-Guided Cooking Guide</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900">
              How{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600">
                ChefSpeak
              </span>{" "}
              Works
            </h1>

            <p className="text-zinc-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Step-by-step voice guidance, automatic timers, and personalized recipes so you can cook effortlessly without touching your phone with messy kitchen hands.
            </p>
          </section>

          {/* 3-Step Overview Cards */}
          <section className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white/90 backdrop-blur shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h3 className="font-semibold text-zinc-900 text-base">
                  Pick Any Dish
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600">
                  Type any recipe name or list whatever ingredients you have in your fridge.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200 bg-white/90 backdrop-blur shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h3 className="font-semibold text-zinc-900 text-base">
                  Listen Hands-Free
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600">
                  ChefSpeak speaks each step aloud so your screen stays clean while you prep and cook.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200 bg-white/90 backdrop-blur shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-fuchsia-100 text-fuchsia-700 font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h3 className="font-semibold text-zinc-900 text-base">
                  Use Smart Timers
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600">
                  One-tap timers automatically detect cooking times and sound an alert when ready.
                </p>
              </div>
            </div>
          </section>

          {/* Accordion Detail Sections */}
          <section className="space-y-4">
            {/* Section 1: Hands-Free Voice Guidance */}
            <AccordionItem
              id="getting-started"
              title="Hands-Free Voice Guidance"
              icon={Volume2}
              badge="Core Feature"
            >
              <div className="space-y-4">
                <p>
                  Cooking with messy, oily, or flour-covered hands makes touching screens difficult. ChefSpeak was designed specifically to guide you vocally from start to finish.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                    <div className="font-semibold text-zinc-900 text-sm flex items-center gap-2 mb-1">
                      <Play className="w-4 h-4 text-emerald-600" />
                      <span>Automatic Step Reading</span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      As you proceed to each step, ChefSpeak immediately narrates instructions with clear pacing.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                    <div className="font-semibold text-zinc-900 text-sm flex items-center gap-2 mb-1">
                      <RotateCcw className="w-4 h-4 text-blue-600" />
                      <span>Repeat on Demand</span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      Kitchen noisy from sizzling pans? Tap "Repeat" at any moment to hear the step again.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                    <div className="font-semibold text-zinc-900 text-sm flex items-center gap-2 mb-1">
                      <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                      <span>Adjustable Voice Speed</span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      Control narration speed (0.75x, 1x, 1.25x, 1.5x) to match your preferred cooking tempo.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                    <div className="font-semibold text-zinc-900 text-sm flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-fuchsia-600" />
                      <span>Multiple Languages</span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      Cook in English, Hindi, Spanish, French, Italian, and more directly from the language selector.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionItem>

            {/* Section 2: Integrated Step Timers */}
            <AccordionItem
              id="timers"
              title="Integrated Step Timers"
              icon={Timer}
              badge="Smart Extraction"
            >
              <div className="space-y-4">
                <p>
                  Never overboil pasta or burn caramel again. ChefSpeak automatically parses your recipe instructions for cooking durations and attaches a 1-tap timer button directly to the step.
                </p>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                  <h4 className="font-semibold text-amber-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700" />
                    How Timers Work:
                  </h4>
                  <ul className="text-xs sm:text-sm text-amber-800 space-y-1.5 list-disc list-inside">
                    <li>
                      When a step mentions a time (e.g. <em>"Simmer gently for 12 minutes"</em>), a <strong>"Start 12m Timer"</strong> button appears directly on that step card.
                    </li>
                    <li>
                      A clean floating countdown timer keeps track of remaining minutes and seconds.
                    </li>
                    <li>
                      When the countdown reaches zero, ChefSpeak rings an audible chime alert so you know it's time for the next step.
                    </li>
                  </ul>
                </div>
              </div>
            </AccordionItem>

            {/* Section 3: Cook with Ingredients (Pantry Mode) */}
            <AccordionItem
              id="pantry"
              title="Cook with What You Have (Pantry Mode)"
              icon={Salad}
              badge="Zero Waste"
            >
              <div className="space-y-4">
                <p>
                  Don't know what to make tonight? Use the <strong>"Cook with Ingredients"</strong> feature to turn random pantry and fridge leftovers into a delicious meal.
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-zinc-900 text-sm">Add Ingredients</p>
                      <p className="text-xs text-zinc-600">
                        Type items like <em>"eggs, tomato, spinach, cheese"</em> or tap the Quick-Add chips.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-zinc-900 text-sm">Get 5 AI Suggestions</p>
                      <p className="text-xs text-zinc-600">
                        ChefSpeak formulates 5 tailored dish ideas that maximize your available ingredients.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-fuchsia-500 text-white font-bold text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-zinc-900 text-sm">One-Tap Cooking</p>
                      <p className="text-xs text-zinc-600">
                        Tap any suggestion card to jump immediately into the voice-narrated assistant with pre-filled ingredients.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionItem>

            {/* Section 4: Dietary Protection & Custom Preferences */}
            <AccordionItem
              id="dietary"
              title="Dietary Safeguards & Preferences"
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                <p>
                  ChefSpeak adapts every recipe to your lifestyle and dietary restrictions:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                    <h4 className="font-semibold text-emerald-900 text-sm mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Diet Types
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Configure your diet as Vegetarian, Vegan, Eggetarian, or Non-Vegetarian.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                    <h4 className="font-semibold text-amber-900 text-sm mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      Non-Veg Protection
                    </h4>
                    <p className="text-xs text-amber-800">
                      If you're vegetarian and search for a dish like "Butter Chicken", ChefSpeak warns you and suggests vegetarian alternatives (Paneer, Tofu, Soya) before starting.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/70">
                    <h4 className="font-semibold text-rose-900 text-sm mb-1 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600" />
                      Allergies & Dislikes
                    </h4>
                    <p className="text-xs text-rose-800">
                      Exclude peanuts, dairy, gluten, cilantro, or anything else you prefer to avoid.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/70">
                    <h4 className="font-semibold text-purple-900 text-sm mb-1 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-purple-600" />
                      Skill Level Calibration
                    </h4>
                    <p className="text-xs text-purple-800">
                      Beginner, Intermediate, or Advanced — instructions adjust in granularity based on your culinary confidence.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionItem>

            {/* Section 5: Frequently Asked Questions */}
            <AccordionItem
              id="faq"
              title="Frequently Asked Questions"
              icon={HelpCircle}
            >
              <div className="space-y-4 divide-y divide-zinc-100">
                <div className="pt-2 first:pt-0 space-y-1">
                  <h4 className="font-semibold text-zinc-900 text-sm">
                    Do I need to sign up to use ChefSpeak?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    No! You can use the Assistant and Pantry features immediately as a guest. Creating a free account lets you save favorite dishes, view your recent cook history, and persist dietary preferences across devices.
                  </p>
                </div>

                <div className="pt-3 space-y-1">
                  <h4 className="font-semibold text-zinc-900 text-sm">
                    What if voice narration doesn't play?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    Make sure your device's audio volume is turned up and silent mode is toggled off. If a network interruption occurs, a toast notification will appear and tapping "Repeat" will re-fetch the audio.
                  </p>
                </div>

                <div className="pt-3 space-y-1">
                  <h4 className="font-semibold text-zinc-900 text-sm">
                    How do I scale serving portions?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    On the Assistant recipe form, enter the number of servings (e.g. 2, 4, or 8 people). ChefSpeak recalculates ingredient quantities and cooking times accordingly.
                  </p>
                </div>

                <div className="pt-3 space-y-1">
                  <h4 className="font-semibold text-zinc-900 text-sm">
                    Can I ask for custom variations like "spicier" or "low oil"?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    Yes. Use the "Special Notes" field in the form to request modifications like <em>"extra spicy"</em>, <em>"no sugar"</em>, or <em>"air fryer instructions"</em>.
                  </p>
                </div>
              </div>
            </AccordionItem>
          </section>

          {/* Bottom Call to Action Card */}
          <section className="p-8 sm:p-10 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-fuchsia-500/10 text-center relative overflow-hidden shadow-sm">
            <div className="relative max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-fuchsia-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-fuchsia-500/20">
                <ChefHat className="w-8 h-8" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Ready to start cooking?
              </h3>

              <p className="text-zinc-600 text-sm sm:text-base">
                Jump into the kitchen and let ChefSpeak handle the guidance and timing.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/assistant"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white font-semibold shadow-md hover:shadow-lg hover:brightness-105 active:translate-y-px transition text-sm cursor-pointer"
                >
                  <span>Start Cooking</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/ingredients"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 font-semibold shadow-xs hover:bg-zinc-50 active:translate-y-px transition text-sm cursor-pointer"
                >
                  <Salad className="w-4 h-4 text-emerald-600" />
                  <span>Cook with Ingredients</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
