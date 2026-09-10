import { useEffect, useState } from "react";
import { View, TextInput, FlatList, Text, ActivityIndicator, StyleSheet, RefreshControl } from "react-native";
import api from "../../services/api";

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchContacts = async () => {
    try {
      const childrenRes = await api.get("/children");
      if (childrenRes.data.length === 0) {
        setErrorMsg("No children linked to your account.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const childId = childrenRes.data[0].childId._id;
      const contactRes = await api.get(`/contacts/${childId}`);
      
      setContacts(contactRes.data.contacts || []);
    } catch (err) {
      setErrorMsg("Failed to fetch contact data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  const filtered = contacts.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;
  if (errorMsg) return <Text style={styles.error}>{errorMsg}</Text>;

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search contacts..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No contacts found</Text>}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>
              {item.phoneNumbers?.[0]?.number || "No number"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  loader: { marginTop: 50 },
  error: { padding: 20, color: "red", textAlign: "center" },
  searchInput: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8, marginBottom: 12 },
  empty: { textAlign: "center", marginTop: 20, color: "#666" },
  contactItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" },
  name: { fontWeight: "600", fontSize: 16 },
  phone: { color: "#666", marginTop: 4 },
});
