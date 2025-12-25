/*
import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

export default function DevicesTabScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#ee5656ff" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#e91919ff"
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

*/
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

const SERVER_URL = "http://192.168.1.120:3000"; // your server IP

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
