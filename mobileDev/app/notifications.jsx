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

  /*
  |--------------------------------------------------------------------------
  | LOAD NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | LOAD WHEN SCREEN OPENS
  |--------------------------------------------------------------------------
  */

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const refreshNotifications = async () => {
    setRefreshing(true);

    await loadNotifications();
  };

  /*
  |--------------------------------------------------------------------------
  | MARK AS READ
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | MARK ALL READ
  |--------------------------------------------------------------------------
  */

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      })),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);

    setNotifications((current) =>
      current.filter((item) => item.id !== notificationId),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR
  |--------------------------------------------------------------------------
  */

  const handleClearAll = async () => {
    await clearNotifications();

    setNotifications([]);
  };

  /*
  |--------------------------------------------------------------------------
  | ICON
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | ICON COLOR
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* ACTIONS */}

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
        {/* LOADING */}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />

            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          /*
          |--------------------------------------------------------------------------
          | EMPTY
          |--------------------------------------------------------------------------
          */

          <View style={styles.emptyState}>
            <View style={styles.notificationIcon}>
              <Ionicons
                name="notifications-outline"
                size={34}
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
          /*
          |--------------------------------------------------------------------------
          | NOTIFICATION LIST
          |--------------------------------------------------------------------------
          */

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
                  {/* ICON */}

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
                      size={23}
                      color={iconColor}
                    />
                  </View>

                  {/* CONTENT */}

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

                  {/* DELETE */}

                  <TouchableOpacity
                    onPress={() => handleDelete(notification.id)}
                    hitSlop={8}
                    style={styles.deleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
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

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

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
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
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
      fontSize: 12,
      fontWeight: "700",
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
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.chipBg,
      marginBottom: 18,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 13,
      lineHeight: 20,
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
      width: 44,
      height: 44,
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
      fontSize: 14,
      fontWeight: "800",
      flexShrink: 1,
    },

    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginLeft: 7,
    },

    notificationMessage: {
      fontSize: 12,
      lineHeight: 18,
    },

    notificationDate: {
      fontSize: 10,
      marginTop: 8,
    },

    deleteButton: {
      padding: 4,
      marginLeft: 8,
    },
  });
