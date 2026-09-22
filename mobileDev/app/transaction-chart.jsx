import React, { useCallback, useMemo, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter, useFocusEffect } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import DateTimePicker from "@react-native-community/datetimepicker";

import Svg, { Circle } from "react-native-svg";

import { getTransactions } from "../services/transactions";
import { getCategories } from "../services/categories";

import { useTheme } from "../contexts/ThemeContext";
import { useCurrency } from "../contexts/CurrencyContext";

import { formatCurrency, currencySymbolFor } from "../utils/currency";
import { getCategoryIcon, fallbackIconFor } from "../utils/categoryIcons";

const fonts = {
  displayRegular: "SpaceGrotesk_400Regular",
  displayMedium: "SpaceGrotesk_500Medium",
  displaySemiBold: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold",

  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",

  monoRegular: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
};

const TYPE_TABS = ["Expenses", "Income"];

const FALLBACK_COLORS = [
  "#174E78",
  "#2DD4BF",
  "#7C6FF0",
  "#cc4b8e",
  "#FBBF24",
  "#16A34A",
  "#F97316",
  "#3B82F6",
];

const OTHER_COLOR = "#94A3B8";

const MAX_LEGEND_ITEMS = 4;

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key, currentKey, previousKey) {
  if (key === currentKey) return "This Month";
  if (key === previousKey) return "Last Month";

  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatPickerDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatRangeLabel(from, to) {
  const short = { month: "short", day: "numeric" };
  const full = { month: "short", day: "numeric", year: "numeric" };

  if (from.getFullYear() === to.getFullYear()) {
    return `${from.toLocaleDateString("en-US", short)} – ${to.toLocaleDateString("en-US", full)}`;
  }

  return `${from.toLocaleDateString("en-US", full)} – ${to.toLocaleDateString("en-US", full)}`;
}

function trimNumber(value) {
  return String(parseFloat(value.toFixed(2)));
}

function formatCompactCurrency(amount, currency) {
  const symbol = currencySymbolFor(currency);
  const abs = Math.abs(Number(amount || 0));

  if (abs >= 1e9) return `${symbol}${trimNumber(abs / 1e9)}B`;
  if (abs >= 1e6) return `${symbol}${trimNumber(abs / 1e6)}M`;
  if (abs >= 1e5) return `${symbol}${trimNumber(abs / 1e3)}K`;

  return formatCurrency(abs, currency);
}

function DonutChart({
  data,
  total,
  size = 156,
  strokeWidth = 22,
  trackColor,
  children,
}) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = data.length > 1 ? 3 : 0;

  let offset = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {total > 0 &&
          data.map((segment) => {
            const length = (segment.amount / total) * circumference;
            const dash = Math.max(length - gap, 0.5);

            const circle = (
              <Circle
                key={segment.key}
                cx={center}
                cy={center}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                rotation={-90}
                origin={`${center}, ${center}`}
              />
            );

            offset += length;

            return circle;
          })}
      </Svg>

      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, chartCenterStyle]}
      >
        {children}
      </View>
    </View>
  );
}

const chartCenterStyle = {
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 30,
};

export default function TransactionChart() {
  const router = useRouter();

  const { colors } = useTheme();

  const { baseCurrency: currency } = useCurrency();

  const styles = createStyles(colors);

  const now = useMemo(() => new Date(), []);
  const currentKey = getMonthKey(now);
  const previousKey = getMonthKey(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );

  const hasLoadedOnce = useRef(false);
  const periodScrollRef = useRef(null);
  const didAutoScroll = useRef(false);

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeType, setActiveType] = useState("Expenses");
  const [selectedMonth, setSelectedMonth] = useState(currentKey);

  const [customRange, setCustomRange] = useState(null);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [transactionData, categoryData] = await Promise.all([
        getTransactions(),
        getCategories().catch((error) => {
          console.log("Get categories error:", error);
          return { categories: [] };
        }),
      ]);

      setTransactions(transactionData?.transactions || []);
      setCategories(categoryData?.categories || []);
    } catch (error) {
      console.log("Chart load error:", error);

      Alert.alert("Error", error.message || "Unable to load chart data.");
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(!hasLoadedOnce.current);
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  const openRangeModal = () => {
    setDraftFrom(customRange?.from || null);
    setDraftTo(customRange?.to || null);
    setShowFromPicker(false);
    setShowToPicker(false);
    setShowRangeModal(true);
  };

  const closeRangeModal = () => {
    setShowRangeModal(false);
    setShowFromPicker(false);
    setShowToPicker(false);
  };

  const clearCustomRange = () => {
    setCustomRange(null);
    setDraftFrom(null);
    setDraftTo(null);
  };

  const applyRange = () => {
    if (!draftFrom || !draftTo) {
      Alert.alert(
        "Select date range",
        "Please select both the From and To dates.",
      );
      return;
    }

    const fromKey = getLocalDateString(draftFrom);
    const toKey = getLocalDateString(draftTo);

    if (fromKey > toKey) {
      Alert.alert(
        "Invalid date range",
        "The From date cannot be later than the To date.",
      );
      return;
    }

    setCustomRange({ from: draftFrom, to: draftTo, fromKey, toKey });
    closeRangeModal();

    setTimeout(() => {
      periodScrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  const handleClearFromModal = () => {
    clearCustomRange();
    closeRangeModal();
  };

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const periodTabs = useMemo(() => {
    const keys = new Set([currentKey, previousKey]);

    for (const transaction of transactions) {
      if (transaction.occurred_on) {
        keys.add(String(transaction.occurred_on).slice(0, 7));
      }
    }

    return Array.from(keys)
      .sort()
      .map((key) => ({
        key,
        label: getMonthLabel(key, currentKey, previousKey),
      }));
  }, [transactions, currentKey, previousKey]);

  const isIncome = activeType === "Income";

  const { items, legend, total } = useMemo(() => {
    const wantedType = isIncome ? "income" : "expense";
    const grouped = new Map();

    for (const transaction of transactions) {
      if (transaction.type !== wantedType || !transaction.occurred_on) {
        continue;
      }

      const dateKey = String(transaction.occurred_on).slice(0, 10);

      if (customRange) {
        if (dateKey < customRange.fromKey || dateKey > customRange.toKey) {
          continue;
        }
      } else if (dateKey.slice(0, 7) !== selectedMonth) {
        continue;
      }

      const groupKey = String(
        transaction.category_id ?? transaction.category_name ?? "uncategorized",
      );

      const matchedCategory = categoryById.get(transaction.category_id);

      const existing = grouped.get(groupKey);
      const amount = Number(transaction.amount || 0);

      if (existing) {
        existing.amount += amount;
      } else {
        grouped.set(groupKey, {
          key: groupKey,
          name: transaction.category_name || "Uncategorized",
          icon:
            matchedCategory?.icon ||
            transaction.category_icon ||
            fallbackIconFor(wantedType),
          color: matchedCategory?.color || transaction.category_color || null,
          amount,
        });
      }
    }

    const sorted = Array.from(grouped.values())
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const sum = sorted.reduce((acc, item) => acc + item.amount, 0);

    const withMeta = sorted.map((item, index) => ({
      ...item,
      color: item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      percent: sum > 0 ? (item.amount / sum) * 100 : 0,
    }));

    let legendItems = withMeta;

    if (withMeta.length > MAX_LEGEND_ITEMS + 1) {
      const top = withMeta.slice(0, MAX_LEGEND_ITEMS);
      const rest = withMeta.slice(MAX_LEGEND_ITEMS);
      const restAmount = rest.reduce((acc, item) => acc + item.amount, 0);

      legendItems = [
        ...top,
        {
          key: "other",
          name: "Other",
          color: OTHER_COLOR,
          amount: restAmount,
          percent: sum > 0 ? (restAmount / sum) * 100 : 0,
        },
      ];
    }

    return { items: withMeta, legend: legendItems, total: sum };
  }, [transactions, categoryById, isIncome, selectedMonth, customRange]);

  const maxAmount = items.length > 0 ? items[0].amount : 0;

  const typeLabel = isIncome ? "income" : "expenses";

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

        <Text style={styles.headerTitle}>Charts</Text>

        <TouchableOpacity
          style={[
            styles.calendarButton,
            customRange && styles.calendarButtonActive,
          ]}
          onPress={openRangeModal}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Pick a date range"
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={customRange ? colors.primaryText : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        <View style={styles.topRow}>
          <View style={styles.typeToggle}>
            {TYPE_TABS.map((tab) => {
              const isActive = activeType === tab;

              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.typeToggleItem,
                    isActive && styles.typeToggleItemActive,
                  ]}
                  onPress={() => setActiveType(tab)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeToggleText,
                      isActive && styles.typeToggleTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.periodWrap}>
          <ScrollView
            ref={periodScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodContent}
            onContentSizeChange={() => {
              if (!didAutoScroll.current) {
                didAutoScroll.current = true;
                periodScrollRef.current?.scrollToEnd({ animated: false });
              }
            }}
          >
            {periodTabs.map((tab) => {
              const isActive = !customRange && selectedMonth === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.periodTab, isActive && styles.periodTabActive]}
                  onPress={() => {
                    setCustomRange(null);
                    setSelectedMonth(tab.key);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      isActive && styles.periodTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {customRange && (
              <View style={[styles.periodTab, styles.periodTabActive]}>
                <TouchableOpacity
                  style={styles.customTabInner}
                  onPress={openRangeModal}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.periodTabText, styles.periodTabTextActive]}
                  >
                    {formatRangeLabel(customRange.from, customRange.to)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={clearCustomRange}
                  hitSlop={8}
                  style={styles.customTabClose}
                  accessibilityRole="button"
                  accessibilityLabel="Clear date range"
                >
                  <Ionicons
                    name="close-circle"
                    size={15}
                    color={colors.textFaint}
                  />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />

            <Text style={styles.loadingText}>Loading chart...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="pie-chart-outline"
                size={26}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>No {typeLabel} to show</Text>

            <Text style={styles.emptyText}>
              There are no {typeLabel} recorded for this period.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.chartCard}>
              <View style={styles.chartRow}>
                <DonutChart
                  data={legend}
                  total={total}
                  trackColor={colors.chipBg}
                >
                  <Text style={styles.donutLabel}>
                    Total {isIncome ? "income" : "expenses"}
                  </Text>

                  <Text
                    style={[
                      styles.donutAmount,
                      { color: isIncome ? colors.income : colors.expense },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {isIncome ? "+" : "-"}
                    {formatCompactCurrency(total, currency)}
                  </Text>
                </DonutChart>

                <View style={styles.legend}>
                  {legend.map((item) => (
                    <View key={item.key} style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: item.color },
                        ]}
                      />

                      <Text style={styles.legendName} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <Text style={styles.legendPercent}>
                        {item.percent.toFixed(2)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.listCard}>
              {items.map((item, index) => (
                <View
                  key={item.key}
                  style={[
                    styles.categoryRow,
                    index === items.length - 1 && styles.categoryRowLast,
                  ]}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <Text style={styles.categoryEmoji}>
                      {getCategoryIcon(item.icon)}
                    </Text>
                  </View>

                  <View style={styles.categoryBody}>
                    <View style={styles.categoryTopRow}>
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <Text style={styles.categoryAmount}>
                        {formatCurrency(item.amount, currency)}
                      </Text>
                    </View>

                    <View style={styles.barRow}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.max(
                                maxAmount > 0
                                  ? (item.amount / maxAmount) * 100
                                  : 0,
                                2,
                              )}%`,
                              backgroundColor: item.color,
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.barPercent}>
                        {item.percent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showRangeModal}
        transparent
        animationType="fade"
        onRequestClose={closeRangeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rangeModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select date range</Text>
                <Text style={styles.rangeModalSubtitle}>
                  Choose the period you want to see in the chart.
                </Text>
              </View>

              <Pressable onPress={closeRangeModal} hitSlop={10}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            <View style={styles.rangeDateRow}>
              <View style={styles.rangeDateColumn}>
                <Text style={styles.inputLabel}>From</Text>

                <Pressable
                  style={styles.rangeDateField}
                  onPress={() => {
                    setShowToPicker(false);
                    setShowFromPicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.rangeDateText,
                      !draftFrom && { color: colors.textFaint },
                    ]}
                  >
                    {draftFrom ? formatPickerDate(draftFrom) : "mm/dd/yyyy"}
                  </Text>

                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View style={styles.rangeDateColumn}>
                <Text style={styles.inputLabel}>To</Text>

                <Pressable
                  style={styles.rangeDateField}
                  onPress={() => {
                    setShowFromPicker(false);
                    setShowToPicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.rangeDateText,
                      !draftTo && { color: colors.textFaint },
                    ]}
                  >
                    {draftTo ? formatPickerDate(draftTo) : "mm/dd/yyyy"}
                  </Text>

                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.text}
                  />
                </Pressable>
              </View>
            </View>

            {showFromPicker && (
              <DateTimePicker
                value={draftFrom || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={draftTo || undefined}
                onDismiss={() => setShowFromPicker(false)}
                onValueChange={(event, selected) => {
                  setShowFromPicker(Platform.OS === "ios");

                  if (selected) {
                    setDraftFrom(selected);
                  }
                }}
              />
            )}

            {showToPicker && (
              <DateTimePicker
                value={draftTo || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={draftFrom || undefined}
                onDismiss={() => setShowToPicker(false)}
                onValueChange={(event, selected) => {
                  setShowToPicker(Platform.OS === "ios");

                  if (selected) {
                    setDraftTo(selected);
                  }
                }}
              />
            )}

            <View style={styles.rangeModalActions}>
              <Pressable
                style={styles.rangeClearButton}
                onPress={handleClearFromModal}
              >
                <Text style={styles.rangeClearButtonText}>
                  {customRange ? "Clear" : "Cancel"}
                </Text>
              </Pressable>

              <Pressable style={styles.rangeApplyButton} onPress={applyRange}>
                <Text style={styles.rangeApplyButtonText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
      fontFamily: fonts.displayBold,
      color: colors.text,
    },

    container: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },

    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    calendarButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    calendarButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    typeToggle: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: 3,
    },

    typeToggleItem: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    typeToggleItemActive: {
      backgroundColor: colors.primary,
    },

    typeToggleText: {
      fontSize: 11,
      fontFamily: fonts.bodySemiBold,
      color: colors.textMuted,
    },

    typeToggleTextActive: {
      color: colors.primaryText,
    },

    periodWrap: {
      marginTop: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },

    periodContent: {
      paddingRight: 6,
    },

    periodTab: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },

    periodTabActive: {
      borderBottomColor: colors.primary,
    },

    periodTabText: {
      fontSize: 11,
      fontFamily: fonts.bodyMedium,
      color: colors.textFaint,
    },

    periodTabTextActive: {
      fontFamily: fonts.bodySemiBold,
      color: colors.text,
    },

    customTabInner: {
      justifyContent: "center",
    },

    customTabClose: {
      marginLeft: 6,
    },

    loadingState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 100,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 13,
      fontFamily: fonts.bodyRegular,
      color: colors.textMuted,
    },

    emptyCard: {
      marginTop: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 50,
      paddingHorizontal: 24,
    },

    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.chipBg,
      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 13,
      fontFamily: fonts.bodySemiBold,
      color: colors.text,
      marginBottom: 6,
    },

    emptyText: {
      fontSize: 11,
      fontFamily: fonts.bodyRegular,
      color: colors.textFaint,
      textAlign: "center",
    },

    chartCard: {
      marginTop: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
    },

    chartRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },

    donutLabel: {
      fontSize: 8,
      fontFamily: fonts.bodyMedium,
      color: colors.textFaint,
      marginBottom: 3,
      textAlign: "center",
    },

    donutAmount: {
      fontSize: 13,
      fontFamily: fonts.monoMedium,
      textAlign: "center",
    },

    legend: {
      flex: 1,
      gap: 12,
    },

    legendRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    legendDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      marginRight: 8,
    },

    legendName: {
      flex: 1,
      fontSize: 11,
      fontFamily: fonts.bodyMedium,
      color: colors.text,
      marginRight: 6,
    },

    legendPercent: {
      fontSize: 10,
      fontFamily: fonts.monoMedium,
      color: colors.textMuted,
    },

    listCard: {
      marginTop: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },

    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },

    categoryRowLast: {
      borderBottomWidth: 0,
    },

    categoryIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    categoryEmoji: {
      fontSize: 16,
      lineHeight: 21,
      textAlign: "center",
    },

    categoryBody: {
      flex: 1,
      minWidth: 0,
    },

    categoryTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    categoryName: {
      flex: 1,
      fontSize: 12,
      fontFamily: fonts.bodySemiBold,
      color: colors.text,
      marginRight: 10,
    },

    categoryAmount: {
      fontSize: 12,
      fontFamily: fonts.monoMedium,
      color: colors.text,
    },

    barRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },

    barTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.chipBg,
      overflow: "hidden",
    },

    barFill: {
      height: 6,
      borderRadius: 3,
    },

    barPercent: {
      width: 52,
      textAlign: "right",
      fontSize: 9,
      fontFamily: fonts.monoMedium,
      color: colors.textFaint,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },

    rangeModalCard: {
      width: "100%",
      maxWidth: 620,
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 20,
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },

    modalTitle: {
      fontSize: 13,
      fontFamily: fonts.displayBold,
      color: colors.text,
    },

    rangeModalSubtitle: {
      fontSize: 11,
      fontFamily: fonts.bodyRegular,
      color: colors.textMuted,
      marginTop: 4,
    },

    closeButton: {
      fontSize: 17,
      color: colors.textFaint,
      fontFamily: fonts.bodySemiBold,
    },

    inputLabel: {
      fontSize: 10,
      fontFamily: fonts.bodySemiBold,
      color: colors.text,
      marginBottom: 6,
      marginTop: 12,
    },

    rangeDateRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 4,
    },

    rangeDateColumn: {
      flex: 1,
    },

    rangeDateField: {
      minHeight: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBg,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    rangeDateText: {
      flex: 1,
      fontSize: 12,
      fontFamily: fonts.bodyMedium,
      color: colors.text,
      marginRight: 8,
    },

    rangeModalActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 22,
    },

    rangeClearButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },

    rangeClearButtonText: {
      fontSize: 12,
      fontFamily: fonts.bodySemiBold,
      color: colors.text,
    },

    rangeApplyButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    rangeApplyButtonText: {
      fontSize: 12,
      fontFamily: fonts.bodySemiBold,
      color: colors.primaryText,
    },
  });
