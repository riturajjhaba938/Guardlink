import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

// Context type definition (using simple state)
export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async (token, userData) => {},
  logout: async () => {},
  updateUser: async (userData) => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved token and user on startup
    const loadUser = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        const storedUser = await SecureStore.getItemAsync("user");

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to load user state", e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (token, userData) => {
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("user", JSON.stringify(userData));
    setUser(userData);
    
    if (userData.role === "child") {
      router.replace("/(child)/");
    } else {
      router.replace("/(tabs)/dashboard");
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    setUser(null);
    router.replace("/(auth)/login");
  };

  const updateUser = async (newUserData) => {
    await SecureStore.setItemAsync("user", JSON.stringify(newUserData));
    setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
