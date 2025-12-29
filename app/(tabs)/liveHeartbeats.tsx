import mqtt, { MqttClient } from "mqtt";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Blink = {
  from: string;
  ts: number;
};

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [blinks, setBlinks] = useState<Blink[]>([]);

  const clientRef = useRef<MqttClient | null>(null);

  const PAIR_ID = "42";
  const MQTT_WS_URL = "ws://192.168.178.151:9001";
  const BLINK_TOPIC = `time2love/pair/${PAIR_ID}/blink`;

  function connectMQTT() {
    if (clientRef.current || connecting) {
      console.log("MQTT already connecting/connected");
      return;
    }

    console.log("User initiated MQTT connect");
    setConnecting(true);

    const client = mqtt.connect(MQTT_WS_URL, {
      protocol: "ws",
      clientId: "expo-listener",
      clean: true,
      keepalive: 30,
      reconnectPeriod: 0, // 🔑 NO auto-reconnect
    });

    clientRef.current = client;

    client.on("connect", () => {
      console.log("MQTT connected");
      setConnected(true);
      setConnecting(false);
      client.subscribe(BLINK_TOPIC, { qos: 1 });
    });

    client.on("close", () => {
      console.log("MQTT closed");
      setConnected(false);
      setConnecting(false);
      clientRef.current = null;
    });

    client.on("error", (err) => {
      console.log("MQTT error", err.message);
      setConnecting(false);
      client.end(true);
      clientRef.current = null;
    });

    client.on("message", (_topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        setBlinks((prev) => [...prev, data]);
      } catch {}
    });
  }

  function disconnectMQTT() {
    if (!clientRef.current) return;

    console.log("User disconnected MQTT");
    clientRef.current.end(true);
    clientRef.current = null;
    setConnected(false);
  }

  // Optional: clean up on app exit
  useEffect(() => {
    return () => {
      clientRef.current?.end(true);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MQTT Status</Text>

      <Text style={styles.status}>
        {connected
          ? "🟢 Connected"
          : connecting
          ? "🟡 Connecting…"
          : "🔴 Disconnected"}
      </Text>

      {!connected ? (
        <Pressable style={styles.button} onPress={connectMQTT}>
          <Text style={styles.buttonText}>Connect</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.button, styles.disconnect]}
          onPress={disconnectMQTT}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </Pressable>
      )}

      <ScrollView style={styles.blinkList}>
        {blinks.map((b, i) => (
          <Text key={i} style={styles.blink}>
            💖 Blink from {b.from} at{" "}
            {new Date(b.ts * 1000).toLocaleTimeString()}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 10 },
  status: { fontSize: 16, marginBottom: 20 },
  button: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  disconnect: {
    backgroundColor: "#E53935",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  blinkList: {
    marginTop: 10,
  },
  blink: {
    fontSize: 16,
    marginBottom: 8,
  },
});
