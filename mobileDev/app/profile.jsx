import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  const userName = "Adim";
  const userEmail = "adim@example.com";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="#16A34A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Large avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={56} color="#9CA3AF" />
          </View>
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      {/* Settings list */}
      <View style={styles.listCard}>
        <View style={styles.listRow}>
          <View style={styles.listLeft}>
            <View style={styles.iconBubble}>
              <Ionicons name="moon-outline" size={18} color="#16A34A" />
            </View>
            <Text style={styles.listLabel}>Dark mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#E5E7EB", true: "#16A34A" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.listRow}
          onPress={() => router.push("/forget-password")}
        >
          <View style={styles.listLeft}>
            <View style={styles.iconBubble}>
              <Ionicons name="lock-closed-outline" size={18} color="#16A34A" />
            </View>
            <Text style={styles.listLabel}>Change password</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() =>
          Alert.alert("Log out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Log out",
              style: "destructive",
              onPress: () => {
                // TODO: clear auth token / session here once real auth is wired in
                router.replace("/");
              },
            },
          ])
        }
      >
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },

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
    color: "#16A34A",
  },

  avatarSection: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 28,
  },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: "#86EFAC",
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
  listLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  listLabel: { fontSize: 15, color: "#111827", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginLeft: 62 },

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
  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "700",
  },
});
