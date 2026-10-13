const key = (uid) => `chefspeak.cooking.${uid || 'guest'}`;

export function secondsUntil(deadline, now = Date.now()) {
  return Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}

export function readCookingSession(uid, storage = localStorage) {
  try {
    const session = JSON.parse(storage.getItem(key(uid)));
    if (session?.version !== 1 || !session.recipe?.dishName || !Array.isArray(session.recipe.recipeSteps) || !session.recipe.recipeSteps.length) return null;
    if (!session.recipe.recipeSteps.every(step => typeof step.text === 'string')) return null;
    if (!(session.path === '/assistant' || /^\/recipe\/[^/]+$/.test(session.path))) return null;
    return {
      ...session,
      currentStepIndex: Math.max(0, Math.min(Number.isInteger(session.currentStepIndex) ? session.currentStepIndex : 0, session.recipe.recipeSteps.length - 1)),
      deadline: Number.isFinite(session.deadline) ? session.deadline : null,
      timerOwnerIndex: Number.isInteger(session.timerOwnerIndex) && session.timerOwnerIndex >= 0 && session.timerOwnerIndex < session.recipe.recipeSteps.length ? session.timerOwnerIndex : null,
    };
  } catch {
    return null;
  }
}

export function writeCookingSession(uid, session, storage = localStorage) {
  try {
    storage.setItem(key(uid), JSON.stringify({ ...session, version: 1 }));
    return true;
  } catch {
    return false;
  }
}

export function clearCookingSession(uid, storage = localStorage) {
  try { storage.removeItem(key(uid)); } catch { /* Storage may be disabled. */ }
}
