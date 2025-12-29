/*
import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

import { Device } from "@/types/device";

export default function DevicesTabScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#832727ff" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#d85656ff"
          name="bolt.heart"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Devices
        </ThemedText>
      </ThemedView>
      <ThemedText>
        This app includes example code to help you get started.
      </ThemedText>
    </ParallaxScrollView>
  );
}

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
});

####################################################
*/

/*
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router"; // <-- router hook
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Device = {
  deviceId: string;
  created: number;
  lastSeen: number;
  online: boolean;
};

const SERVER_URL = "http://192.168.178.151:3000"; // your server IP

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter(); // <-- get router

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetch(`${SERVER_URL}/devices`)
      .then((res) => res.json())
      .then(setDevices)
      .catch(console.error)
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={devices}
          keyExtractor={(item) => item.deviceId}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/devices/[id]",
                  params: { id: item.deviceId },
                })
              } // <-- navigate
              style={{
                padding: 12,
                marginBottom: 8,
                backgroundColor: item.online ? "#4CAF50" : "#ddd",
                borderRadius: 8,
              }}>
              <Text style={{ color: item.online ? "#fff" : "#000" }}>
                {item.deviceId} {item.online ? "(online)" : "(offline)"}
              </Text>
            </Pressable>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={() => (
            <View style={{ padding: 20 }}>
              <ThemedText style={{ fontSize: 30, marginBottom: 10 }}>
                Devices
              </ThemedText>
              <ThemedText>Pull down to refresh the list</ThemedText>
            </View>
          )}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    // backgroundColor: "pink",
    flex: 1,
  },
});

*/

/*

import React from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

type Device = { id: string; name: string; status?: string };

const DEVICES: Device[] = [
  { id: "1", name: "Living Room Lamp", status: "Online" },
  { id: "2", name: "Thermostat", status: "Offline" },
  { id: "3", name: "Kitchen Speaker", status: "Online" },
  { id: "4", name: "Garage Door", status: "Online" },
  { id: "5", name: "Bedroom AC", status: "Offline" },
];

export default function DevicesScreen() {
  const renderItem = ({ item }: { item: Device }) => (
    <Pressable
      style={styles.card}
      onPress={() => console.log("Pressed", item.id)}>
      <Text style={styles.title} numberOfLines={2}>
        {item.name}
      </Text>
      {!!item.status && <Text style={styles.subtitle}>{item.status}</Text>}
    </Pressable>
  );

  return (
    <FlatList
      data={DEVICES}
      keyExtractor={(d) => d.id}
      numColumns={2}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
    />
  );
}

const GAP = 12;

const styles = StyleSheet.create({
  listContent: {
    padding: GAP,
  },
  row: {
    gap: GAP, // spacing between the two columns (RN 0.71+)
  },
  card: {
    flex: 1, // makes each card take half the row (minus gap)
    borderRadius: 16,
    padding: 14,
    minHeight: 96,
    backgroundColor: "#1f2937",
    // nice shadow (iOS) + elevation (Android)
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 8,
    color: "#cbd5e1",
    fontSize: 13,
  },
});

*/

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

import { Device } from "@/types/device";

/* ===== same storage key as your Settings screen ===== */
const STORAGE_KEY = "app:settings";
const HEALTH_PATH = "/health";
const DEVICES_PATH = "/devices";

// Change if your route differs
const SETTINGS_ROUTE = "/(tabs)/settings";

/* ===== Helpers ===== */
function normalizeBaseUrl(raw: string) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`;
  return trimmed;
}

function joinUrl(base: string, path: string) {
  if (!base) return "";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

type SettingsState = {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  hapticsEnabled: boolean;
  analyticsEnabled: boolean;
  serverAddress: string;
};

export default function DevicesTabScreen() {
  const [serverAddress, setServerAddress] = useState<string>("");
  const normalizedServer = useMemo(
    () => normalizeBaseUrl(serverAddress),
    [serverAddress]
  );

  const [status, setStatus] = useState<
    "idle" | "checking" | "offline" | "online"
  >("idle");

  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const healthUrl = useMemo(
    () => joinUrl(normalizedServer, HEALTH_PATH),
    [normalizedServer]
  );
  const devicesUrl = useMemo(
    () => joinUrl(normalizedServer, DEVICES_PATH),
    [normalizedServer]
  );

  const loadServerFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setServerAddress("");
        return;
      }
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      setServerAddress(
        typeof parsed?.serverAddress === "string" ? parsed.serverAddress : ""
      );
    } catch {
      setServerAddress("");
    }
  }, []);

  const checkServer = useCallback(async () => {
    if (!healthUrl) {
      setStatus("offline");
      return false;
    }

    setStatus("checking");
    try {
      const res = await fetch(healthUrl, { method: "GET" });
      const ok = res.ok;
      setStatus(ok ? "online" : "offline");
      return ok;
    } catch {
      setStatus("offline");
      return false;
    }
  }, [healthUrl]);

  const fetchDevices = useCallback(async () => {
    if (!devicesUrl) return;

    setLoadingDevices(true);
    try {
      const res = await fetch(devicesUrl, { method: "GET" });
      if (!res.ok) throw new Error("Failed /devices");

      const json = (await res.json()) as Device[];
      setDevices(Array.isArray(json) ? json : []);
    } catch {
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, [devicesUrl]);

  const reloadAll = useCallback(async () => {
    await loadServerFromStorage();
    // checkServer depends on healthUrl which depends on serverAddress,
    // so we do the check in an effect below when serverAddress changes.
  }, [loadServerFromStorage]);

  // Load server address when this tab becomes active (so Settings changes are picked up)
  useFocusEffect(
    useCallback(() => {
      reloadAll();
    }, [reloadAll])
  );

  // Whenever serverAddress changes, check server and fetch devices if online
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!normalizedServer) {
        setStatus("offline");
        setDevices([]);
        return;
      }

      const ok = await checkServer();
      if (cancelled) return;

      if (ok) {
        await fetchDevices();
      } else {
        setDevices([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalizedServer, checkServer, fetchDevices]);

  const onPressChangeServer = () => {
    router.push(SETTINGS_ROUTE);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const ok = await checkServer();
      if (ok) await fetchDevices();
    } finally {
      setRefreshing(false);
    }
  };

  const renderDevice = ({ item }: { item: Device }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {item.deviceName || item.deviceId}
          </ThemedText>
          <View
            style={[
              styles.pill,
              item.online ? styles.pillOnline : styles.pillOffline,
            ]}>
            <ThemedText style={styles.pillText}>
              {item.online ? "Online" : "Offline"}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.meta} numberOfLines={1}>
          {item.deviceType}
        </ThemedText>

        <ThemedText style={styles.meta} numberOfLines={1}>
          FW: {item.currentFWVersion ?? "—"}
        </ThemedText>

        <ThemedText style={styles.meta} numberOfLines={1}>
          Last seen: {new Date(item.lastSeen).toLocaleString()}
        </ThemedText>
      </View>
    );
  };

  const showOffline = status === "offline" || !normalizedServer;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#832727ff" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#d85656ff"
          name="bolt.heart"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Devices
        </ThemedText>
      </ThemedView>

      {/* Status row */}
      <View style={styles.statusRow}>
        {status === "checking" ? (
          <>
            <ActivityIndicator />
            <ThemedText style={styles.statusText}>Checking server…</ThemedText>
          </>
        ) : showOffline ? (
          <>
            <IconSymbol name="xmark" size={18} color="white" />
            <ThemedText style={styles.statusText}>
              Server not reachable
            </ThemedText>
          </>
        ) : (
          <>
            <IconSymbol name="checkmark" size={18} color="white" />
            <ThemedText style={styles.statusText}>Server online</ThemedText>
          </>
        )}
      </View>

      {showOffline ? (
        <View style={styles.offlineBlock}>
          <ThemedText style={styles.offlineHint}>
            Set or update your server address in Settings.
          </ThemedText>

          <Pressable
            onPress={onPressChangeServer}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Change server address">
            <IconSymbol name="gear" size={18} color="white" />
            <ThemedText style={styles.primaryButtonText}>
              Change server address
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          {loadingDevices && devices.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <ThemedText style={styles.loadingText}>
                Loading devices…
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(d) => d.deviceId}
              numColumns={2}
              columnWrapperStyle={styles.columnWrap}
              contentContainerStyle={styles.listContent}
              renderItem={renderDevice}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <ThemedText style={styles.emptyText}>
                  No devices returned from /devices.
                </ThemedText>
              }
            />
          )}
        </>
      )}
    </ParallaxScrollView>
  );
}

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
    marginBottom: 8,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  statusText: {
    opacity: 0.85,
  },

  offlineBlock: {
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  offlineHint: {
    opacity: 0.75,
  },
  primaryButton: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(56,122,245,0.95)",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  listContent: {
    paddingTop: 6,
    paddingBottom: 24,
  },
  columnWrap: {
    gap: 12,
  },
  card: {
    flex: 1,
    minHeight: 110,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "rgba(0,0,0,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 6,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillOnline: {
    backgroundColor: "rgba(38,160,90,0.95)",
  },
  pillOffline: {
    backgroundColor: "rgba(200,60,60,0.95)",
  },
  pillText: {
    color: "white",
    fontSize: 12,
    opacity: 0.95,
  },

  meta: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },

  center: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    opacity: 0.7,
  },
  emptyText: {
    opacity: 0.7,
    paddingVertical: 18,
  },
});
