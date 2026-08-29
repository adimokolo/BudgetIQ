import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import Svg, { Circle } from "react-native-svg";

import { getDashboard } from "../../services/dashboard";
import { getCurrentUser } from "../../services/auth";
import { useTheme } from "../../contexts/ThemeContext";

const screenWidth = Dimensions.get("window").width;

/*
|--------------------------------------------------------------------------
| BACKEND URL
|--------------------------------------------------------------------------
|
| Android Emulator:
| http://10.0.2.2:5000
|
| If using a physical phone, replace this with your computer's local IP:
| http://192.168.X.X:5000
|
*/

const SERVER_URL = "http://10.0.2.2:5000";

/*
|--------------------------------------------------------------------------
| NORMALIZE AVATAR URL
|--------------------------------------------------------------------------
*/

const normalizeAvatarUrl = (url) => {
  if (!url) return null;

  const cleanedUrl = String(url).trim();

  // If backend already returns a full URL
  if (cleanedUrl.startsWith("http://") || cleanedUrl.startsWith("https://")) {
    return cleanedUrl
      .replace("localhost", "10.0.2.2")
      .replace("127.0.0.1", "10.0.2.2");
  }

  // If backend returns a relative URL
  return `${SERVER_URL}${cleanedUrl.startsWith("/") ? "" : "/"}${cleanedUrl}`;
};

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  label,
  value,
  valueColor,
  badge,
  badgeBg,
  footer,
  colors,
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.cardLabel,
          {
            color: colors.textFaint,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.cardValue,
          {
            color: valueColor || colors.text,
          },
        ]}
      >
        {value}
      </Text>

      {badge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeBg || colors.incomeBg,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: colors.income,
              },
            ]}
          >
            {badge}
          </Text>
        </View>
      )}

      {footer && (
        <Text
          style={[
            styles.cardFooter,
            {
              color: colors.textFaint,
            },
          ]}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| DONUT CHART
|--------------------------------------------------------------------------
*/

function Donut({ segments, colors, size = 160, strokeWidth = 24 }) {
  const radius = (size - strokeWidth) / 2;

  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce(
    (sum, segment) => sum + Number(segment.total || 0),
    0,
  );

  if (!total) {
    return (
      <View
        style={[
          styles.emptyDonut,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.divider,
          },
        ]}
      >
        <Text
          style={[
            styles.emptyDonutText,
            {
              color: colors.textFaint,
            },
          ]}
        >
          No data
        </Text>
      </View>
    );
  }

  let offsetAccumulator = 0;

  return (
    <Svg width={size} height={size}>
      {segments.map((segment, index) => {
        const value = Number(segment.total || 0);

        if (value <= 0) return null;

        const fraction = value / total;

        const dash = fraction * circumference;

        const gap = circumference - dash;

        const rotation = (offsetAccumulator / total) * 360 - 90;

        offsetAccumulator += value;

        return (
          <Circle
            key={segment.category_id ?? index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={segment.color || colors.textFaint}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="butt"
            fill="none"
            rotation={rotation}
            origin={`${size / 2}, ${size / 2}`}
          />
        );
      })}
    </Svg>
  );
}

/*
|--------------------------------------------------------------------------
| MONTH LABEL
|--------------------------------------------------------------------------
*/

function monthLabel(monthKey) {
  if (!monthKey) return "";

  const [year, month] = monthKey.split("-").map(Number);

  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "short",
  });
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export default function Dashboard() {
  const router = useRouter();

  const { colors } = useTheme();

  const [dashboard, setDashboard] = useState(null);

  const [userName, setUserName] = useState("User");

  const [avatarUrl, setAvatarUrl] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  /*
  |--------------------------------------------------------------------------
  | LOAD DASHBOARD
  |--------------------------------------------------------------------------
  */

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getDashboard();

      console.log("DASHBOARD RESPONSE:", JSON.stringify(data, null, 2));

      setDashboard(data);
    } catch (error) {
      console.log(
        "DASHBOARD ERROR:",
        error?.response?.data || error?.message || error,
      );

      Alert.alert(
        "Dashboard Error",
        error?.message || error?.error || "Unable to load dashboard data.",
      );
    }
  }, []);
  const loadNotificationCount = useCallback(async () => {
    try {
      const notifications = await getNotifications();

      const unread = notifications.filter(
        (notification) => !notification.read,
      ).length;

      setUnreadNotifications(unread);
    } catch (error) {
      console.log("Load notification count error:", error);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD CURRENT USER
  |--------------------------------------------------------------------------
  */

  const loadUser = useCallback(async () => {
    try {
      const data = await getCurrentUser();

      console.log("CURRENT USER RESPONSE:", JSON.stringify(data, null, 2));

      /*
        |--------------------------------------------------------------------------
        | HANDLE DIFFERENT BACKEND RESPONSE FORMATS
        |--------------------------------------------------------------------------
        */

      const profile = data?.user || data?.data?.user || data?.data || data;

      console.log("USER PROFILE:", JSON.stringify(profile, null, 2));

      /*
        |--------------------------------------------------------------------------
        | USER NAME
        |--------------------------------------------------------------------------
        */

      const fullName =
        profile?.full_name ||
        profile?.name ||
        profile?.fullName ||
        profile?.username ||
        "User";

      setUserName(String(fullName).trim().split(" ")[0]);

      /*
        |--------------------------------------------------------------------------
        | AVATAR URL
        |--------------------------------------------------------------------------
        */

      const rawAvatarUrl =
        profile?.avatar_url ||
        profile?.avatarUrl ||
        profile?.profile_image ||
        profile?.profileImage ||
        profile?.image ||
        profile?.photo ||
        null;

      console.log("RAW AVATAR URL:", rawAvatarUrl);

      const finalAvatarUrl = normalizeAvatarUrl(rawAvatarUrl);

      console.log("FINAL AVATAR URL:", finalAvatarUrl);

      setAvatarUrl(finalAvatarUrl);
    } catch (error) {
      console.log(
        "LOAD USER ERROR:",
        error?.response?.data || error?.message || error,
      );

      setAvatarUrl(null);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        await Promise.all([
          loadDashboard(),
          loadUser(),
          loadNotificationCount(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadDashboard, loadUser, loadNotificationCount]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await Promise.all([loadDashboard(), loadUser(), loadNotificationCount()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard, loadUser, loadNotificationCount]);

  /*
  |--------------------------------------------------------------------------
  | CURRENCY FORMAT
  |--------------------------------------------------------------------------
  */

  const formatCurrency = (amount) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING SCREEN
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.screen,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />

          <Text
            style={[
              styles.loadingText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD DATA
  |--------------------------------------------------------------------------
  */

  const summary = dashboard?.summary || {};

  const monthlyTrend = dashboard?.monthlyTrend || [];

  const categoryBreakdown = dashboard?.categoryBreakdown || [];

  const forecastData = dashboard?.forecast || {};

  const totalIncome = Number(summary.totalIncome || 0);

  const totalExpense = Number(summary.totalExpense || 0);

  const netBalance = summary.netBalance ?? totalIncome - totalExpense;

  const savingsRate = summary.savingsRate ?? 0;

  const forecast = forecastData.nextMonthPredictedExpense || 0;

  const forecastTrend = forecastData.trend;

  const forecastConfidence = forecastData.confidence;

  /*
  |--------------------------------------------------------------------------
  | CHART DATA
  |--------------------------------------------------------------------------
  */

  const chartLabels =
    monthlyTrend.length > 0
      ? monthlyTrend.map((item) => monthLabel(item.month))
      : ["No data"];

  const incomeData =
    monthlyTrend.length > 0
      ? monthlyTrend.map((item) => Number(item.income || 0))
      : [0];

  const expenseData =
    monthlyTrend.length > 0
      ? monthlyTrend.map((item) => Number(item.expense || 0))
      : [0];

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

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
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.headerRow}>
          {/* PROFILE AVATAR */}

          <TouchableOpacity
            onPress={() => router.push("/profile")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.avatarLarge,
                {
                  backgroundColor: colors.chipBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {avatarUrl ? (
                <Image
                  key={avatarUrl}
                  source={{
                    uri: avatarUrl,
                  }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onLoad={() => {
                    console.log("AVATAR LOADED SUCCESSFULLY:", avatarUrl);
                  }}
                  onError={(error) => {
                    console.log(
                      "AVATAR IMAGE ERROR:",
                      JSON.stringify(error.nativeEvent, null, 2),
                    );

                    console.log("FAILED AVATAR URL:", avatarUrl);
                  }}
                />
              ) : (
                <Ionicons name="person" size={30} color={colors.textFaint} />
              )}
            </View>
          </TouchableOpacity>

          {/* WELCOME TEXT */}

          <View style={styles.headerText}>
            <Text
              style={[
                styles.heading,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={1}
            >
              Good to see you, {userName}
            </Text>

            <Text
              style={[
                styles.subheading,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Here's the clearest picture of your money this month.
            </Text>
          </View>

          {/* NOTIFICATIONS */}

          <TouchableOpacity
            style={[
              styles.notificationButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={17}
              color={colors.text}
            />

            {unreadNotifications > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  {
                    backgroundColor: colors.danger,
                    borderColor: colors.card,
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* STAT CARDS */}

        <View style={styles.cardsWrap}>
          <StatCard
            colors={colors}
            label="TOTAL INCOME (MONTH)"
            value={formatCurrency(totalIncome)}
            valueColor={colors.income}
          />

          <StatCard
            colors={colors}
            label="TOTAL EXPENSE (MONTH)"
            value={formatCurrency(totalExpense)}
            valueColor={colors.expense}
          />

          <StatCard
            colors={colors}
            label="NET BALANCE"
            value={formatCurrency(netBalance)}
            badge={`${savingsRate}% savings rate`}
          />

          <StatCard
            colors={colors}
            label="NEXT MONTH'S FORECAST"
            value={formatCurrency(forecast)}
            badge={
              forecastTrend
                ? `${forecastTrend} trend${
                    forecastConfidence
                      ? ` • ${Math.round(forecastConfidence * 100)}% confidence`
                      : ""
                  }`
                : "Forecast"
            }
            footer="Estimated from your recent spending history. More history improves the prediction."
          />
        </View>

        {/* INCOME VS SPENDING */}

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Income vs. spending
          </Text>

          <Text
            style={[
              styles.sectionSubtitle,
              {
                color: colors.textFaint,
              },
            ]}
          >
            Last six months
          </Text>

          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: incomeData,
                  color: () => colors.income,
                  strokeWidth: 2,
                },
                {
                  data: expenseData,
                  color: () => colors.expense,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 72}
            height={220}
            withInnerLines={false}
            withOuterLines={false}
            bezier
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: () => colors.textFaint,
              labelColor: () => colors.textFaint,
              propsForDots: {
                r: "3",
              },
            }}
            style={{
              marginLeft: -16,
            }}
          />
        </View>

        {/* WHERE IT WENT */}

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Where it went
          </Text>

          <Text
            style={[
              styles.sectionSubtitle,
              {
                color: colors.textFaint,
              },
            ]}
          >
            This month's spending by category
          </Text>

          <View style={styles.donutRow}>
            <Donut segments={categoryBreakdown} colors={colors} />
          </View>

          {categoryBreakdown.length > 0 ? (
            <View style={styles.legend}>
              {categoryBreakdown.map((segment, index) => (
                <View
                  key={segment.category_id ?? index}
                  style={styles.legendRow}
                >
                  <View style={styles.legendLeft}>
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor: segment.color || colors.textFaint,
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.legendLabel,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {segment.name || "Category"}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.legendValue,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {formatCurrency(segment.total)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={[
                styles.noDataText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              No spending data available yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  heading: {
    fontSize: 22,
    fontWeight: "800",
  },

  subheading: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    overflow: "hidden",
  },

  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
  },

  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },

  cardsWrap: {
    gap: 12,
    marginBottom: 20,
  },

  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  cardValue: {
    fontSize: 22,
    fontWeight: "800",
  },

  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  cardFooter: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },

  sectionCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },

  donutRow: {
    alignItems: "center",
    marginVertical: 12,
  },

  emptyDonut: {
    borderWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyDonutText: {
    fontSize: 13,
  },

  legend: {
    marginTop: 12,
    gap: 10,
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendLabel: {
    fontSize: 13,
  },

  legendValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  noDataText: {
    textAlign: "center",
    marginVertical: 20,
  },
});
