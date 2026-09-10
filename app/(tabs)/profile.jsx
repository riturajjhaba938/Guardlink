import { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/api";

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [image, setImage] = useState(user?.profilePicture || null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append("profilePicture", {
        uri: uri,
        name: filename,
        type: type,
      });

      const updatedUser = await updateProfile(formData);
      await updateUser(updatedUser);
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload profile picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={pickImage} style={styles.imageContainer} disabled={uploading}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Set Photo</Text>
          </View>
        )}
        {uploading && <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#0000ff" />}
      </Pressable>

      <Text style={styles.name}>{user?.name || "Parent User"}</Text>
      <Text style={styles.role}>Role: {user?.role || "parent"}</Text>

      <Pressable onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20, backgroundColor: "#fff" },
  imageContainer: { marginTop: 40, marginBottom: 20 },
  image: { width: 120, height: 120, borderRadius: 60 },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center"
  },
  placeholderText: { color: "#555", fontWeight: "bold" },
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  role: { fontSize: 16, color: "#666", marginBottom: 40, textTransform: "capitalize" },
  logoutButton: { backgroundColor: "#FF3B30", padding: 14, borderRadius: 8, width: "100%", alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
