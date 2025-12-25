// app/device/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

type Device = {
  deviceId: string;
  created: number;
  lastSeen: number;
  online: boolean;
};

const SERVER_URL = "http://192.168.1.120:3000";

export default function DeviceEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>(); // ✅ correct hook
  const router = useRouter();

  const [device, setDevice] = useState<Device | null>(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDevice = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/devices/${id}`);
        if (!response.ok) {
          const text = await response.text();
          console.error("Server returned non-JSON response:", text);
          return;
        }
        const data = await response.json();
        setDevice(data);
        setOnline(data.online);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDevice();
  }, [id]);

  const saveDevice = async () => {
    if (!device) return;
    await fetch(`${SERVER_URL}/devices/${device.deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...device, online }),
    });
    router.back();
  };

  if (!device) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Device ID:</Text>
      <TextInput
        style={styles.input}
        value={device.deviceId}
        editable={false}
      />

      <Text style={styles.label}>Online:</Text>
      <Switch value={online} onValueChange={setOnline} />

      <Button title="Save" onPress={saveDevice} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  label: { fontWeight: "bold", marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginTop: 5,
  },
});
