import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
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
import { getSavedUser } from "../../services/auth";

const screenWidth = Dimensions.get("window").width;

function StatCard({ label, value, valueColor, badge, footer }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>

      <Text style={[styles.cardValue, { color: valueColor || "#111827" }]}>
        {value}
      </Text>

      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      {footer && <Text style={styles.cardFooter}>{footer}</Text>}
    </View>
  );
}

function Donut({ segments, size = 160, strokeWidth = 24 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce((sum, s) => sum + Number(s.total || 0), 0);

  if (!total) {
    return (
      <View
        style={[
          styles.emptyDonut,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={styles.emptyDonutText}>No data</Text>
      </View>
    );
  }

  let offsetAccumulator = 0;

  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => {
        const value = Number(seg.total || 0);

        if (value <= 0) return null;

        const fraction = value / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;

        const rotation = (offsetAccumulator / total) * 360 - 90;

        offsetAccumulator += value;

        return (
          <Circle
            key={seg.category_id ?? i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={seg.color || "#9CA3AF"}
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

// Converts a "YYYY-MM" month key into a short label like "Aug"
function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short" });
}

export default function Dashboard() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getDashboard();

      console.log("Dashboard API response:", data);

      setDashboard(data);
    } catch (error) {
      console.log("Dashboard error:", error);
      Alert.alert("Error", error.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    // Full name comes from the saved auth user, not the dashboard payload
    getSavedUser().then((user) => {
      if (user?.full_name) setUserName(user.full_name.split(" ")[0]);
    });
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const formatCurrency = (amount) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#174E78" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Maps exactly to getSummary()'s response shape:
  // { summary, monthlyTrend, categoryBreakdown, recentTransactions, forecast }
  const summary = dashboard?.summary || {};
  const monthlyTrend = dashboard?.monthlyTrend || [];
  const categoryBreakdown = dashboard?.categoryBreakdown || [];
  const forecastData = dashboard?.forecast || {};

  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const netBalance = summary.netBalance ?? totalIncome - totalExpense;
  const savingsRate = summary.savingsRate ?? 0;

  const forecast = forecastData.nextMonthPredictedExpense || 0;
  const forecastTrend = forecastData.trend; // e.g. "up" | "down" | "flat"
  const forecastConfidence = forecastData.confidence;

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
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={32} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.heading}>Good to see you, {userName}</Text>

            <Text style={styles.subheading}>
              Here's the clearest picture of your money this month.
            </Text>
          </View>
        </View>

        {/* STAT CARDS */}
        <View style={styles.cardsWrap}>
          <StatCard
            label="TOTAL INCOME (MONTH)"
            value={formatCurrency(totalIncome)}
            valueColor="#16A34A"
          />

          <StatCard
            label="TOTAL EXPENSE (MONTH)"
            value={formatCurrency(totalExpense)}
            valueColor="#EC4899"
          />

          <StatCard
            label="NET BALANCE"
            value={formatCurrency(netBalance)}
            badge={`${savingsRate}% savings rate`}
          />

          <StatCard
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
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Income vs. spending</Text>
          <Text style={styles.sectionSubtitle}>Last six months</Text>

          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                { data: incomeData, color: () => "#2DD4BF", strokeWidth: 2 },
                { data: expenseData, color: () => "#EC4899", strokeWidth: 2 },
              ],
            }}
            width={screenWidth - 72}
            height={220}
            withInnerLines={false}
            withOuterLines={false}
            bezier
            chartConfig={{
              backgroundGradientFrom: "#FFFFFF",
              backgroundGradientTo: "#FFFFFF",
              decimalPlaces: 0,
              color: () => "#9CA3AF",
              labelColor: () => "#9CA3AF",
              propsForDots: { r: "3" },
            }}
            style={{ marginLeft: -16 }}
          />
        </View>

        {/* WHERE IT WENT */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Where it went</Text>
          <Text style={styles.sectionSubtitle}>
            This month's spending by category
          </Text>

          <View style={styles.donutRow}>
            <Donut segments={categoryBreakdown} />
          </View>

          {categoryBreakdown.length > 0 ? (
            <View style={styles.legend}>
              {categoryBreakdown.map((seg) => (
                <View key={seg.category_id} style={styles.legendRow}>
                  <View style={styles.legendLeft}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: seg.color || "#9CA3AF" },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      {seg.name || "Category"}
                    </Text>
                  </View>

                  <Text style={styles.legendValue}>
                    {formatCurrency(seg.total)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>
              No spending data available yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  heading: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subheading: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 20,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerText: { flex: 1 },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#111827",
  },
  cardsWrap: { gap: 12, marginBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardValue: { fontSize: 22, fontWeight: "800" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  cardFooter: { fontSize: 11, color: "#9CA3AF", marginTop: 8, lineHeight: 16 },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    marginBottom: 12,
  },
  donutRow: { alignItems: "center", marginVertical: 12 },
  emptyDonut: {
    borderWidth: 20,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDonutText: { fontSize: 13, color: "#9CA3AF" },
  legend: { marginTop: 12, gap: 10 },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, color: "#374151" },
  legendValue: { fontSize: 13, fontWeight: "700", color: "#111827" },
  noDataText: { textAlign: "center", color: "#9CA3AF", marginVertical: 20 },
});
