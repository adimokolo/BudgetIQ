import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import { getDashboard } from "../../services/dashboard";
import { getTransactions } from "../../services/transactions";
import { getCategories } from "../../services/categories";
import { getCurrentUser } from "../../services/auth";
import { getNotifications } from "../../services/notifications";

import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";

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
            stroke={segment.color || colors.primary}
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

function GroupedBarChart({
  labels,
  incomeData,
  expenseData,
  colors,
  formatAmount,
  chartHeight = 150,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const maxValue = Math.max(1, ...incomeData, ...expenseData);

  const barHeightFor = (value) => {
    const height = (Number(value || 0) / maxValue) * chartHeight;

    return Math.max(value > 0 ? 3 : 0, height);
  };

  return (
    <View>
      <View style={styles.groupedChartBody}>
        <View style={styles.groupedYAxis}>
          <Text
            style={[
              styles.groupedYAxisLabel,
              {
                color: colors.textFaint,
              },
            ]}
          >
            {formatAmount(maxValue)}
          </Text>

          <Text
            style={[
              styles.groupedYAxisLabel,
              {
                color: colors.textFaint,
              },
            ]}
          >
            {formatAmount(maxValue / 2)}
          </Text>

          <Text
            style={[
              styles.groupedYAxisLabel,
              {
                color: colors.textFaint,
              },
            ]}
          >
            {formatAmount(0)}
          </Text>
        </View>

        <View style={[styles.groupedBarsArea, { height: chartHeight }]}>
          <View
            style={[
              styles.groupedGridLine,
              {
                top: 0,
                backgroundColor: colors.divider || colors.cardBorder,
              },
            ]}
          />

          <View
            style={[
              styles.groupedGridLine,
              {
                top: chartHeight / 2,
                backgroundColor: colors.divider || colors.cardBorder,
              },
            ]}
          />

          <View
            style={[
              styles.groupedGridLine,
              {
                bottom: 0,
                backgroundColor: colors.divider || colors.cardBorder,
              },
            ]}
          />

          <View style={styles.groupedColumnsRow}>
            {labels.map((label, index) => {
              const isActive = selectedIndex === index;

              return (
                <TouchableOpacity
                  key={`${label}-${index}`}
                  style={styles.groupedColumn}
                  activeOpacity={0.7}
                  onPress={() =>
                    setSelectedIndex((current) =>
                      current === index ? null : index,
                    )
                  }
                >
                  <View style={styles.groupedBarPair}>
                    <View
                      style={[
                        styles.groupedBar,
                        {
                          height: barHeightFor(incomeData[index]),
                          backgroundColor: colors.income,
                          opacity:
                            isActive || selectedIndex === null ? 1 : 0.35,
                        },
                      ]}
                    />

                    <View
                      style={[
                        styles.groupedBar,
                        {
                          height: barHeightFor(expenseData[index]),
                          backgroundColor: colors.expense,
                          opacity:
                            isActive || selectedIndex === null ? 1 : 0.35,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.groupedLabelsRow}>
        <View style={styles.groupedYAxisSpacer} />

        {labels.map((label, index) => (
          <Text
            key={`${label}-label-${index}`}
            style={[
              styles.groupedMonthLabel,
              {
                color: selectedIndex === index ? colors.text : colors.textFaint,
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {selectedIndex !== null && (
        <View
          style={[
            styles.groupedTooltip,
            {
              backgroundColor: colors.chipBg,
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
            {labels[selectedIndex]}
          </Text>

          <Text
            style={[
              styles.tooltipRow,
              {
                color: colors.income,
              },
            ]}
          >
            Income: {formatAmount(incomeData[selectedIndex])}
          </Text>

          <Text
            style={[
              styles.tooltipRow,
              {
                color: colors.expense,
              },
            ]}
          >
            Expense: {formatAmount(expenseData[selectedIndex])}
          </Text>
        </View>
      )}
    </View>
  );
}

function fallbackIconFor(type) {
  return type?.toLowerCase() === "income" ? "cash-outline" : "pricetag-outline";
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

  /*
  |--------------------------------------------------------------------------
  | CURRENCY
  |--------------------------------------------------------------------------
  |
  | The dashboard no longer keeps its own currency state.
  |
  | CurrencyContext is now the single source of truth.
  |
  | formatAmount(1000)
  | -> ₦1,000.00
  | -> $1,000.00
  | -> €1,000.00
  |
  | depending on the currency selected by the user.
  |
  */

  const { formatAmount, baseCurrency, currencyReady, setBaseCurrency } =
    useCurrency();

  const [dashboard, setDashboard] = useState(null);

  const [transactions, setTransactions] = useState([]);

  const [categories, setCategories] = useState([]);

  const [userName, setUserName] = useState("User");

  const [avatarUrl, setAvatarUrl] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();

      const list = data.transactions || [];

      setTransactions(list);
    } catch (error) {
      console.log("Dashboard transactions error:", error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();

      setCategories(data.categories || []);
    } catch (error) {
      console.log("Dashboard categories error:", error);
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

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT: SYNC USER CURRENCY
      |--------------------------------------------------------------------------
      |
      | Registration saves the selected currency to the user profile.
      |
      | When the dashboard loads, we read that same profile currency and
      | sync it into CurrencyContext.
      |
      | This means the dashboard will respect the currency selected during
      | registration.
      |
      */

      const profileCurrency =
        profile?.currency ||
        profile?.base_currency ||
        profile?.baseCurrency ||
        null;

      if (profileCurrency) {
        const normalizedCurrency = String(profileCurrency).toUpperCase();

        console.log("USER PROFILE CURRENCY:", normalizedCurrency);

        if (normalizedCurrency !== baseCurrency) {
          await setBaseCurrency(normalizedCurrency);
        }
      }

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
  }, [baseCurrency, setBaseCurrency]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        await Promise.all([
          loadDashboard(),
          loadTransactions(),
          loadCategories(),
          loadUser(),
          loadNotificationCount(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    loadDashboard,
    loadTransactions,
    loadCategories,
    loadUser,
    loadNotificationCount,
  ]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        loadDashboard(),
        loadTransactions(),
        loadCategories(),
        loadUser(),
        loadNotificationCount(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    loadDashboard,
    loadTransactions,
    loadCategories,
    loadUser,
    loadNotificationCount,
  ]);

  /*
  |--------------------------------------------------------------------------
  | WAIT FOR CURRENCY
  |--------------------------------------------------------------------------
  |
  | Prevents the dashboard from briefly displaying NGN before the user's
  | saved currency has been loaded from AsyncStorage.
  |
  */

  if (loading || !currencyReady) {
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

  /*
  |--------------------------------------------------------------------------
  | WHERE IT WENT
  |--------------------------------------------------------------------------
  */

  const now = new Date();

  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;

  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  const categoryBreakdown = (() => {
    const grouped = new Map();

    for (const transaction of transactions) {
      const isExpense =
        String(transaction.type || "").toLowerCase() === "expense";

      const occurredOn = transaction.occurred_on || transaction.occurredOn;

      const inCurrentMonth =
        typeof occurredOn === "string" &&
        occurredOn.slice(0, 7) === currentMonthKey;

      if (!isExpense || !inCurrentMonth) {
        continue;
      }

      const key =
        transaction.category_id ?? transaction.category_name ?? "uncategorized";

      const amount = Number(transaction.amount || 0);

      const matchedCategory = categoryById.get(transaction.category_id);

      if (!grouped.has(key)) {
        grouped.set(key, {
          category_id: transaction.category_id ?? key,

          name:
            matchedCategory?.name ||
            transaction.category_name ||
            "Uncategorized",

          color: matchedCategory?.color || colors.primary,

          icon: matchedCategory?.icon || fallbackIconFor("expense"),

          total: 0,
        });
      }

      const entry = grouped.get(key);

      entry.total += amount;
    }

    return [...grouped.values()].sort((a, b) => b.total - a.total);
  })();

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
        {/* HEADER */}

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

        {/* STAT CARDS */}

        <View style={styles.cardsWrap}>
          <StatCard
            colors={colors}
            label="TOTAL INCOME (MONTH)"
            value={formatAmount(totalIncome)}
            valueColor={colors.income}
          />

          <StatCard
            colors={colors}
            label="TOTAL EXPENSE (MONTH)"
            value={formatAmount(totalExpense)}
            valueColor={colors.expense}
          />

          <StatCard
            colors={colors}
            label="NET BALANCE"
            value={formatAmount(netBalance)}
            badge={`${savingsRate}% savings rate`}
          />

          {/* FORECAST */}

          <View
            style={[
              styles.forecastCard,
              {
                backgroundColor: colors.card,

                borderColor: colors.cardBorder,
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
              {formatAmount(forecastAmount)}
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

          <View style={styles.barChartHeader}>
            <View
              style={[
                styles.barLegendDot,
                {
                  backgroundColor: colors.income,
                },
              ]}
            />

            <Text
              style={[
                styles.barChartLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Income
            </Text>

            <View
              style={[
                styles.barLegendDot,
                {
                  backgroundColor: colors.expense,

                  marginLeft: 14,
                },
              ]}
            />

            <Text
              style={[
                styles.barChartLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Spending
            </Text>
          </View>

          <GroupedBarChart
            labels={chartLabels}
            incomeData={incomeData}
            expenseData={expenseData}
            colors={colors}
            formatAmount={formatAmount}
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
                        styles.iconCircle,
                        {
                          backgroundColor: segment.color || colors.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={segment.icon || fallbackIconFor("expense")}
                        size={11}
                        color="#FFFFFF"
                      />
                    </View>

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
                    {formatAmount(segment.total)}
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
    marginTop: 2,
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
    width: 55,
    height: 55,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    borderWidth: 1,
    overflow: "hidden",
  },

  avatarImage: {
    width: 55,
    height: 55,
    borderRadius: 32,
  },

  notificationButton: {
    width: 33,
    height: 33,
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
    borderWidth: 1,
  },

  cardsWrap: {
    gap: 12,
    marginBottom: 10,
  },

  card: {
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    marginBottom: -5,
  },

  cardLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  cardValue: {
    fontSize: 15,
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
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
  },

  cardFooter: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    lineHeight: 16,
  },

  forecastCard: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },

  forecastLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    lineHeight: 18,
  },

  forecastAmount: {
    marginTop: 8,
    fontSize: 16,
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
    paddingVertical: 3,
    paddingHorizontal: 14,
    borderRadius: 14,
  },

  forecastPillText: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
  },

  forecastConfidencePill: {
    paddingVertical: 3,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  forecastConfidenceText: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
  },

  forecastDescription: {
    marginTop: 10,
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    lineHeight: 13,
  },

  barChartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },

  barLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 4,
  },

  barChartLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  groupedChartBody: {
    flexDirection: "row",
    marginTop: 4,
  },

  groupedYAxis: {
    width: 46,
    justifyContent: "space-between",
    paddingRight: 6,
    paddingBottom: 0,
  },

  groupedYAxisSpacer: {
    width: 46,
  },

  groupedYAxisLabel: {
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },

  groupedBarsArea: {
    flex: 1,
    position: "relative",
  },

  groupedGridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.5,
  },

  groupedColumnsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },

  groupedColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },

  groupedBarPair: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },

  groupedBar: {
    width: 36,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  groupedLabelsRow: {
    flexDirection: "row",
    marginTop: 8,
  },

  groupedMonthLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 8,
    fontFamily: "Inter_400Regular",
  },

  groupedTooltip: {
    marginTop: 12,
    alignSelf: "center",
    minWidth: 160,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  tooltipMonth: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },

  tooltipRow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },

  sectionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },

  sectionSubtitle: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginBottom: 12,
  },

  donutRow: {
    alignItems: "center",
    marginVertical: 12,
  },

  emptyDonut: {
    borderWidth: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyDonutText: {
    fontSize: 11,
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

  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 10,
    marginTop: 5,
  },
});
