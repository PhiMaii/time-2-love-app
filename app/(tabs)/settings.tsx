import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

import { Fonts } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

/* ================= TYPES ================= */

type SettingKey =
  | "notificationsEnabled"
  | "darkModeEnabled"
  | "hapticsEnabled"
  | "analyticsEnabled";

type SettingsState = Record<SettingKey, boolean> & {
  serverAddress: string;
};

/* ================= CONSTANTS ================= */

const STORAGE_KEY = "app:settings";

const DEFAULT_SETTINGS: SettingsState = {
  notificationsEnabled: true,
  darkModeEnabled: true,
  hapticsEnabled: true,
  analyticsEnabled: true,
  serverAddress: "",
};

const SETTINGS = [
  {
    key: "notificationsEnabled" as const,
    title: "Enable Notifications",
    description: "Receive notifications on heartbeats",
  },
  {
    key: "darkModeEnabled" as const,
    title: "Dark Mode",
    description: "Use dark theme",
  },
  {
    key: "hapticsEnabled" as const,
    title: "Haptics",
    description: "Vibration feedback on interactions",
  },
  {
    key: "analyticsEnabled" as const,
    title: "Analytics",
    description: "Send anonymous usage data",
  },
] as const;

const INPUT_HEIGHT = 44;
const CHECK_DEBOUNCE_MS = 500;
const SAVE_DEBOUNCE_MS = 800;

// Change this to whatever route you add server-side:
const HEALTH_PATH = "/health";

/* ================= HELPERS ================= */

function normalizeBaseUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // If user forgot protocol, assume http://
  if (!/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`;
  return trimmed;
}

function joinUrl(base: string, path: string) {
  if (!base) return "";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

/* ================= SCREEN ================= */

type CheckStatus = "idle" | "checking" | "ok" | "fail";

export default function SettingsTabScreen() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const [serverInput, setServerInput] = useState<string>(
    DEFAULT_SETTINGS.serverAddress
  );
  const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");

  const abortRef = useRef<AbortController | null>(null);
  const latestCheckIdRef = useRef(0);

  const normalizedServer = useMemo(
    () => normalizeBaseUrl(serverInput),
    [serverInput]
  );

  /* ===== LOAD SETTINGS ===== */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);

          // Merge with defaults so older stored shapes don't break the app
          const merged: SettingsState = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            serverAddress:
              typeof parsed?.serverAddress === "string"
                ? parsed.serverAddress
                : DEFAULT_SETTINGS.serverAddress,
          };

          setSettings(merged);
          setServerInput(merged.serverAddress ?? "");
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoaded(true);
      }
    };

    loadSettings();
  }, []);

  /* ===== TOGGLE ===== */
  const toggleSetting = async (key: SettingKey) => {
    const newValue = !settings[key];

    // 🔔 HAPTIC FEEDBACK
    const shouldHaptic =
      key === "hapticsEnabled"
        ? newValue // allow haptic when turning it ON
        : settings.hapticsEnabled;

    if (shouldHaptic) {
      await Haptics.selectionAsync();
    }

    const updated: SettingsState = {
      ...settings,
      [key]: newValue,
    };

    setSettings(updated);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  };

  /* ===== SAVE SERVER ADDRESS (DEBOUNCED) ===== */
  useEffect(() => {
    if (!loaded) return;

    const t = setTimeout(async () => {
      const updated: SettingsState = {
        ...settings,
        serverAddress: serverInput,
      };

      setSettings(updated);

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save settings", e);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(t);
    // Intentionally not depending on `settings` to avoid extra re-saves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverInput, loaded]);

  /* ===== SERVER CHECK ===== */
  const runServerCheck = async (baseUrl: string) => {
    let url_port = baseUrl + ":3000";
    const url = joinUrl(url_port, HEALTH_PATH);
    if (!url) {
      setCheckStatus("idle");
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const checkId = ++latestCheckIdRef.current;
    setCheckStatus("checking");

    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      // Ignore if a newer check started
      if (checkId !== latestCheckIdRef.current) return;

      setCheckStatus(res.ok ? "ok" : "fail");
    } catch (e: any) {
      if (controller.signal.aborted) return;
      if (checkId !== latestCheckIdRef.current) return;
      setCheckStatus("fail");
    }
  };

  /* ===== DEBOUNCED CHECK AFTER INPUT ===== */
  useEffect(() => {
    if (!loaded) return;

    // If empty, reset state and stop
    if (!normalizedServer) {
      abortRef.current?.abort();
      setCheckStatus("idle");
      return;
    }

    const t = setTimeout(() => {
      runServerCheck(normalizedServer);
    }, CHECK_DEBOUNCE_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedServer, loaded]);

  /* ===== TAP SQUARE TO RE-RUN ===== */
  const onPressRecheck = async () => {
    if (settings.hapticsEnabled) {
      await Haptics.selectionAsync();
    }
    if (!normalizedServer) return;
    runServerCheck(normalizedServer);
  };

  const statusStyle = useMemo(() => {
    switch (checkStatus) {
      case "checking":
        return styles.statusChecking;
      case "ok":
        return styles.statusOk;
      case "fail":
        return styles.statusFail;
      default:
        return styles.statusIdle;
    }
  }, [checkStatus]);

  /* ================= UI ================= */

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="gear"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Settings
        </ThemedText>
      </ThemedView>

      <ThemedText style={styles.subtitle}>
        {loaded ? "Customize your preferences" : "Loading..."}
      </ThemedText>

      {/* ===== SERVER ADDRESS INPUT (beneath switches) ===== */}
      <View style={styles.serverBlock}>
        <ThemedText type="defaultSemiBold">Server Address</ThemedText>
        <ThemedText style={styles.description}>
          Used to connect to your backend (checks {HEALTH_PATH})
        </ThemedText>

        <View style={styles.serverRow}>
          <TextInput
            value={serverInput}
            onChangeText={setServerInput}
            placeholder="e.g. 192.168.0.10:3000 or https://api.example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.serverInput}
            returnKeyType="done"
          />

          <Pressable
            onPress={onPressRecheck}
            style={({ pressed }) => [
              styles.statusSquare,
              statusStyle,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Re-check server connection">
            {checkStatus === "checking" ? (
              <ActivityIndicator />
            ) : checkStatus === "ok" ? (
              <IconSymbol name="checkmark" size={18} color="white" />
            ) : checkStatus === "fail" ? (
              <IconSymbol name="xmark" size={18} color="white" />
            ) : (
              <IconSymbol name="arrow.clockwise" size={18} color="white" />
            )}
          </Pressable>
        </View>

        <ThemedText style={styles.hint}>
          {checkStatus === "checking"
            ? "Checking server…"
            : checkStatus === "ok"
            ? "Server reachable."
            : checkStatus === "fail"
            ? "Server not reachable. Tap the square to retry."
            : "Enter an address to verify connectivity."}
        </ThemedText>
      </View>

      <View style={styles.list}>
        {SETTINGS.map((item) => (
          <View key={item.key} style={styles.row}>
            <View style={styles.textContainer}>
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText style={styles.description}>
                {item.description}
              </ThemedText>
            </View>

            <Switch
              value={settings[item.key]}
              onValueChange={() => toggleSetting(item.key)}
              trackColor={{
                false: "rgb(56,57,60)",
                true: "rgb(56,122,245)",
              }}
              thumbColor={
                settings[item.key] ? "rgb(225,235,255)" : "rgb(225,225,225)"
              }
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  subtitle: {
    marginBottom: 16,
    opacity: 0.7,
  },
  list: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  description: {
    fontSize: 13,
    opacity: 0.6,
  },

  serverBlock: {
    gap: 8,
    marginTop: 0,
  },
  serverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serverInput: {
    flex: 1,
    height: INPUT_HEIGHT,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.12)",
    color: "white",
  },
  statusSquare: {
    width: INPUT_HEIGHT, // square: same width as input is tall
    height: INPUT_HEIGHT,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },

  statusIdle: {
    backgroundColor: "rgba(120,120,120,0.7)",
  },
  statusChecking: {
    backgroundColor: "rgba(120,120,120,0.9)",
  },
  statusOk: {
    backgroundColor: "rgba(38, 160, 90, 0.95)",
  },
  statusFail: {
    backgroundColor: "rgba(200, 60, 60, 0.95)",
  },

  hint: {
    fontSize: 12,
    opacity: 0.65,
  },
});
