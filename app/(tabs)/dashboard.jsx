import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, TextInput, Pressable, Alert } from "react-native";
import api from "../../services/api";

export default function Dashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [childEmail, setChildEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchChildren = async () => {
    try {
      const response = await api.get("/children");
      setChildren(response.data);
    } catch (err) {
      console.error("Failed to fetch children", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChildren();
  };

  const handleAddChild = async () => {
    if (!childEmail) return;
    setAdding(true);
    try {
      await api.post("/children", { childEmail });
      setChildEmail("");
      fetchChildren();
      Alert.alert("Success", "Child added successfully!");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to add child");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;

  return (
    <View style={styles.container}>
      <View style={styles.addSection}>
        <TextInput 
          placeholder="Enter child email..."
          value={childEmail}
          onChangeText={setChildEmail}
          autoCapitalize="none"
          style={styles.input}
        />
        <Pressable onPress={handleAddChild} disabled={adding} style={styles.addButton}>
          {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Add</Text>}
        </Pressable>
      </View>

      <FlatList
        data={children}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No children linked yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.childId?.name || "Unknown"}</Text>
            <Text style={styles.email}>{item.childId?.email || "No email"}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  loader: { marginTop: 50 },
  empty: { textAlign: "center", marginTop: 20, color: "#666" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  name: { fontSize: 18, fontWeight: "bold" },
  email: { color: "#666", marginTop: 4 },
  addSection: { flexDirection: "row", marginBottom: 16, gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, backgroundColor: "#fff" },
  addButton: { backgroundColor: "#3366FF", padding: 12, borderRadius: 8, justifyContent: "center", alignItems: "center", width: 80 },
  addButtonText: { color: "#fff", fontWeight: "bold" }
});
