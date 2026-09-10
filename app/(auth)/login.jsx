import { useState } from "react";
import { View, TextInput, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in both fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login", { email, password });
      // Call the login function from AuthContext which handles secure storage and routing
      await login(response.data.token, response.data.user);
    } catch (err) {
      console.error("Login Error:", err.message, err.response?.data);
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.message === "Network Error" || !err.response) {
        setError(`Network error: Unable to reach server. Make sure your phone is on the same Wi-Fi network as your PC.`);
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role === "child" ? "Child Login" : "Parent Login"}</Text>

      <View style={styles.roleContainer}>
        <View style={styles.roleButtons}>
          <Pressable 
            style={[styles.roleButton, role === "parent" && styles.roleButtonActive]}
            onPress={() => setRole("parent")}
          >
            <Text style={[styles.roleButtonText, role === "parent" && styles.roleButtonTextActive]}>Parent</Text>
          </Pressable>
          <Pressable 
            style={[styles.roleButton, role === "child" && styles.roleButtonActive]}
            onPress={() => setRole("child")}
          >
            <Text style={[styles.roleButtonText, role === "child" && styles.roleButtonTextActive]}>Child</Text>
          </Pressable>
        </View>
      </View>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleLogin} disabled={loading} style={styles.button}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/register")} style={styles.link}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, marginBottom: 20, fontWeight: "bold", textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, marginBottom: 12, borderRadius: 8 },
  error: { color: "red", marginBottom: 10, textAlign: "center" },
  button: { backgroundColor: "#3366FF", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#3366FF", fontSize: 14 },
  roleContainer: { marginBottom: 20 },
  roleButtons: { flexDirection: "row", gap: 10 },
  roleButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, alignItems: "center" },
  roleButtonActive: { backgroundColor: "#3366FF", borderColor: "#3366FF" },
  roleButtonText: { color: "#333", fontWeight: "bold" },
  roleButtonTextActive: { color: "#fff" },
});
