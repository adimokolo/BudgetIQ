import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import { getCurrentUser, logoutUser, uploadAvatar } from "../services/auth";

import { useTheme } from "../contexts/ThemeContext";

const API_BASE_URL = "http://10.0.2.2:5000";

export default function Profile() {
  const router = useRouter();

  const { colors, isDark, setDarkMode } = useTheme();

  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar_url: null,
  });

  const [loading, setLoading] = useState(true);

  const [loggingOut, setLoggingOut] = useState(false);

  const [uploading, setUploading] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const data = await getCurrentUser();

      const profile = data?.user || data;

      setUser({
        name:
          profile?.full_name ||
          profile?.name ||
          profile?.fullName ||
          profile?.username ||
          "User",

        email: profile?.email || "",

        avatar_url: profile?.avatar_url || null,
      });
    } catch (error) {
      console.log("Load profile error:", error);

      Alert.alert(
        "Unable to load profile",
        error?.message ||
          error?.error ||
          "We couldn't load your profile information.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const handleAvatarPress = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your photo library to upload a profile picture.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0].uri;

      setUploading(true);

      const response = await uploadAvatar(imageUri);

      console.log("AVATAR UPLOAD RESPONSE:", response);

      const updatedUser = response.user;

      setUser((currentUser) => ({
        ...currentUser,

        avatar_url: updatedUser.avatar_url,
      }));

      Alert.alert("Success", "Your profile picture has been updated.");
    } catch (error) {
      console.log("Avatar error:", error);

      Alert.alert(
        "Upload Failed",
        error?.message ||
          error?.error ||
          "Unable to upload your profile picture.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = () => {
    router.push("/forget-password");
  };

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

  const performLogout = async () => {
    try {
      setLoggingOut(true);

      await logoutUser();

      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);

      Alert.alert("Logout failed", "Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const avatarSource = user.avatar_url
    ? {
        uri: `${API_BASE_URL}${user.avatar_url}`,
      }
    : null;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={["top"]}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Profile
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {/* AVATAR */}

      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={handleAvatarPress}
          disabled={loading || uploading}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.avatarRing,
              {
                borderColor: colors.primary,
              },
            ]}
          >
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.skeleton,
                },
              ]}
            >
              {uploading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : loading ? (
                <ActivityIndicator size="small" color={colors.textFaint} />
              ) : avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={56} color={colors.textFaint} />
              )}
            </View>

            {/* CAMERA ICON */}

            <View
              style={[
                styles.cameraButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {loading ? (
          <>
            <View
              style={[
                styles.nameSkeleton,
                {
                  backgroundColor: colors.skeleton,
                },
              ]}
            />

            <View
              style={[
                styles.emailSkeleton,
                {
                  backgroundColor: colors.skeleton,
                },
              ]}
            />
          </>
        ) : (
          <>
            <Text
              style={[
                styles.userName,
                {
                  color: colors.text,
                },
              ]}
            >
              {user.name}
            </Text>

            <Text
              style={[
                styles.userEmail,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              {user.email}
            </Text>
          </>
        )}
      </View>

      {/* SETTINGS */}

      <View
        style={[
          styles.listCard,
          {
            backgroundColor: colors.card,
          },
        ]}
      >
        {/* DARK MODE */}

        <View style={styles.listRow}>
          <View style={styles.listLeft}>
            <View
              style={[
                styles.iconBubble,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Ionicons name="moon-outline" size={18} color={colors.text} />
            </View>

            <Text
              style={[
                styles.listLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              Dark mode
            </Text>
          </View>

          <Switch
            value={isDark}
            onValueChange={setDarkMode}
            trackColor={{
              false: "#E5E7EB",
              true: colors.primary,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.divider,
            },
          ]}
        />

        {/* CHANGE PASSWORD */}

        <TouchableOpacity
          style={styles.listRow}
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.7}
        >
          <View style={styles.listLeft}>
            <View
              style={[
                styles.iconBubble,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.text}
              />
            </View>

            <Text
              style={[
                styles.listLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              Change password
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </TouchableOpacity>
      </View>

      {/* LOGOUT */}

      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            borderColor: colors.dangerBorder,
          },
          loggingOut && styles.logoutButtonDisabled,
        ]}
        onPress={handleLogout}
        disabled={loggingOut}
        activeOpacity={0.7}
      >
        {loggingOut ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        )}

        <Text
          style={[
            styles.logoutText,
            {
              color: colors.danger,
            },
          ]}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },

  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  cameraButton: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  userName: {
    fontSize: 22,
    fontWeight: "800",
  },

  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },

  nameSkeleton: {
    width: 120,
    height: 22,
    borderRadius: 6,
  },

  emailSkeleton: {
    width: 160,
    height: 14,
    borderRadius: 5,
    marginTop: 8,
  },

  listCard: {
    marginHorizontal: 20,
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
    alignItems: "center",
    justifyContent: "center",
  },

  listLabel: {
    fontSize: 15,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    marginLeft: 62,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
  },

  logoutButtonDisabled: {
    opacity: 0.7,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
