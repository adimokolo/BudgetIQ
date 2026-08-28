import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getCurrentUser } from "../services/auth";

export default function Profile() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);

  const [user, setUser] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  /*
   * =========================================================
   * GET USER PROFILE
   * =========================================================
   */
  const loadProfile = async () => {
    try {
      setLoading(true);

      // getCurrentUser() already returns response.data
      const data = await getCurrentUser();

      /*
       * Supports both possible API response formats:
       *
       * FORMAT 1:
       * {
       *   name: "Adim",
       *   email: "adim@example.com"
       * }
       *
       * FORMAT 2:
       * {
       *   user: {
       *     name: "Adim",
       *     email: "adim@example.com"
       *   }
       * }
       */

      const profile = data?.user || data;

      setUser({
        name: profile?.name || profile?.fullName || profile?.username || "User",

        email: profile?.email || "",
      });
    } catch (error) {
      console.log("Load profile error:", error);

      let errorMessage = "We couldn't load your profile information.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      }

      Alert.alert("Unable to load profile", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * LOAD PROFILE WHEN SCREEN OPENS
   * =========================================================
   */
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  /*
   * =========================================================
   * CHANGE PASSWORD
   * =========================================================
   */
  const handleChangePassword = () => {
    router.push("/forget-password");
  };

  /*
   * =========================================================
   * LOGOUT CONFIRMATION
   * =========================================================
   */
  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log out",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  /*
   * =========================================================
   * PERFORM LOGOUT
   * =========================================================
   */
  const performLogout = async () => {
    try {
      setLoggingOut(true);

      /*
       * IMPORTANT:
       *
       * If you store your authentication token in
       * AsyncStorage, SecureStore, or another storage system,
       * remove it here.
       *
       * Example:
       *
       * await AsyncStorage.removeItem("token");
       *
       * We will connect this properly once we see your
       * login/api authentication setup.
       */

      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);

      Alert.alert("Logout failed", "Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  /*
   * =========================================================
   * UI
   * =========================================================
   */
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* =====================================================
          HEADER
          ===================================================== */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        {/* Keeps title centered */}
        <View style={{ width: 24 }} />
      </View>

      {/* =====================================================
          PROFILE AVATAR + USER INFORMATION
          ===================================================== */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarCircle}>
            {loading ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <Ionicons name="person" size={56} color="#9CA3AF" />
            )}
          </View>
        </View>

        {loading ? (
          <>
            <View style={styles.nameSkeleton} />
            <View style={styles.emailSkeleton} />
          </>
        ) : (
          <>
            <Text style={styles.userName}>{user.name}</Text>

            <Text style={styles.userEmail}>{user.email}</Text>
          </>
        )}
      </View>

      {/* =====================================================
          SETTINGS CARD
          ===================================================== */}
      <View style={styles.listCard}>
        {/* DARK MODE */}
        <View style={styles.listRow}>
          <View style={styles.listLeft}>
            <View style={styles.iconBubble}>
              <Ionicons name="moon-outline" size={18} color="#111827" />
            </View>

            <Text style={styles.listLabel}>Dark mode</Text>
          </View>

          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{
              false: "#E5E7EB",
              true: "#111827",
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.divider} />

        {/* CHANGE PASSWORD */}
        <TouchableOpacity
          style={styles.listRow}
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.7}
        >
          <View style={styles.listLeft}>
            <View style={styles.iconBubble}>
              <Ionicons name="lock-closed-outline" size={18} color="#111827" />
            </View>

            <Text style={styles.listLabel}>Change password</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* =====================================================
          LOGOUT BUTTON
          ===================================================== */}
      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        disabled={loggingOut}
        activeOpacity={0.7}
      >
        {loggingOut ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        )}

        <Text style={styles.logoutText}>
          {loggingOut ? "Logging out..." : "Logout"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/*
 * ===========================================================
 * STYLES
 * ===========================================================
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /* =========================================================
     HEADER
     ========================================================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  /* =========================================================
     PROFILE
     ========================================================= */

  avatarSection: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 28,
  },

  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: "#14274E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  userEmail: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },

  /* =========================================================
     LOADING SKELETON
     ========================================================= */

  nameSkeleton: {
    width: 120,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },

  emailSkeleton: {
    width: 160,
    height: 14,
    borderRadius: 5,
    backgroundColor: "#F3F4F6",
    marginTop: 8,
  },

  /* =========================================================
     SETTINGS
     ========================================================= */

  listCard: {
    marginHorizontal: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    overflow: "hidden",
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  listLabel: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 62,
  },

  /* =========================================================
     LOGOUT
     ========================================================= */

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
  },

  logoutButtonDisabled: {
    opacity: 0.7,
  },

  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "700",
  },
});
