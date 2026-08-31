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
import { getNotifications } from "../../services/notifications";
import { useTheme } from "../../contexts/ThemeContext";

const screenWidth = Dimensions.get("window").width;

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

function monthLabel(monthKey) {
  if (!monthKey) return "";

  const [year, month] = monthKey.split("-").map(Number);

  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "short",
  });
}

export default function Dashboard() {
  const router = useRouter();

  const { colors } = useTheme();

  const [dashboard, setDashboard] = useState(null);

  const [userName, setUserName] = useState("User");

  const [avatarUrl, setAvatarUrl] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [tooltip, setTooltip] = useState({
    visible: false,
    index: null,
    x: 0,
    y: 0,
    monthLabel: "",
    income: 0,
    expense: 0,
  });

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getDashboard();

      console.log("Dashboard API response:", data);

      setDashboard(data);
    } catch (error) {
      console.log("Dashboard error:", error);

      Alert.alert("Error", error?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const loadUser = useCallback(async () => {
    try {
      const data = await getCurrentUser();

      console.log("CURRENT USER RESPONSE:", JSON.stringify(data, null, 2));

      const profile = data?.user || data?.data?.user || data?.data || data;

      console.log("USER PROFILE:", JSON.stringify(profile, null, 2));

      const fullName =
        profile?.full_name ||
        profile?.name ||
        profile?.fullName ||
        profile?.username ||
        "User";

      setUserName(String(fullName).trim().split(" ")[0]);
      const rawAvatarUrl =
        profile?.avatar_url ||
        profile?.avatarUrl ||
        profile?.profile_image ||
        profile?.profileImage ||
        profile?.image ||
        profile?.photo ||
        null;

      console.log("RAW AVATAR URL LENGTH:", rawAvatarUrl?.length || 0);

      setAvatarUrl(rawAvatarUrl || null);
    } catch (error) {
      console.log(
        "LOAD USER ERROR:",
        error?.response?.data || error?.message || error,
      );

      setAvatarUrl(null);
    }
  }, []);

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

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await Promise.all([loadDashboard(), loadUser(), loadNotificationCount()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard, loadUser, loadNotificationCount]);

  const formatCurrency = (amount) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

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

  const summary = dashboard?.summary || {};

  const monthlyTrend = dashboard?.monthlyTrend || [];

  const categoryBreakdown = dashboard?.categoryBreakdown || [];

  const forecast = dashboard?.forecast || {};

  const forecastAmount = Number(forecast.nextMonthPredictedExpense || 0);

  const forecastTrend =
    forecast.trend === "up"
      ? {
          label: "Trending up",
          tone: "warning",
        }
      : forecast.trend === "down"
        ? {
            label: "Trending down",
            tone: "income",
          }
        : {
            label: "Holding steady",
            tone: "income",
          };

  const forecastConfidence =
    forecast.confidence === "low"
      ? "Building confidence"
      : forecast.confidence
        ? `${forecast.confidence} confidence`
        : "Building confidence";

  const totalIncome = Number(summary.totalIncome || 0);

  const totalExpense = Number(summary.totalExpense || 0);

  const netBalance = summary.netBalance ?? totalIncome - totalExpense;

  const savingsRate = summary.savingsRate ?? 0;

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
        <View style={styles.headerRow}>
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
                    console.log("AVATAR LOADED SUCCESSFULLY");
                  }}
                  onError={(error) => {
                    console.log(
                      "AVATAR IMAGE ERROR:",
                      JSON.stringify(error.nativeEvent, null, 2),
                    );
                  }}
                />
              ) : (
                <Ionicons name="person" size={30} color={colors.textFaint} />
              )}
            </View>
          </TouchableOpacity>

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

          <View
            style={[
              styles.forecastCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 14,
                padding: 16,
              },
            ]}
          >
            <Text
              style={[
                styles.forecastLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              NEXT MONTH'S FORECAST
            </Text>

            <Text
              style={[
                styles.forecastAmount,
                {
                  color: colors.text,
                },
              ]}
            >
              ₦
              {forecastAmount.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>

            <View style={styles.forecastPills}>
              <View
                style={[
                  styles.forecastPill,
                  forecastTrend.tone === "warning"
                    ? {
                        backgroundColor: colors.warningBg || "#3A3020",
                      }
                    : {
                        backgroundColor: colors.incomeBg,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.forecastPillText,
                    {
                      color:
                        forecastTrend.tone === "warning"
                          ? colors.warning || "#FBBF24"
                          : colors.income,
                    },
                  ]}
                >
                  {forecastTrend.label}
                </Text>
              </View>

              <View
                style={[
                  styles.forecastConfidencePill,
                  {
                    backgroundColor: colors.chipBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.forecastConfidenceText,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  {forecastConfidence}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.forecastDescription,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Estimated from your last few months of spending. More history
              sharpens the forecast.
            </Text>
          </View>
        </View>

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
                r: "4",
              },
            }}
            style={{
              marginLeft: -16,
            }}
            onDataPointClick={({ index, x, y }) => {
              setTooltip((current) => {
                const isSameDot = current.visible && current.index === index;

                return {
                  visible: !isSameDot,
                  index,
                  x,
                  y,
                  monthLabel: chartLabels[index],
                  income: incomeData[index],
                  expense: expenseData[index],
                };
              });
            }}
            decorator={() => {
              if (!tooltip.visible) return null;

              return (
                <View
                  style={[
                    styles.tooltipBox,
                    {
                      left: tooltip.x - 60,
                      top: tooltip.y - 90,
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tooltipMonth,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {tooltip.monthLabel}
                  </Text>

                  <Text
                    style={[
                      styles.tooltipRow,
                      {
                        color: colors.income,
                      },
                    ]}
                  >
                    Income : {formatCurrency(tooltip.income)}
                  </Text>

                  <Text
                    style={[
                      styles.tooltipRow,
                      {
                        color: colors.expense,
                      },
                    ]}
                  >
                    Expense : {formatCurrency(tooltip.expense)}
                  </Text>
                </View>
              );
            }}
          />
        </View>

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
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  heading: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  subheading: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
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
    width: 60,
    height: 60,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 32,
  },
  notificationButton: {
    width: 36,
    height: 36,
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
    borderWidth: 1.0,
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
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 17,
    fontFamily: "JetBrainsMono_500Medium",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  cardFooter: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    lineHeight: 16,
  },
  forecastCard: {
    position: "relative",
    overflow: "hidden",
  },
  forecastLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    lineHeight: 18,
  },
  forecastAmount: {
    marginTop: 8,
    fontSize: 22,
    fontFamily: "JetBrainsMono_500Medium",
  },
  forecastPills: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  forecastPill: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  forecastPillText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  forecastConfidencePill: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  forecastConfidenceText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },

  forecastDescription: {
    marginTop: 12,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
  },

  tooltipBox: {
    position: "absolute",
    minWidth: 130,
    padding: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tooltipMonth: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  tooltipRow: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  legendValue: {
    fontSize: 11,
    fontFamily: "JetBrainsMono_500Medium",
  },

  noDataText: {
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "Inter_400Regular",
  },
});
