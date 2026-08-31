import React, { useCallback, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter, useFocusEffect } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearNotifications,
} from "../services/notifications";

export default function Notifications() {
  const router = useRouter();

  const { colors } = useTheme();

  const styles = createStyles(colors);

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();

      console.log("Notifications loaded:", data);

      setNotifications(data);
    } catch (error) {
      console.log("Load notifications error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const refreshNotifications = async () => {
    setRefreshing(true);

    await loadNotifications();
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
      );
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      })),
    );
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);

    setNotifications((current) =>
      current.filter((item) => item.id !== notificationId),
    );
  };

  const handleClearAll = async () => {
    await clearNotifications();

    setNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "danger":
        return "warning-outline";

      case "warning":
        return "alert-circle-outline";

      case "success":
        return "checkmark-circle-outline";

      default:
        return "information-circle-outline";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "danger":
        return colors.danger;

      case "warning":
        return colors.caution;

      case "success":
        return colors.income;

      default:
        return colors.primary;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);

      return date.toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.headerSpacer} />
      </View>

      {notifications.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text
              style={[
                styles.actionText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Mark all as read
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClearAll}>
            <Text
              style={[
                styles.actionText,
                {
                  color: colors.danger,
                },
              ]}
            >
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.container,
          notifications.length === 0 && {
            flexGrow: 1,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshNotifications}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />

            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.notificationIcon}>
              <Ionicons
                name="notifications-outline"
                size={28}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>No notifications yet</Text>

            <Text style={styles.emptyText}>
              You're all caught up. We'll let you know when there's something
              important about your finances.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationList}>
            {notifications.map((notification) => {
              const iconColor = getNotificationColor(notification.type);

              return (
                <TouchableOpacity
                  key={notification.id}
                  activeOpacity={0.8}
                  onPress={() => handleNotificationPress(notification)}
                  style={[
                    styles.notificationCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },

                    !notification.read && {
                      borderColor: iconColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.notificationIconSmall,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={20}
                      color={iconColor}
                    />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        {notification.title}
                      </Text>

                      {!notification.read && (
                        <View
                          style={[
                            styles.unreadDot,
                            {
                              backgroundColor: colors.primary,
                            },
                          ]}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.notificationMessage,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {notification.message}
                    </Text>

                    <Text
                      style={[
                        styles.notificationDate,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      {formatDate(notification.createdAt)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(notification.id)}
                    hitSlop={8}
                    style={styles.deleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.textFaint}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backButton: {
      width: 25,
      height: 25,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontFamily: "SpaceGrotesk_700Bold",
      color: colors.text,
    },
    headerSpacer: {
      width: 40,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 18,
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    actionText: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
    },
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    loadingState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 100,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
      paddingVertical: 100,
    },
    notificationIcon: {
      width: 60,
      height: 60,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.chipBg,
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: "SpaceGrotesk_700Bold",
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
      color: colors.textMuted,
      textAlign: "center",
      maxWidth: 320,
    },
    notificationList: {
      gap: 12,
    },
    notificationCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderWidth: 1,
      borderRadius: 16,
      padding: 15,
    },
    notificationIconSmall: {
      width: 35,
      height: 35,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    notificationTitle: {
      fontSize: 12,
      fontFamily: "SpaceGrotesk_700Bold",
      flexShrink: 1,
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginLeft: 7,
    },
    notificationMessage: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      lineHeight: 16,
    },
    notificationDate: {
      fontSize: 9,
      fontFamily: "Inter_400Regular",
      marginTop: 8,
    },
    deleteButton: {
      padding: 4,
      marginLeft: 8,
    },
  });
