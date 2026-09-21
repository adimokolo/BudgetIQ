import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import { getDashboard } from "../../services/dashboard";
import { getTransactions } from "../../services/transactions";
import { getCategories } from "../../services/categories";
import { getBudgets } from "../../services/budgets";
import { getCurrentUser } from "../../services/auth";
import { getNotifications } from "../../services/notifications";

import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { getCurrencySymbol } from "../../utils/currency";

const BUDGET_BLUE = "#3B82F6";
const EXPENSE_RED = "#EF4444";

// Shared by the y-axis and the spacer under it, so labels line up
const Y_AXIS_WIDTH = 48;

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

// Short axis numbers so they fit in a half-width card: 1.2K, 45K, 3.4M
function compactNumber(value) {
  const n = Number(value || 0);
  const abs = Math.abs(n);

  const trim = (x) => String(Math.round(x * 10) / 10);

  if (abs >= 1e9) return `${trim(n / 1e9)}B`;
  if (abs >= 1e6) return `${trim(n / 1e6)}M`;
  if (abs >= 1e3) return `${trim(n / 1e3)}K`;
  if (abs >= 100) return String(Math.round(n));

  return trim(n);
}

// Generic two-series grouped bar chart, sized to fit inside a half-width card.
// Used for both "Income vs. spending" and "Budget vs. expense".
function GroupedBarChart({
  labels,
  titles,
  seriesA,
  seriesB,
  nameA,
  nameB,
  colorA,
  colorB,
  colors,
  formatAmount,
  formatAxis,
  chartHeight = 130,
  labelFontSize = 8,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const maxValue = Math.max(1, ...seriesA, ...seriesB);

  const barHeightFor = (value) => {
    const height = (Number(value || 0) / maxValue) * chartHeight;

    return Math.max(value > 0 ? 3 : 0, height);
  };

  const gridColor = colors.divider || colors.cardBorder;

  return (
    <View>
      <View style={styles.groupedChartBody}>
        <View style={styles.groupedYAxis}>
          <Text
            numberOfLines={1}
            style={[styles.groupedYAxisLabel, { color: colors.textFaint }]}
          >
            {formatAxis(maxValue)}
          </Text>

          <Text
            numberOfLines={1}
            style={[styles.groupedYAxisLabel, { color: colors.textFaint }]}
          >
            {formatAxis(maxValue / 2)}
          </Text>

          <Text
            numberOfLines={1}
            style={[styles.groupedYAxisLabel, { color: colors.textFaint }]}
          >
            {formatAxis(0)}
          </Text>
        </View>

        <View style={[styles.groupedBarsArea, { height: chartHeight }]}>
          <View
            style={[
              styles.groupedGridLine,
              { top: 0, backgroundColor: gridColor },
            ]}
          />

          <View
            style={[
              styles.groupedGridLine,
              { top: chartHeight / 2, backgroundColor: gridColor },
            ]}
          />

          <View
            style={[
              styles.groupedGridLine,
              { bottom: 0, backgroundColor: gridColor },
            ]}
          />

          <View style={styles.groupedColumnsRow}>
            {labels.map((label, index) => {
              const isActive = selectedIndex === index;
              const opacity = isActive || selectedIndex === null ? 1 : 0.35;

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
                          height: barHeightFor(seriesA[index]),
                          backgroundColor: colorA,
                          opacity,
                        },
                      ]}
                    />

                    <View
                      style={[
                        styles.groupedBar,
                        {
                          height: barHeightFor(seriesB[index]),
                          backgroundColor: colorB,
                          opacity,
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
            numberOfLines={1}
            style={[
              styles.groupedMonthLabel,
              {
                fontSize: labelFontSize,
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
          <Text style={[styles.tooltipMonth, { color: colors.text }]}>
            {(titles || labels)[selectedIndex]}
          </Text>

          <Text style={[styles.tooltipRow, { color: colorA }]}>
            {nameA}: {formatAmount(seriesA[selectedIndex])}
          </Text>

          <Text style={[styles.tooltipRow, { color: colorB }]}>
            {nameB}: {formatAmount(seriesB[selectedIndex])}
          </Text>
        </View>
      )}
    </View>
  );
}

function fallbackIconFor(type) {
  return type?.toLowerCase() === "income" ? "💵" : "🏷️";
}

const CATEGORY_ICON_MAP = {
  "fast-food-outline": "🍔",
  "restaurant-outline": "🍽️",
  "cafe-outline": "☕",
  "beer-outline": "🍺",
  "cart-outline": "🛒",
  "basket-outline": "🧺",
  "bus-outline": "🚌",
  "car-outline": "🚗",
  "bicycle-outline": "🚲",
  "train-outline": "🚆",
  "airplane-outline": "✈️",
  "home-outline": "🏠",
  "bed-outline": "🛏️",
  "flash-outline": "⚡",
  "water-outline": "💧",
  "wifi-outline": "📶",
  "call-outline": "📞",
  "phone-portrait-outline": "📱",
  "laptop-outline": "💻",
  "medkit-outline": "🩺",
  "fitness-outline": "🏃",
  "barbell-outline": "🏋️",
  "school-outline": "🎓",
  "book-outline": "📚",
  "film-outline": "🎬",
  "musical-notes-outline": "🎵",
  "game-controller-outline": "🎮",
  "gift-outline": "🎁",
  "shirt-outline": "👕",
  "cut-outline": "✂️",
  "paw-outline": "🐾",
  "diamond-outline": "💎",
  "wallet-outline": "👛",
  "card-outline": "💳",
  "cash-outline": "💵",
  "trending-up-outline": "📈",
  "briefcase-outline": "💼",
  "business-outline": "🏢",
  "construct-outline": "🛠️",
  "heart-outline": "❤️",
  "ellipsis-horizontal-outline": "•••",
  "pricetag-outline": "🏷️",
};

function getCategoryIcon(iconName) {
  if (!iconName) return CATEGORY_ICON_MAP["pricetag-outline"];
  const normalizedName = iconName.endsWith("-outline")
    ? iconName
    : `${iconName}-outline`;
  return (
    CATEGORY_ICON_MAP[iconName] ||
    CATEGORY_ICON_MAP[normalizedName] ||
    CATEGORY_ICON_MAP["pricetag-outline"]
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

function formatActivityDate(value) {
  if (!value) return "No date";
  const dateOnly = String(value).slice(0, 10);
  const date = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateOnly;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const router = useRouter();

  const { colors } = useTheme();

  const { formatAmount, baseCurrency, currencyReady, setBaseCurrency } =
    useCurrency();

  const [dashboard, setDashboard] = useState(null);

  const [transactions, setTransactions] = useState([]);

  const [categories, setCategories] = useState([]);

  const [budgets, setBudgets] = useState([]);

  const [userName, setUserName] = useState("User");

  const [avatarUrl, setAvatarUrl] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // FIX: only the very first load shows the full-screen spinner. Without this,
  // every tab switch flashes "Loading dashboard..." over good data.
  const hasLoadedOnce = useRef(false);

  // FIX: loadUser used to depend on `baseCurrency`, which changed its identity
  // every time the currency changed. Since loadUser is a dependency of the
  // effect that calls it, and it calls setBaseCurrency, that is a refetch loop.
  // Reading the current currency from a ref keeps loadUser stable forever.
  const baseCurrencyRef = useRef(baseCurrency);

  useEffect(() => {
    baseCurrencyRef.current = baseCurrency;
  }, [baseCurrency]);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getDashboard();

      console.log("Dashboard API response:", data);

      setDashboard(data);
    } catch (error) {
      console.log("Dashboard error:", error);

      Alert.alert("Error", error?.message || "Unable to load dashboard.");
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

  const loadBudgets = useCallback(async () => {
    try {
      const data = await getBudgets();

      const list = Array.isArray(data)
        ? data
        : data?.budgets || data?.data || [];

      setBudgets(list);
    } catch (error) {
      console.log("Dashboard budgets error:", error);
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

      const profileCurrency =
        profile?.currency ||
        profile?.base_currency ||
        profile?.baseCurrency ||
        null;

      if (profileCurrency) {
        const normalizedCurrency = String(profileCurrency).toUpperCase();

        console.log("USER PROFILE CURRENCY:", normalizedCurrency);

        if (normalizedCurrency !== baseCurrencyRef.current) {
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
    // setBaseCurrency is intentionally left out: if it is not memoised in
    // CurrencyContext, including it here re-creates loadUser on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = useCallback(
    () =>
      Promise.all([
        loadDashboard(),
        loadTransactions(),
        loadCategories(),
        loadBudgets(),
        loadUser(),
        loadNotificationCount(),
      ]),
    [
      loadDashboard,
      loadTransactions,
      loadCategories,
      loadBudgets,
      loadUser,
      loadNotificationCount,
    ],
  );

  // FIX: this screen stays mounted in the tab navigator, so a mount-only
  // useEffect meant the dashboard never saw transactions, budgets or
  // categories created on the other tabs. useFocusEffect refetches every
  // time the tab comes back into view.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        if (!hasLoadedOnce.current) {
          setLoading(true);
        }

        try {
          await loadAll();
        } finally {
          if (active) {
            hasLoadedOnce.current = true;
            setLoading(false);
          }
        }
      };

      run();

      return () => {
        active = false;
      };
    }, [loadAll]),
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

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

  const recentActivity = [...transactions]
    .sort((a, b) => {
      const aDate = a.occurred_on || a.occurredOn || "";
      const bDate = b.occurred_on || b.occurredOn || "";
      return (
        bDate.localeCompare(aDate) || Number(b.id || 0) - Number(a.id || 0)
      );
    })
    .slice(0, 4)
    .map((transaction) => {
      const matchedCategory = categoryById.get(transaction.category_id);
      const type = String(transaction.type || "expense").toLowerCase();

      return {
        ...transaction,
        displayName:
          transaction.category_name ||
          matchedCategory?.name ||
          transaction.description ||
          "Uncategorized",
        displayColor:
          transaction.category_color ||
          matchedCategory?.color ||
          (type === "income" ? colors.income : colors.expense),
        displayIcon:
          transaction.category_icon ||
          matchedCategory?.icon ||
          fallbackIconFor(type),
        displayDate: formatActivityDate(
          transaction.occurred_on || transaction.occurredOn,
        ),
        isIncome: type === "income",
      };
    });

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

  // Budget vs. expense: total of all monthly budget limits, compared with
  // total spending for each of the same months shown in the trend chart.
  const totalBudget = budgets.reduce(
    (sum, budget) => sum + Number(budget.monthly_limit || 0),
    0,
  );

  const budgetData = chartLabels.map(() => totalBudget);

  const currencySymbol = getCurrencySymbol(baseCurrency);

  const formatAxis = (value) => `${currencySymbol}${compactNumber(value)}`;

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

        <View style={styles.chartsRow}>
          <View
            style={[
              styles.sectionCard,
              styles.halfCard,
              {
                backgroundColor: colors.card,

                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Income vs. Expense
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
                  styles.barLegendDotSecond,
                  {
                    backgroundColor: colors.expense,
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
                Expense
              </Text>
            </View>

            <GroupedBarChart
              labels={chartLabels}
              seriesA={incomeData}
              seriesB={expenseData}
              nameA="Income"
              nameB="Expense"
              colorA={colors.income}
              colorB={colors.expense}
              colors={colors}
              formatAmount={formatAmount}
              formatAxis={formatAxis}
            />
          </View>

          <View
            style={[
              styles.sectionCard,
              styles.halfCard,
              {
                backgroundColor: colors.card,

                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Budget vs. Expense
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
                style={[styles.barLegendDot, { backgroundColor: BUDGET_BLUE }]}
              />

              <Text
                style={[
                  styles.barChartLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Budget
              </Text>

              <View
                style={[
                  styles.barLegendDot,
                  styles.barLegendDotSecond,
                  { backgroundColor: EXPENSE_RED },
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
                Expense
              </Text>
            </View>

            {totalBudget > 0 ? (
              <GroupedBarChart
                labels={chartLabels}
                seriesA={budgetData}
                seriesB={expenseData}
                nameA="Budget"
                nameB="Expense"
                colorA={BUDGET_BLUE}
                colorB={EXPENSE_RED}
                colors={colors}
                formatAmount={formatAmount}
                formatAxis={formatAxis}
              />
            ) : (
              <View style={styles.emptyChartBox}>
                <Text
                  style={[
                    styles.noDataText,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  No budgets set yet.
                </Text>

                <TouchableOpacity
                  onPress={() => router.push("/budgets")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.emptyChartLink,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    Set a budget
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
                      <Text style={styles.categoryEmoji}>
                        {getCategoryIcon(
                          segment.icon || fallbackIconFor("expense"),
                        )}
                      </Text>
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

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent activity
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textFaint }]}>
            Your last few transactions
          </Text>

          {recentActivity.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivity.map((transaction, index) => (
                <View
                  key={transaction.id ?? `${transaction.displayName}-${index}`}
                  style={[
                    styles.activityRow,
                    index > 0 && { borderTopColor: colors.cardBorder },
                    index > 0 && styles.activityRowBorder,
                  ]}
                >
                  <View style={styles.activityLeft}>
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: transaction.displayColor },
                      ]}
                    >
                      <Text style={styles.activityEmoji}>
                        {getCategoryIcon(transaction.displayIcon)}
                      </Text>
                    </View>

                    <View style={styles.activityDetails}>
                      <Text
                        numberOfLines={1}
                        style={[styles.activityName, { color: colors.text }]}
                      >
                        {transaction.displayName}
                      </Text>
                      <Text
                        style={[
                          styles.activityDate,
                          { color: colors.textFaint },
                        ]}
                      >
                        {transaction.displayDate}
                      </Text>
                    </View>
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.activityAmount,
                      {
                        color: transaction.isIncome
                          ? colors.income
                          : colors.expense,
                      },
                    ]}
                  >
                    {transaction.isIncome ? "+" : "-"}
                    {formatAmount(Math.abs(Number(transaction.amount || 0)))}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noDataText, { color: colors.textFaint }]}>
              No recent transactions yet.
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

  // Row that holds the two half-width chart cards
  chartsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 10,
  },

  halfCard: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    marginBottom: 0,
  },

  barChartHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
  },

  barLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 3,
  },

  barLegendDotSecond: {
    marginLeft: 6,
  },

  barChartLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },

  groupedChartBody: {
    flexDirection: "row",
    marginTop: 4,
  },

  groupedYAxis: {
    width: Y_AXIS_WIDTH,
    justifyContent: "space-between",
    paddingRight: 4,
  },

  groupedYAxisSpacer: {
    width: Y_AXIS_WIDTH,
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
  },

  groupedColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },

  // Bars share the column width, so any number of columns fits
  groupedBarPair: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: 1,
  },

  groupedBar: {
    flex: 1,
    maxWidth: 14,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  groupedLabelsRow: {
    flexDirection: "row",
    marginTop: 8,
  },

  groupedMonthLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },

  groupedTooltip: {
    marginTop: 10,
    alignSelf: "stretch",
    padding: 8,
    borderRadius: 10,
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

  emptyChartBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },

  emptyChartLink: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryEmoji: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
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

  activityList: {
    marginTop: 2,
  },

  activityRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },

  activityRowBorder: {
    borderTopWidth: 1,
  },

  activityLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  activityIcon: {
    width: 29,
    height: 29,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  activityEmoji: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
  },

  activityDetails: {
    flex: 1,
    minWidth: 0,
  },

  activityName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  activityDate: {
    marginTop: 2,
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },

  activityAmount: {
    maxWidth: "46%",
    textAlign: "right",
    fontSize: 11,
    fontFamily: "JetBrainsMono_500Medium",
  },
});
