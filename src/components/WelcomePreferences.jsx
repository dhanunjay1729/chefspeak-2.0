import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Languages, ChefHat, Salad, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const dismissedThisVisit = new Set();
const introRoutes = new Set(['/', '/dashboard', '/assistant', '/ingredients', '/favorites']);
const preferences = [
  { icon: Languages, title: 'Your language', text: 'Choose the language for recipes and voice guidance.' },
  { icon: ChefHat, title: 'Your cooking level', text: 'Get instructions suited to beginner, intermediate, or pro cooks.' },
  { icon: Salad, title: 'Your diet', text: 'Choose vegetarian, vegan, or non-vegetarian recipes.' },
  { icon: SlidersHorizontal, title: 'Allergies & dislikes', text: 'Tell us which ingredients to exclude or avoid.' },
];

function hasDismissed(key) {
  if (dismissedThisVisit.has(key)) return true;
  try { return localStorage.getItem(key) === 'true'; } catch { return false; }
}

export default function WelcomePreferences() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const [visibleKey, setVisibleKey] = useState(null);
  const key = `chefspeak.preferences-intro.v1.${user?.uid || 'guest'}`;
  const eligible = !loading && introRoutes.has(pathname);
  const open = eligible && visibleKey === key;

  useEffect(() => {
    if (!eligible || hasDismissed(key)) return;
    const timeout = setTimeout(() => setVisibleKey(key), 700);
    return () => clearTimeout(timeout);
  }, [eligible, key]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const dismiss = () => {
    dismissedThisVisit.add(key);
    try { localStorage.setItem(key, 'true'); } catch { /* Remember for this visit when storage is unavailable. */ }
    setVisibleKey(null);
  };

  const personalize = () => {
    dismiss();
    navigate(user ? '/profile' : '/signup');
  };

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="preferences-intro-title"
      aria-describedby="preferences-intro-description"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">Welcome to ChefSpeak</p>
            <h2 id="preferences-intro-title" className="text-2xl font-bold tracking-tight">Make it your kitchen.</h2>
          </div>
          <button autoFocus onClick={dismiss} aria-label="Close welcome" className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-fuchsia-600 dark:hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>
        <p id="preferences-intro-description" className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          A few preferences help ChefSpeak tailor your recipes and cooking guidance.
        </p>
        <ul className="my-5 space-y-4">
          {preferences.map(({ icon, title, text }) => {
            const Icon = icon;
            return (
            <li key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"><Icon size={20} aria-hidden="true" /></span>
              <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-0.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p></div>
            </li>
            );
          })}
        </ul>
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{user ? 'You can change these anytime in Menu → Profile.' : 'You can cook as a guest. Create an account to save these preferences in your profile.'} Always check generated recipes against your allergies.</p>
        <div className="mt-5 flex flex-col gap-2">
          <button onClick={personalize} className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-600 px-4 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-600">{user ? 'Personalize my cooking' : 'Create account & personalize'}</button>
          <button onClick={dismiss} className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-fuchsia-600 dark:text-zinc-300 dark:hover:bg-zinc-800">{user ? 'Maybe later' : 'Keep cooking as a guest'}</button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
