// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getRecentDishes, UserService } from "../services/userService"; // added UserService
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Mic, Settings } from "lucide-react";

export default function Dashboard() {
  const authCtx = useAuth();
  const currentUser = authCtx.currentUser ?? authCtx.user ?? null;
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLanguage, setUserLanguage] = useState(null); // NEW

  console.log("[Dashboard] render", {
    currentUser,
    ctxCurrentUser: authCtx.currentUser,
    ctxUser: authCtx.user,
  });

  useEffect(() => {
    let mounted = true;
    console.log("[Dashboard] effect start", { currentUser });

    (async () => {
      if (!currentUser) {
        console.warn("[Dashboard] No currentUser; skipping fetch");
        if (mounted) setLoading(false);
        return;
      }
      try {
        console.log("[Dashboard] fetching recent dishes for uid:", currentUser.uid);
        const data = await getRecentDishes(currentUser.uid, { limit: 20 });
        if (mounted) {
          console.log("[Dashboard] fetched items:", data.length);
          setItems(data);
        }
      } catch (err) {
        console.error("[Dashboard] getRecentDishes failed:", err);
      } finally {
        if (mounted) {
          console.log("[Dashboard] effect done, setLoading(false)");
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      console.log("[Dashboard] effect cleanup");
    };
  }, [currentUser]);

  // NEW: fetch language from Firestore, not from auth user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUser) {
        setUserLanguage(null);
        return;
      }
      try {
        console.log("[Dashboard] fetching user language for", currentUser.uid);
        const lang = await UserService.getUserLanguage(currentUser);
        if (!cancelled) {
          console.log("[Dashboard] user language =", lang);
          setUserLanguage(lang);
        }
      } catch (e) {
        console.error("[Dashboard] getUserLanguage failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const handleStartCooking = () => {
    console.log("[Dashboard] Start Cooking clicked");
    navigate("/assistant");
  };

  if (!currentUser) {
    console.log("[Dashboard] no user -> showing login prompt");
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Log in to see your recent dishes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {currentUser?.email?.split("@")[0] || "Chef"}
          </h1>
          <button
            onClick={() => {
              console.log("[Dashboard] settings clicked");
              navigate("/settings");
            }}
            className="text-gray-600 hover:text-black"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        <Card className="mb-6">
          <CardContent className="py-6 px-4">
            <p className="text-gray-700 mb-2">Preferred Language:</p>
            <p className="text-lg font-semibold text-blue-600">
              {userLanguage || "Not set"} {/* changed */}
            </p>
          </CardContent>
        </Card>

        <Button
          onClick={handleStartCooking}
          className="w-full flex gap-2 items-center justify-center text-lg py-6"
        >
          <Mic className="w-5 h-5" />
          Start Cooking
        </Button>
      </div>

      <div className="p-6 space-y-6 w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>

        <section>
          <h2 className="text-lg font-medium mb-3">Recent dishes</h2>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No recent dishes yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="rounded-2xl overflow-hidden shadow-sm bg-card border hover:shadow-md transition"
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.dishName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => console.warn("[Dashboard] image error for", it.id, e)}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-medium line-clamp-1">{it.dishName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {it.language || "—"} {it.people ? `• ${it.people} ppl` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
