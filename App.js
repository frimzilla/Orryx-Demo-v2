import React, { useEffect, useMemo, useRef, useState } from "react";

// Orryx UI Lab – Food•Mood Demo (v0.1)
// Single-file React component with an in-memory restaurant DB, Food→Mood logic,
// Random / Food-Mood / Find It flows, fake order + post-meal rating chip sheet,
// and a ranking algorithm that prioritizes: new-to-user best match first,
// then most-loved familiar, alternating loved / new until loved runs out.
// Tailwind CSS only for styling (no external UI libs required).

// ————— Types & Constants —————
const MOODS = ["Joy", "Calm", "Energized", "Warm", "Upset"] as const;
type Mood = typeof MOODS[number];

const TAGS = [
  "steak",
  "sushi",
  "pizza",
  "salad",
  "ramen",
  "tacos",
  "bbq",
  "vegan",
  "burger",
  "coffee",
  "noodles",
  "pho",
  "seafood",
  "curry",
  "shawarma",
];

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  tags: string[]; // for predictive search & filter chips
  moodScores: Record<Mood, number>; // base association 0–1
  price: "$" | "$$" | "$$$" | "$$$$";
  location: string;
  img?: string; // optional placeholder image
};

type UserPrefs = {
  favorites: Set<string>;
  // per-mood per-restaurant affinity learned from ratings
  affinity: Record<Mood, Record<string, number>>; // mood->restId->score
  // per-restaurant rating counts by mood (for “loved” detection)
  counts: Record<Mood, Record<string, number>>;
  // restaurants the user has interacted with (ordered or rated)
  seen: Set<string>;
};

// Simple seeded DB (15 restaurants). Each mood will still surface a Top-5.
const DB: Restaurant[] = [
  {
    id: "r_steakhouse_prime",
    name: "Prime Forge Steakhouse",
    cuisine: "Steakhouse",
    tags: ["steak", "bbq", "wine"],
    moodScores: { Joy: 0.92, Calm: 0.38, Energized: 0.55, Warm: 0.88, Upset: 0.40 },
    price: "$$$$",
    location: "Downtown",
  },
  {
    id: "r_bbq_smoke",
    name: "Smokestack & Ember BBQ",
    cuisine: "BBQ",
    tags: ["bbq", "steak", "ribs"],
    moodScores: { Joy: 0.84, Calm: 0.32, Energized: 0.71, Warm: 0.86, Upset: 0.44 },
    price: "$$$",
    location: "Riverside",
  },
  {
    id: "r_sushi_kumo",
    name: "Kumo Sushi Bar",
    cuisine: "Sushi",
    tags: ["sushi", "seafood"],
    moodScores: { Joy: 0.80, Calm: 0.78, Energized: 0.49, Warm: 0.36, Upset: 0.40 },
    price: "$$$",
    location: "Midtown",
  },
  {
    id: "r_pizza_nebula",
    name: "Nebula Pizza Lab",
    cuisine: "Pizza",
    tags: ["pizza", "salad"],
    moodScores: { Joy: 0.86, Calm: 0.35, Energized: 0.64, Warm: 0.70, Upset: 0.33 },
    price: "$$",
    location: "Uptown",
  },
  {
    id: "r_ramen_tsuki",
    name: "Tsuki Ramen",
    cuisine: "Ramen",
    tags: ["ramen", "noodles"],
    moodScores: { Joy: 0.72, Calm: 0.40, Energized: 0.58, Warm: 0.92, Upset: 0.41 },
    price: "$$",
    location: "Downtown",
  },
  {
    id: "r_tacos_cielo",
    name: "Cielo Taquería",
    cuisine: "Mexican",
    tags: ["tacos", "curry"],
    moodScores: { Joy: 0.77, Calm: 0.30, Energized: 0.86, Warm: 0.62, Upset: 0.45 },
    price: "$$",
    location: "Market District",
  },
  {
    id: "r_salad_blossom",
    name: "Blossom Greens",
    cuisine: "Salads & Bowls",
    tags: ["salad", "vegan"],
    moodScores: { Joy: 0.66, Calm: 0.82, Energized: 0.48, Warm: 0.52, Upset: 0.43 },
    price: "$$",
    location: "Arts Quarter",
  },
  {
    id: "r_burger_aster",
    name: "Aster Burger Co.",
    cuisine: "Burgers",
    tags: ["burger", "steak"],
    moodScores: { Joy: 0.81, Calm: 0.34, Energized: 0.83, Warm: 0.68, Upset: 0.40 },
    price: "$$",
    location: "Stadium Row",
  },
  {
    id: "r_pho_sunrise",
    name: "Sunrise Pho House",
    cuisine: "Vietnamese",
    tags: ["pho", "noodles"],
    moodScores: { Joy: 0.70, Calm: 0.60, Energized: 0.50, Warm: 0.90, Upset: 0.55 },
    price: "$",
    location: "Little Asia",
  },
  {
    id: "r_curry_mirror",
    name: "Mirror Spice Curry",
    cuisine: "Indian",
    tags: ["curry", "vegan"],
    moodScores: { Joy: 0.74, Calm: 0.42, Energized: 0.78, Warm: 0.74, Upset: 0.47 },
    price: "$$",
    location: "Grand Ave",
  },
  {
    id: "r_shawarma_orbit",
    name: "Orbit Shawarma",
    cuisine: "Middle Eastern",
    tags: ["shawarma", "salad"],
    moodScores: { Joy: 0.69, Calm: 0.58, Energized: 0.63, Warm: 0.82, Upset: 0.46 },
    price: "$",
    location: "Bazaar Street",
  },
  {
    id: "r_seafood_tide",
    name: "High Tide Oyster & Fish",
    cuisine: "Seafood",
    tags: ["seafood", "sushi"],
    moodScores: { Joy: 0.75, Calm: 0.76, Energized: 0.54, Warm: 0.50, Upset: 0.38 },
    price: "$$$",
    location: "Harbor",
  },
  {
    id: "r_bbq_backyard",
    name: "Backyard Smoke Pit",
    cuisine: "BBQ",
    tags: ["bbq", "ribs"],
    moodScores: { Joy: 0.78, Calm: 0.28, Energized: 0.79, Warm: 0.84, Upset: 0.49 },
    price: "$$",
    location: "Warehouse Row",
  },
  {
    id: "r_cafe_zenith",
    name: "Cafe Zenith",
    cuisine: "Coffee & Light Bites",
    tags: ["coffee", "salad"],
    moodScores: { Joy: 0.63, Calm: 0.88, Energized: 0.57, Warm: 0.48, Upset: 0.35 },
    price: "$",
    location: "Campus",
  },
  {
    id: "r_noodle_meteor",
    name: "Meteor Noodle Works",
    cuisine: "Pan-Asian Noodles",
    tags: ["noodles", "ramen", "pho"],
    moodScores: { Joy: 0.71, Calm: 0.55, Energized: 0.69, Warm: 0.80, Upset: 0.43 },
    price: "$$",
    location: "The Crossings",
  },
];

const DEFAULT_USER: UserPrefs = {
  favorites: new Set<string>(),
  affinity: Object.fromEntries(MOODS.map((m) => [m, {}])) as any,
  counts: Object.fromEntries(MOODS.map((m) => [m, {}])) as any,
  seen: new Set<string>(),
};

// ————— Helpers —————
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const toPct = (x: number) => `${Math.round(x * 100)}%`;

function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      // revive sets
      if (parsed.favorites) parsed.favorites = new Set(parsed.favorites);
      if (parsed.seen) parsed.seen = new Set(parsed.seen);
      return parsed;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    const replacer = (_k: string, v: any) => {
      if (v instanceof Set) return Array.from(v);
      return v;
    };
    localStorage.setItem(key, JSON.stringify(val, replacer));
  }, [key, val]);
  return [val, setVal] as const;
}

function scoreForMood(r: Restaurant, mood: Mood, user: UserPrefs) {
  const base = r.moodScores[mood];
  const a = user.affinity[mood][r.id] ?? 0; // learned boost 0–1
  // Weighted blend: prioritize learned signal but never ignore base
  return clamp01(0.6 * base + 0.6 * a); // can exceed 1 before clamp
}

function isLoved(rid: string, mood: Mood, user: UserPrefs) {
  const c = user.counts[mood][rid] ?? 0;
  const a = user.affinity[mood][rid] ?? 0;
  return c >= 2 && a >= 0.6; // simple heuristic for “loved”
}

function updateAffinity(
  user: UserPrefs,
  rid: string,
  moodRated: Mood,
  amount = 0.25 // EMA step
): UserPrefs {
  const next: UserPrefs = {
    favorites: new Set(user.favorites),
    seen: new Set(user.seen).add(rid),
    affinity: JSON.parse(JSON.stringify(user.affinity)),
    counts: JSON.parse(JSON.stringify(user.counts)),
  };
  const prev = next.affinity[moodRated][rid] ?? 0.5; // start neutral
  const ema = clamp01(prev * (1 - amount) + 1 * amount);
  next.affinity[moodRated][rid] = ema;
  next.counts[moodRated][rid] = (next.counts[moodRated][rid] ?? 0) + 1;
  return next;
}

function allSeenForMood(user: UserPrefs, mood: Mood) {
  const ratedIds = new Set(
    Object.keys(user.affinity[mood]).filter((rid) => user.counts[mood][rid] > 0)
  );
  return ratedIds;
}

function rankForMood(
  restaurants: Restaurant[],
  mood: Mood,
  user: UserPrefs,
  limit = 12
) {
  // Sort by overall score first
  const withScores = restaurants
    .map((r) => ({ r, s: scoreForMood(r, mood, user) }))
    .sort((a, b) => b.s - a.s);

  const seenIds = allSeenForMood(user, mood);
  const loved = withScores.filter(({ r }) => isLoved(r.id, mood, user)).map(({ r, s }) => ({ r, s }));
  const newToUser = withScores.filter(({ r }) => !seenIds.has(r.id)).map(({ r, s }) => ({ r, s }));
  const seenNotLoved = withScores
    .filter(({ r }) => seenIds.has(r.id) && !isLoved(r.id, mood, user))
    .map(({ r, s }) => ({ r, s }));

  // Build alternating sequence: best new, best loved, then repeat; then 
  // remaining new, then seen-not-loved.
  const out: { r: Restaurant; s: number }[] = [];
  let iNew = 0,
    iLoved = 0;
  while (out.length < limit && (iNew < newToUser.length || iLoved < loved.length)) {
    if (iNew < newToUser.length) out.push(newToUser[iNew++]);
    if (out.length >= limit) break;
    if (iLoved < loved.length) out.push(loved[iLoved++]);
  }
  for (; out.length < limit && iNew < newToUser.length; iNew++) out.push(newToUser[iNew]);
  for (let i = 0; out.length < limit && i < seenNotLoved.length; i++) out.push(seenNotLoved[i]);

  return out;
}

// Predictive suggestions for the search bar
function getSuggestions(query: string) {
  const q = query.toLowerCase();
  if (!q) return [] as string[];
  const pool = Array.from(new Set([...TAGS, ...DB.flatMap((r) => [r.name, r.cuisine, ...r.tags])])).map((s) => s.toLowerCase());
  return pool.filter((s) => s.includes(q)).slice(0, 6);
}

// Share (best-effort)
async function tryShare(text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title: "Orryx", text });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    alert("Link copied to clipboard");
    return true;
  } catch {
    return false;
  }
}

// ————— Component —————
export default function App() {
  const [user, setUser] = useLocalStorage<UserPrefs>("orryx_user_prefs_v01", DEFAULT_USER);

  const [tab, setTab] = useState<"random" | "foodmood" | "findit">("random");
  const [currentMood, setCurrentMood] = useState<Mood>("Joy");
  const [desiredMood, setDesiredMood] = useState<Mood>("Joy");
  const [reroll, setReroll] = useState<number>(0);

  const [search, setSearch] = useState("");
  const [searchTag, setSearchTag] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState<null | "rate" | "chooseMood">(null);

  const [activeOrderRid, setActiveOrderRid] = useState<string | null>(null);

  // dynamic ranking target mood for Random page
  const targetMoodRandom = reroll % 2 === 0 ? currentMood : desiredMood;

  const rankedRandom = useMemo(() => rankForMood(DB, targetMoodRandom, user, 8), [user, targetMoodRandom]);
  const rankedFoodMood = useMemo(() => rankForMood(DB, desiredMood, user, 8), [user, desiredMood]);

  const filteredFind = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tag = searchTag?.toLowerCase();
    const base = DB.filter((r) => {
      const hay = [r.name, r.cuisine, ...r.tags].join("| ").toLowerCase();
      const tagHit = tag ? r.tags.map((t) => t.toLowerCase()).includes(tag) : true;
      return (!q || hay.includes(q)) && tagHit;
    });
    // sort by blended best across moods (favor Joy by default)
    const withS = base.map((r) => {
      const sAvg = MOODS.reduce((acc, m) => acc + scoreForMood(r, m, user), 0) / MOODS.length;
      const sJoy = scoreForMood(r, "Joy", user);
      return { r, s: 0.6 * sJoy + 0.4 * sAvg };
    });
    return withS.sort((a, b) => b.s - a.s).slice(0, 12);
  }, [search, searchTag, user]);

  // UX helpers
  const onPlaceOrder = (rid: string) => {
    setActiveOrderRid(rid);
  };

  const onDidEat = () => setShowSheet("rate");

  const onSubmitRating = (mood: Mood) => {
    if (!activeOrderRid) return;
    const next = updateAffinity(user, activeOrderRid, mood, 0.3);
    setUser(next);
    setShowSheet(null);
    setActiveOrderRid(null);
  };

  const toggleFavorite = (rid: string) => {
    const next = { ...user, favorites: new Set(user.favorites), seen: new Set(user.seen) };
    if (next.favorites.has(rid)) next.favorites.delete(rid);
    else next.favorites.add(rid);
    setUser(next);
  };

  const predictive = getSuggestions(search);

  // Themes (3 archetypes)
  const [theme, setTheme] = useLocalStorage("orryx_theme_v01", "engineer");
  const themeClass =
    theme === "engineer"
      ? "from-slate-900 via-slate-800 to-slate-900 text-slate-100"
      : theme === "soldier"
      ? "from-emerald-900 via-emerald-800 to-emerald-900 text-emerald-50"
      : "from-indigo-900 via-purple-900 to-indigo-900 text-indigo-50"; // dreamer

  return (
    <div className={`min-h-screen w-full bg-gradient-to-b ${themeClass} pb-28`}>
      <Header theme={theme} setTheme={setTheme as any} />

      {/* Tab Switcher */}
      <div className="mx-auto mt-4 flex w-full max-w-5xl items-center justify-center gap-2 px-4">
        <Tab label="Random" active={tab === "random"} onClick={() => setTab("random")} />
        <Tab label="Food‑Mood" active={tab === "foodmood"} onClick={() => setTab("foodmood")} />
        <Tab label="Find It" active={tab === "findit"} onClick={() => setTab("findit")} />
      </div>

      {tab === "random" && (
        <section className="mx-auto mt-6 w-full max-w-5xl px-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <MoodPill label="Your Mood" value={currentMood} onPick={() => setShowSheet("chooseMood")} />
            <MoodPill label="Desired Mood (on re‑roll)" value={desiredMood} onPick={() => setShowSheet("chooseMood")} />
            <button
              onClick={() => setReroll((n) => n + 1)}
              className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold shadow hover:bg-white/10"
            >
              Re‑roll (now matching: <span className="underline">{targetMoodRandom}</span>)
            </button>
            <p className="text-xs opacity-80">
              Rule: first match current mood; on first re‑roll, match desired mood instead.
            </p>
          </div>
          <CardGrid
            items={rankedRandom}
            user={user}
            onFav={toggleFavorite}
            onShare={(r) => tryShare(`${r.name} — ${r.cuisine} @ ${r.location}`)}
            onOrder={(rid) => onPlaceOrder(rid)}
          />

          {activeOrderRid && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={onDidEat}
                className="rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-black shadow hover:bg-white"
              >
                Did you eat?
              </button>
              <span className="text-sm opacity-80">Tap after your meal to rate how it made you feel.</span>
            </div>
          )}
        </section>
      )}

      {tab === "foodmood" && (
        <section className="mx-auto mt-6 w-full max-w-5xl px-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <MoodPill label="I want to feel" value={desiredMood} onPick={() => setShowSheet("chooseMood")} />
            <span className="text-xs opacity-80">Top picks prioritize new-to-you first, then your loved spots (alternating).</span>
          </div>
          <CardGrid
            items={rankedFoodMood}
            user={user}
            onFav={toggleFavorite}
            onShare={(r) => tryShare(`${r.name} — ${r.cuisine} @ ${r.location}`)}
            onOrder={(rid) => onPlaceOrder(rid)}
          />

          {activeOrderRid && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={onDidEat}
                className="rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-black shadow hover:bg-white"
              >
                Did you eat?
              </button>
              <span className="text-sm opacity-80">After eating, report your mood to personalize future results.</span>
            </div>
          )}
        </section>
      )}

      {tab === "findit" && (
        <section className="mx-auto mt-6 w-full max-w-5xl px-4">
          <div className="mb-3">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a food, place, or tag (try ‘steak’, ‘sushi’, ‘ramen’)…"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur placeholder-white/60 focus:outline-none"
              />
              {search && predictive.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/20 bg-black/80 backdrop-blur">
                  {predictive.map((s) => (
                    <button
                      key={s}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-white/10"
                      onClick={() => setSearch(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setSearchTag(searchTag === t ? null : t)}
                className={`rounded-2xl border px-3 py-1 text-xs ${
                  searchTag === t ? "border-white bg-white text-black" : "border-white/20 hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
            {searchTag && (
              <button onClick={() => setSearchTag(null)} className="rounded-2xl border border-white/30 px-3 py-1 text-xs opacity-80">
                clear tag
              </button>
            )}
          </div>

          <CardGrid
            items={filteredFind}
            user={user}
            onFav={toggleFavorite}
            onShare={(r) => tryShare(`${r.name} — ${r.cuisine} @ ${r.location}`)}
            onOrder={(rid) => onPlaceOrder(rid)}
          />

          {activeOrderRid && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={onDidEat}
                className="rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-black shadow hover:bg-white"
              >
                Did you eat?
              </button>
              <span className="text-sm opacity-80">Tap to record how the meal made you feel.</span>
            </div>
          )}
        </section>
      )}

      {/* Bottom Sheets */}
      {showSheet === "chooseMood" && (
        <Sheet onClose={() => setShowSheet(null)} title="Pick a mood">
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setDesiredMood(m);
                  setCurrentMood(m);
                  setShowSheet(null);
                }}
                className="rounded-2xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
              >
                {m}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {showSheet === "rate" && (
        <Sheet onClose={() => setShowSheet(null)} title="How did your meal make you feel?">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => onSubmitRating(m)}
                className="rounded-2xl border border-white/20 px-3 py-3 text-sm font-semibold hover:bg-white/10"
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs opacity-70">Submitting updates your personal algorithm. Loved spots rise; results alternate loved / new so you never get bored.</p>
        </Sheet>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-black/40 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 text-xs opacity-80">
          <div>Orryx UI Lab • Food•Mood Demo</div>
          <div className="flex items-center gap-2">
            <span>Theme:</span>
            <select
              value={theme as any}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-lg bg-white/10 px-2 py-1"
            >
              <option value="engineer">Engineer</option>
              <option value="soldier">Soldier</option>
              <option value="dreamer">Dreamer</option>
            </select>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ————— UI Atoms —————
function Header({ theme, setTheme }: { theme: string; setTheme: (v: string) => void }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Orryx</h1>
        <p className="text-sm opacity-80">A food finder that helps you feel good.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl border border-white/20 px-3 py-2 text-xs hover:bg-white/10"
          onClick={() => tryShare("Check out Orryx – Food•Mood demo")}
        >
          Share
        </button>
      </div>
    </header>
  );
}

function Tab({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold shadow ${
        active ? "bg-white text-black" : "border border-white/20 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function MoodPill({ label, value, onPick }: { label: string; value: Mood; onPick: () => void }) {
  return (
    <button onClick={onPick} className="flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
      <span className="opacity-80">{label}:</span> <span className="font-semibold">{value}</span>
    </button>
  );
}

function CardGrid({
  items,
  user,
  onFav,
  onShare,
  onOrder,
}: {
  items: { r: Restaurant; s: number }[];
  user: UserPrefs;
  onFav: (rid: string) => void;
  onShare: (r: Restaurant) => void | Promise<void>;
  onOrder: (rid: string) => void;
}) {
  if (items.length === 0)
    return <div className="rounded-xl border border-white/15 p-6 text-sm opacity-80">No matches yet. Try another mood, search, or tag.</div>;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ r, s }) => (
        <RestaurantCard key={r.id} r={r} score={s} user={user} onFav={onFav} onShare={onShare} onOrder={onOrder} />)
      )}
    </div>
  );
}

function RestaurantCard({
  r,
  score,
  user,
  onFav,
  onShare,
  onOrder,
}: {
  r: Restaurant;
  score: number;
  user: UserPrefs;
  onFav: (rid: string) => void;
  onShare: (r: Restaurant) => void | Promise<void>;
  onOrder: (rid: string) => void;
}) {
  const lovedBadges = MOODS.filter((m) => isLoved(r.id, m, user));
  const [open, setOpen] = React.useState(false);
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/15 bg-white/5">
      <div className="h-28 w-full bg-gradient-to-r from-white/10 to-white/5" />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm opacity-80">{r.cuisine} • {r.price} • {r.location}</div>
            <h3 className="text-lg font-bold leading-tight">{r.name}</h3>
          </div>
          <button
            onClick={() => onFav(r.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              user.favorites.has(r.id) ? "bg-white text-black" : "border border-white/20 hover:bg-white/10"
            }`}
          >
            {user.favorites.has(r.id) ? "Saved" : "Save"}
          </button>
        </div>
        {lovedBadges.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="rounded-full border border-pink-300/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-pink-200/90">TEST‑ONLY</span>
            {lovedBadges.map((m) => (
              <span key={m} className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                Loved for {m}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1">
          {r.tags.map((t) => (
            <span key={t} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] opacity-80">{t}</span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs opacity-70">match: {toPct(score)}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => onShare(r)} className="rounded-xl border border-white/20 px-3 py-1 text-xs hover:bg-white/10">Share</button>
            <button onClick={() => onOrder(r.id)} className="rounded-xl bg-white px-3 py-1 text-xs font-bold text-black hover:bg-white/90">Place fake order</button>
          </div>
        </div>

        {/* DEV / TEST‑ONLY: Expandable mood details */}
        <div className="mt-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/10"
          >
            {open ? "Hide" : "Show"} details – exact mood values
          </button>
          {open && (
            <div className="mt-2 rounded-xl border border-white/15 bg-black/30 p-3 text-xs">
              <div className="mb-1 opacity-70">Base scores, learned affinity, blended score, counts & loved flag.</div>
              <div className="grid grid-cols-5 gap-2 font-mono">
                <div className="opacity-70">Mood</div>
                <div className="opacity-70">Base</div>
                <div className="opacity-70">Affinity</div>
                <div className="opacity-70">Blended</div>
                <div className="opacity-70">Count/Loved</div>
                {MOODS.map((m) => {
                  const base = r.moodScores[m];
                  const a = user.affinity[m][r.id] ?? 0;
                  const blended = scoreForMood(r, m, user);
                  const c = user.counts[m][r.id] ?? 0;
                  const loved = isLoved(r.id, m, user);
                  return (
                    <React.Fragment key={m}>
                      <div>{m}</div>
                      <div>{base.toFixed(2)}</div>
                      <div>{a.toFixed(2)}</div>
                      <div>{blended.toFixed(2)}</div>
                      <div>{c} {loved ? "✓" : ""}</div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-t-3xl border border-white/15 bg-gradient-to-b from-black/60 to-black/80 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider opacity-90">{title}</h4>
          <button onClick={onClose} className="rounded-lg border border-white/20 px-2 py-1 text-xs hover:bg-white/10">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
