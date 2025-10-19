import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
  Modal,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

// Minimal theme (self-contained)
const theme = {
  bg: "#0B0F1A",
  surface: "#111827",
  surface2: "#0F1523",
  text: "#E5EDF5",
  muted: "#93A4B8",
  primary: "#9CC9FF",
  accent: "#7C3AED",
  accentDim: "#6D28D9",
  success: "#10B981",
  danger: "#EF4444",
  yellow: "#FBBF24",
  dot: "#334155",
  dotActive: "#9CC9FF",
  radius: 16,
};

// Shared bits
const Card = ({ children, style }) => (
  <View
    style={[
      {
        backgroundColor: theme.surface,
        borderRadius: theme.radius,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const SectionTitle = ({ children }) => (
  <Text style={{ color: theme.primary, fontSize: 20, fontWeight: "700", marginBottom: 10 }}>
    {children}
  </Text>
);

const Chip = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{
      backgroundColor: selected ? theme.accent : theme.surface2,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginRight: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: selected ? theme.accent : "#1f2937",
    }}
  >
    <Text style={{ color: selected ? "white" : theme.text, fontWeight: "600" }}>{label}</Text>
  </Pressable>
);

// ---------- Feature Pages ----------

// 1) Smart Search (mock suggestions + debounce)
function PageSearch() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!q) return setSuggestions([]);
      const base = ["Pizza", "Sushi", "Tacos", "BBQ", "Vegan", "Coffee", "Noodles", "Burgers"];
      setSuggestions(base.filter((x) => x.toLowerCase().includes(q.toLowerCase())).slice(0, 5));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Card>
      <SectionTitle>Smart Search</SectionTitle>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>
        Debounced, with quick suggestions (mocked locally).
      </Text>
      <View
        style={{
          backgroundColor: theme.surface2,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: "#1f2937",
        }}
      >
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Try 'sushi', 'tacos', 'pizza'…"
          placeholderTextColor="#6B7280"
          style={{ color: theme.text, fontSize: 16 }}
        />
      </View>

      {suggestions.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {suggestions.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => setQ(s)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: theme.surface2,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#1f2937",
              }}
            >
              <Text style={{ color: theme.text }}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

// 2) Filter Chips (multi-select cuisine tags)
function PageChips() {
  const tags = ["Breakfast", "Vegan", "Halal", "Gluten-free", "Spicy", "Open late", "Budget", "Date night"];
  const [sel, setSel] = useState(new Set(["Vegan"]));
  return (
    <Card>
      <SectionTitle>Filter Chips</SectionTitle>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>
        Tap to toggle; selections power your recommendations.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {tags.map((t) => {
          const selected = sel.has(t);
          return (
            <Chip
              key={t}
              label={t}
              selected={selected}
              onPress={() => {
                const next = new Set(sel);
                selected ? next.delete(t) : next.add(t);
                setSel(next);
              }}
            />
          );
        })}
      </View>
    </Card>
  );
}

// 3) Restaurant Card (rating, favorite toggle)
function PageCard() {
  const [fav, setFav] = useState(false);
  const stars = 4.5;
  return (
    <Card>
      <SectionTitle>Restaurant Card</SectionTitle>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}>Nana’s Kitchen</Text>
      <Text style={{ color: theme.muted, marginBottom: 8 }}>Ghanaian • $$ • 1.1 mi</Text>
      <Text style={{ color: theme.yellow, marginBottom: 14 }}>
        {"★".repeat(Math.floor(stars))}{"☆".repeat(5 - Math.floor(stars))} {stars.toFixed(1)}
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={() => setFav((f) => !f)}
          style={{
            backgroundColor: fav ? theme.danger : theme.surface2,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: fav ? "white" : theme.text, fontWeight: "700" }}>
            {fav ? "♥ Saved" : "♡ Save"}
          </Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: theme.accent,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>View Menu</Text>
        </Pressable>
      </View>
    </Card>
  );
}

// 4) Expandable Text (collapsible details)
function PageExpandable() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <SectionTitle>Expandable Details</SectionTitle>
      <Text style={{ color: theme.muted, marginBottom: 8 }}>
        Tap to show/hide long content without leaving context.
      </Text>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{
          backgroundColor: theme.surface2,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#1f2937",
        }}
      >
        <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 6 }}>
          About “Orryx Picks” {open ? "▲" : "▼"}
        </Text>
        {open ? (
          <Text style={{ color: theme.text }}>
            We combine popularity, proximity, freshness, and your filter history to rank places you’ll
            likely love. Your picks improve as you explore—privacy-respecting and on-device.
          </Text>
        ) : (
          <Text style={{ color: theme.muted }}>Tap to read how we rank restaurants.</Text>
        )}
      </Pressable>
    </Card>
  );
}

// 5) Swipeable Row (reveal actions)
function PageSwipeRow() {
  const x = useRef(new Animated.Value(0)).current;
  const openTo = -120;
  const toggle = () => {
    Animated.spring(x, { toValue: x.__getValue() === 0 ? openTo : 0, useNativeDriver: true, bounciness: 6 }).start();
  };
  return (
    <Card>
      <SectionTitle>Swipeable Row</SectionTitle>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>Swipe left to reveal actions</Text>
      <View style={{ height: 64, overflow: "hidden" }}>
        <View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          <View style={{ width: 60, backgroundColor: theme.accent, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "white" }}>Share</Text>
          </View>
          <View style={{ width: 60, backgroundColor: theme.danger, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "white" }}>Hide</Text>
          </View>
        </View>

        <Animated.View
          style={{
            transform: [{ translateX: x }],
            backgroundColor: theme.surface2,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#1f2937",
            height: 64,
            justifyContent: "center",
            paddingHorizontal: 14,
          }}
        >
          <Pressable onPress={toggle}>
            <Text style={{ color: theme.text, fontWeight: "600" }}>“Jollof Palace” — Swipe me</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Card>
  );
}

// 6) Pull-to-Refresh List
function PageRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState(["Kelewele Spot", "Omo Tuo House", "Ampesi Hub"]);
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setItems((arr) => ["New Pop-Up Café", ...arr]);
      setRefreshing(false);
    }, 900);
  };
  return (
    <Card style={{ padding: 0 }}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <SectionTitle>Pull-to-Refresh</SectionTitle>
        <Text style={{ color: theme.muted, marginBottom: 10 }}>
          Natural mobile gesture to fetch newest places.
        </Text>
      </View>
      <ScrollView
        style={{ maxHeight: 240 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: 20, paddingTop: 12 }}
      >
        {items.map((t) => (
          <View
            key={t}
            style={{
              backgroundColor: theme.surface2,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#1f2937",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: theme.text }}>{t}</Text>
          </View>
        ))}
      </ScrollView>
    </Card>
  );
}

// 7) Bottom Sheet (pure RN)
function PageBottomSheet() {
  const [open, setOpen] = useState(false);
  const y = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    Animated.timing(y, {
      toValue: open ? 0 : 400,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open]);

  return (
    <Card>
      <SectionTitle>Bottom Sheet</SectionTitle>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>Great for quick actions on a place.</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Open Sheet</Text>
      </Pressable>

      {/* Overlay */}
      {open && (
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />
      )}
      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
          transform: [{ translateY: y }],
        }}
      >
        <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 10 }}>Quick Actions</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <ActionPill label="Share" color={theme.accent} />
          <ActionPill label="Navigate" color={theme.primary} />
          <ActionPill label="Call" color={theme.success} />
        </View>
      </Animated.View>
    </Card>
  );
}
const ActionPill = ({ label, color }) => (
  <View style={{ backgroundColor: color, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 }}>
    <Text style={{ color: "white", fontWeight: "700" }}>{label}</Text>
  </View>
);

// 8) Skeleton shimmer
function PageSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.linear })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });
  const Skel = ({ h, w, r = 10, mb = 10 }) => (
    <View
      style={{
        width: w,
        height: h,
        borderRadius: r,
        overflow: "hidden",
        backgroundColor: "#1f2937",
        marginBottom: mb,
      }}
    >
      <Animated.View
        style={{
          width: 120,
          height: "100%",
          opacity: 0.4,
          backgroundColor: "#9CA3AF",
          transform: [{ translateX }],
        }}
      />
    </View>
  );

  return (
    <Card>
      <SectionTitle>Skeleton Loading</SectionTitle>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>Shimmer while fetching data.</Text>
      <Skel w="100%" h={18} />
      <Skel w="70%" h={14} />
      <Skel w="90%" h={14} />
      <Skel w="60%" h={14} />
    </Card>
  );
}

// 9) Toast/Snackbar (auto-hide)
function PageToast() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, [show]);
  return (
    <Card>
      <SectionTitle>Toast / Snackbar</SectionTitle>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>Transient confirmations.</Text>
      <Pressable
        onPress={() => setShow(true)}
        style={{ backgroundColor: theme.success, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Save Filters</Text>
      </Pressable>

      {show && (
        <View
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 16,
            backgroundColor: "#0d1b2a",
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: theme.text, textAlign: "center" }}>Saved! 🎉</Text>
        </View>
      )}
    </Card>
  );
}

// 10) Theme toggle (light/dark)
function PageTheme() {
  const [dark, setDark] = useState(true);
  return (
    <Card>
      <SectionTitle>Theme Toggle</SectionTitle>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>Preview light vs. dark surfaces.</Text>
      <Pressable
        onPress={() => setDark((d) => !d)}
        style={{
          backgroundColor: dark ? theme.accent : theme.primary,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>{dark ? "Switch to Light" : "Switch to Dark"}</Text>
      </Pressable>

      <View style={{ height: 14 }} />
      <View
        style={{
          backgroundColor: dark ? theme.surface2 : "#f3f4f6",
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: dark ? "#1f2937" : "#e5e7eb",
        }}
      >
        <Text style={{ color: dark ? theme.text : "#111827" }}>
          This block reflects the current theme.
        </Text>
      </View>
    </Card>
  );
}

// ---------- UI Guide Overlay ----------
function GuideOverlay({ visible, onClose, pages, onJump }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", padding: 20, justifyContent: "center" }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
            UI Guide — tap to jump
          </Text>
          {pages.map((p, i) => (
            <Pressable
              key={i}
              onPress={() => {
                onClose();
                onJump(i);
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: theme.surface2,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#1f2937",
              }}
            >
              <Text style={{ color: theme.text }}>
                {i + 1}. {p.title}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------- Shell with horizontal paging ----------
export default function App() {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [guide, setGuide] = useState(false);

  const pages = useMemo(
    () => [
      { title: "Smart Search", node: <PageSearch /> },
      { title: "Filter Chips", node: <PageChips /> },
      { title: "Restaurant Card", node: <PageCard /> },
      { title: "Expandable Text", node: <PageExpandable /> },
      { title: "Swipeable Row", node: <PageSwipeRow /> },
      { title: "Pull-to-Refresh", node: <PageRefresh /> },
      { title: "Bottom Sheet", node: <PageBottomSheet /> },
      { title: "Skeleton Shimmer", node: <PageSkeleton /> },
      { title: "Toast / Snackbar", node: <PageToast /> },
      { title: "Theme Toggle", node: <PageTheme /> },
    ],
    []
  );

  const jumpTo = (i) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * SCREEN_W, animated: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", flex: 1 }}>Orryx UI Lab</Text>
        <Pressable
          onPress={() => setGuide(true)}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 999,
            paddingVertical: 8,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>UI Guide</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setIndex(i);
        }}
      >
        {pages.map((p, i) => (
          <View key={i} style={{ width: SCREEN_W, padding: 20 }}>
            {p.node}
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 10 }}>
        {pages.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 22 : 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: i === index ? theme.dotActive : theme.dot,
            }}
          />
        ))}
      </View>

      {/* UI Guide overlay */}
      <GuideOverlay visible={guide} onClose={() => setGuide(false)} pages={pages} onJump={jumpTo} />
    </SafeAreaView>
  );
}
