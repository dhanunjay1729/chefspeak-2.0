import ReactGA from "react-ga4";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export class AnalyticsService {
  static initialized = false;

  static initialize() {
    if (!MEASUREMENT_ID) {
      console.warn("Google Analytics Measurement ID not found");
      return;
    }

    if (!this.initialized) {
      ReactGA.initialize(MEASUREMENT_ID);
      this.initialized = true;
      console.log("✅ Google Analytics initialized");
    }
  }

  static trackPageView(path) {
    if (!this.initialized) return;
    ReactGA.send({ hitType: "pageview", page: path });
  }

  static trackEvent(category, action, label = "", value = 0) {
    if (!this.initialized) return;
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }

  // Custom events for ChefSpeak
  static trackRecipeGenerated(dishName, language) {
    this.trackEvent("Recipe", "Generated", `${dishName} (${language})`);
  }

  static trackRecipeFavorited(dishName) {
    this.trackEvent("Recipe", "Favorited", dishName);
  }

  static trackRecipeUnfavorited(dishName) {
    this.trackEvent("Recipe", "Unfavorited", dishName);
  }

  static trackIngredientSearch(ingredients) {
    this.trackEvent("Ingredients", "Search", ingredients.join(", "));
  }

  static trackProfileUpdate(field) {
    this.trackEvent("Profile", "Updated", field);
  }

  static trackTTSUsed(language) {
    this.trackEvent("TTS", "Used", language);
  }

  static trackTimerStarted(stepIndex) {
    this.trackEvent("Timer", "Started", `Step ${stepIndex + 1}`);
  }
}