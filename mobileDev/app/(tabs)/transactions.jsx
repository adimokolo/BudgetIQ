import React, { useState, useEffect, useCallback, useMemo } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import DateTimePicker from "@react-native-community/datetimepicker";

import { useFonts } from "expo-font";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

import {
  getTransactions,
  createTransaction,
  deleteTransaction as deleteTransactionApi,
} from "../../services/transactions";

import { getCategories } from "../../services/categories";

import { getCurrentUser } from "../../services/auth";

import {
  exportTransactionsToCsv,
  exportTransactionsToPdf,
} from "../../services/exportTransactions";

import { useTheme } from "../../contexts/ThemeContext";
import { formatCurrency } from "../../utils/currency";

const TYPES = ["Expense", "Income"];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

function Dropdown({ label, value, options, onSelect, placeholder, styles }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>

      <Pressable style={styles.dropdownField} onPress={() => setOpen(true)}>
        <Text
          style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}
        >
          {value ? value : placeholder || "Select..."}
        </Text>

        <Text style={styles.dropdownArrow}>⌄</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            {options.length > 0 ? (
              options.map((opt) => (
                <Pressable
                  key={opt.id ?? opt}
                  style={styles.dropdownOption}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      (opt.id ?? opt) === (value?.id ?? value) &&
                        styles.dropdownOptionTextActive,
                    ]}
                  >
                    {opt.name ?? opt}
                  </Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.dropdownOption}>
                <Text style={styles.dropdownOptionText}>No categories yet</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| CALCULATOR MODAL
|--------------------------------------------------------------------------
|
| A simple popup calculator: + - × ÷, clear, backspace, decimal, equals.
| Pressing "✓" finalizes any pending operation and sends the result to
| the parent via onApply, which fills the amount input automatically.
|
*/

function CalculatorModal({ visible, onClose, onApply, colors, styles }) {
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const resetCalculator = () => {
    setDisplay("0");
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  useEffect(() => {
    if (visible) {
      resetCalculator();
    }
  }, [visible]);

  const compute = (a, b, op) => {
    switch (op) {
      case "+":
        return a + b;

      case "−":
        return a - b;

      case "×":
        return a * b;

      case "÷":
        return b === 0 ? NaN : a / b;

      default:
        return b;
    }
  };

  const formatResult = (value) => {
    if (!Number.isFinite(value)) {
      return "Error";
    }

    return String(parseFloat(value.toFixed(8)));
  };

  const inputDigit = (digit) => {
    if (display === "Error") {
      setDisplay(digit);
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      return;
    }

    setDisplay(display === "0" ? digit : display + digit);
  };

  const inputDot = () => {
    if (display === "Error") {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }

    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleBackspace = () => {
    if (waitingForOperand || display === "Error") {
      return;
    }

    const next = display.length > 1 ? display.slice(0, -1) : "0";

    setDisplay(next === "-" || next === "" ? "0" : next);
  };

  const handleOperator = (nextOperator) => {
    const inputValue = parseFloat(display);

    if (display === "Error" || Number.isNaN(inputValue)) {
      return;
    }

    if (accumulator === null) {
      setAccumulator(inputValue);
    } else if (operator && !waitingForOperand) {
      const result = compute(accumulator, inputValue, operator);

      setAccumulator(result);
      setDisplay(formatResult(result));
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (accumulator === null || operator === null) {
      return;
    }

    const inputValue = parseFloat(display);

    const result = compute(accumulator, inputValue, operator);

    setDisplay(formatResult(result));
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleApply = () => {
    let finalValue = display;

    /*
     * Finalize any pending operation.
     * Example: 5 + 3 then ✓ without pressing =
     */
    if (accumulator !== null && operator !== null && !waitingForOperand) {
      const result = compute(accumulator, parseFloat(display), operator);

      finalValue = formatResult(result);
    }

    if (finalValue !== "Error" && finalValue !== "") {
      onApply(finalValue);
    }

    onClose();
  };

  const renderKey = (label, onPress, keyStyle, textStyle) => (
    <Pressable
      style={[styles.calcKey, keyStyle]}
      onPress={onPress}
      android_ripple={{ color: colors.divider }}
    >
      <Text style={[styles.calcKeyText, textStyle]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.calcModalOverlay}>
        <View
          style={[
            styles.calcCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* CALCULATOR HEADER */}

          <View style={styles.calcHeader}>
            <View style={styles.calcHeaderTitle}>
              <Text style={styles.calcHeaderIcon}>🔢</Text>

              <Text
                style={[
                  styles.calcTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Calc
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.calcCloseButton}
            >
              <Text
                style={[
                  styles.calcCloseText,
                  {
                    color: colors.textFaint,
                  },
                ]}
              >
                ×
              </Text>
            </Pressable>
          </View>

          {/* DISPLAY */}

          <View
            style={[
              styles.calcDisplay,
              {
                backgroundColor: colors.background,
                borderColor: colors.inputBorder,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.calcDisplayText,
                {
                  color: colors.text,
                },
              ]}
            >
              {display}
            </Text>

            {operator && (
              <Text
                style={[
                  styles.calcOperatorIndicator,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {operator}
              </Text>
            )}
          </View>

          {/* KEYPAD */}

          <View style={styles.calcRow}>
            {renderKey(
              "C",
              resetCalculator,
              {
                backgroundColor: colors.expenseBg,
              },
              {
                color: colors.expense,
              },
            )}

            {renderKey(
              "⌫",
              handleBackspace,
              {
                backgroundColor: colors.chipBg,
              },
              {
                color: colors.text,
              },
            )}

            {renderKey(
              "÷",
              () => handleOperator("÷"),
              {
                backgroundColor: colors.chipBg,
              },
              {
                color: colors.primary,
              },
            )}

            {renderKey(
              "×",
              () => handleOperator("×"),
              {
                backgroundColor: colors.chipBg,
              },
              {
                color: colors.primary,
              },
            )}
          </View>

          <View style={styles.calcRow}>
            {renderKey("7", () => inputDigit("7"))}

            {renderKey("8", () => inputDigit("8"))}

            {renderKey("9", () => inputDigit("9"))}

            {renderKey(
              "−",
              () => handleOperator("−"),
              {
                backgroundColor: colors.chipBg,
              },
              {
                color: colors.primary,
              },
            )}
          </View>

          <View style={styles.calcRow}>
            {renderKey("4", () => inputDigit("4"))}

            {renderKey("5", () => inputDigit("5"))}

            {renderKey("6", () => inputDigit("6"))}

            {renderKey(
              "+",
              () => handleOperator("+"),
              {
                backgroundColor: colors.chipBg,
              },
              {
                color: colors.primary,
              },
            )}
          </View>

          <View style={styles.calcRow}>
            {renderKey("1", () => inputDigit("1"))}

            {renderKey("2", () => inputDigit("2"))}

            {renderKey("3", () => inputDigit("3"))}

            {renderKey(
              "=",
              handleEquals,
              {
                backgroundColor: colors.primary,
              },
              {
                color: colors.primaryText,
              },
            )}
          </View>

          <View style={styles.calcRow}>
            {renderKey("0", () => inputDigit("0"), styles.calcKeyWide)}

            {renderKey(".", inputDot)}

            {renderKey(
              "✓",
              handleApply,
              {
                backgroundColor: colors.incomeBg,
              },
              {
                color: colors.income,
              },
            )}
          </View>

          {/* CANCEL */}

          <Pressable onPress={onClose} style={styles.calcCancelButton}>
            <Text
              style={[
                styles.calcCancelText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| BUILD MONTH GRID
|--------------------------------------------------------------------------
*/

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    cells.push({
      key: `prev-${daysInPrevMonth - i}`,
      day: daysInPrevMonth - i,
      inCurrentMonth: false,
      dateString: null,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    cells.push({
      key: dateString,
      day,
      inCurrentMonth: true,
      dateString,
    });
  }

  const trailingCount = (7 - (cells.length % 7)) % 7;

  for (let day = 1; day <= trailingCount; day++) {
    cells.push({
      key: `next-${day}`,
      day,
      inCurrentMonth: false,
      dateString: null,
    });
  }

  return cells;
}

/*
|--------------------------------------------------------------------------
| FULL CALENDAR
|--------------------------------------------------------------------------
*/

function FullCalendar({
  viewDate,
  onChangeMonth,
  transactionDates,
  selectedDate,
  onSelectDate,
  colors,
  styles,
}) {
  const cells = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const goToPrevMonth = () => {
    onChangeMonth(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    onChangeMonth(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <View
      style={[
        styles.calendarWrap,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.calendarHeaderRow}>
        <Text style={styles.calendarTitle}>Calendar</Text>

        {selectedDate && (
          <TouchableOpacity onPress={() => onSelectDate(null)}>
            <Text
              style={[
                styles.calendarClear,
                {
                  color: colors.primary,
                },
              ]}
            >
              Show all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.calendarNavRow}>
        <TouchableOpacity
          onPress={goToPrevMonth}
          hitSlop={10}
          style={styles.calendarNavButton}
        >
          <Text
            style={[
              styles.calendarNavArrow,
              {
                color: colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.calendarMonthLabel,
            {
              color: colors.text,
            },
          ]}
        >
          {monthLabel}
        </Text>

        <TouchableOpacity
          onPress={goToNextMonth}
          hitSlop={10}
          style={styles.calendarNavButton}
        >
          <Text
            style={[
              styles.calendarNavArrow,
              {
                color: colors.text,
              },
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text
            key={label}
            style={[
              styles.weekdayText,
              {
                color: colors.textFaint,
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {cells.map((cell) => {
          const isSelected =
            cell.inCurrentMonth && cell.dateString === selectedDate;

          const hasTransactions =
            cell.inCurrentMonth && transactionDates.has(cell.dateString);

          return (
            <TouchableOpacity
              key={cell.key}
              activeOpacity={cell.inCurrentMonth ? 0.7 : 1}
              disabled={!cell.inCurrentMonth}
              onPress={() => onSelectDate(isSelected ? null : cell.dateString)}
              style={[
                styles.calendarDayCell,
                isSelected && {
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                },
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  {
                    color: !cell.inCurrentMonth
                      ? colors.textFaint
                      : isSelected
                        ? colors.primaryText
                        : colors.text,
                  },
                  !cell.inCurrentMonth && {
                    opacity: 0.35,
                  },
                ]}
              >
                {cell.day}
              </Text>

              {hasTransactions && (
                <View
                  style={[
                    styles.calendarDot,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryText
                        : colors.primary,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TransactionCard({ transaction, currency, onDelete, styles }) {
  const isIncome = transaction.type === "Income";

  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            isIncome ? styles.incomeIcon : styles.expenseIcon,
          ]}
        >
          <Text
            style={[
              styles.iconText,
              isIncome ? styles.incomeIconText : styles.expenseIconText,
            ]}
          >
            {isIncome ? "↓" : "↑"}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {transaction.title}
          </Text>

          <Text style={styles.transactionMeta} numberOfLines={1}>
            {transaction.category} • {transaction.date}
          </Text>
        </View>
      </View>

      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            isIncome ? styles.incomeAmount : styles.expenseAmount,
          ]}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount, currency)}
        </Text>

        <Pressable
          onPress={() => onDelete(transaction.id)}
          hitSlop={8}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

function mapTransaction(raw) {
  return {
    id: raw.id,

    title: raw.description || raw.category_name || "Transaction",

    category: raw.category_name || "Uncategorized",

    categoryColor: raw.category_color,

    amount: Number(raw.amount || 0),

    type: raw.type === "income" ? "Income" : "Expense",

    rawDate: raw.occurred_on ? raw.occurred_on.slice(0, 10) : null,

    date: raw.occurred_on
      ? new Date(raw.occurred_on).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
  };
}

export default function Transactions() {
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,

    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,

    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const styles = createStyles(colors);

  const [filter, setFilter] = useState("All types");

  const [selectedDate, setSelectedDate] = useState(null);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [showAddModal, setShowAddModal] = useState(false);

  const [showCalculator, setShowCalculator] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const [transactions, setTransactions] = useState([]);

  const [allCategories, setAllCategories] = useState([]);

  const [currency, setCurrency] = useState("NGN");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [type, setType] = useState("Expense");

  const [amount, setAmount] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(null);

  const [description, setDescription] = useState("");

  const [date, setDate] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();

      console.log("Transactions API response:", data);

      const list = data.transactions || [];

      setTransactions(list.map(mapTransaction));
    } catch (error) {
      console.log("Get transactions error:", error);

      Alert.alert("Error", error.message || "Unable to load transactions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();

      console.log("Categories API response:", data);

      setAllCategories(data.categories || []);
    } catch (error) {
      console.log("Get categories error:", error);
    }
  }, []);

  const loadCurrency = useCallback(async () => {
    try {
      const data = await getCurrentUser();

      const profile = data?.user || data?.data?.user || data?.data || data;

      setCurrency(profile?.currency || "NGN");
    } catch (error) {
      console.log("Load currency error:", error);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadCurrency();
  }, [loadTransactions, loadCategories, loadCurrency]);

  const onRefresh = () => {
    setRefreshing(true);

    loadTransactions();
    loadCategories();
    loadCurrency();
  };

  const categoryOptions = allCategories.filter(
    (c) => c.type?.toLowerCase() === type.toLowerCase(),
  );

  const transactionDates = useMemo(() => {
    const set = new Set();

    for (const transaction of transactions) {
      if (transaction.rawDate) {
        set.add(transaction.rawDate);
      }
    }

    return set;
  }, [transactions]);

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter !== "All types" && transaction.type !== filter) {
      return false;
    }

    if (selectedDate && transaction.rawDate !== selectedDate) {
      return false;
    }

    return true;
  });

  const totalIncome = transactions
    .filter((item) => item.type === "Income")
    .reduce((total, item) => total + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === "Expense")
    .reduce((total, item) => total + item.amount, 0);

  const resetForm = () => {
    setType("Expense");
    setAmount("");
    setSelectedCategory(null);
    setDescription("");
    setDate(new Date());
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setSelectedCategory(null);
  };

  const addTransaction = async () => {
    if (!amount.trim()) {
      Alert.alert("Missing information", "Please enter an amount.");

      return;
    }

    setSaving(true);

    try {
      const payload = {
        type: type.toLowerCase(),

        amount: Number(amount),

        description: description.trim() || null,

        occurredOn: date.toISOString().slice(0, 10),

        categoryId: selectedCategory?.id || null,
      };

      console.log("Sending transaction:", payload);

      const response = await createTransaction(payload);

      console.log("Create transaction response:", response);

      await loadTransactions();

      resetForm();

      setShowAddModal(false);
    } catch (error) {
      console.log("Add transaction error:", error);

      Alert.alert("Error", error.message || "Unable to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (id) => {
    const previous = transactions;

    setTransactions((current) => current.filter((t) => t.id !== id));

    try {
      await deleteTransactionApi(id);
    } catch (error) {
      console.log("Delete transaction error:", error);

      Alert.alert("Error", error.message || "Unable to delete transaction.");

      setTransactions(previous);
    }
  };

  const handleExportCsv = async () => {
    if (transactions.length === 0) {
      Alert.alert(
        "Nothing to export",
        "There are no transactions available to export.",
      );

      return;
    }

    try {
      setExporting(true);
      setShowExportMenu(false);

      const data = await getTransactions();

      const rawTransactions = data.transactions || [];

      await exportTransactionsToCsv(rawTransactions, currency);
    } catch (error) {
      console.log("CSV export error:", error);

      Alert.alert(
        "Export failed",
        error.message || "Unable to export transactions as CSV.",
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (transactions.length === 0) {
      Alert.alert(
        "Nothing to export",
        "There are no transactions available to export.",
      );

      return;
    }

    try {
      setExporting(true);
      setShowExportMenu(false);

      const data = await getTransactions();

      const rawTransactions = data.transactions || [];

      await exportTransactionsToPdf(rawTransactions, currency);
    } catch (error) {
      console.log("PDF export error:", error);

      Alert.alert(
        "Export failed",
        error.message || "Unable to export transactions as PDF.",
      );
    } finally {
      setExporting(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />

          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
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
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.heading}>Transactions</Text>

            <Text style={styles.subheading}>
              Every money in, Every money out.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
              disabled={exporting}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Add transaction</Text>
            </TouchableOpacity>

            <View style={styles.exportMenuContainer}>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setShowExportMenu((current) => !current)}
                disabled={exporting}
                activeOpacity={0.8}
              >
                <Text style={styles.moreButtonText}>⋮</Text>
              </TouchableOpacity>

              {showExportMenu && (
                <View style={styles.exportMenu}>
                  <TouchableOpacity
                    style={styles.exportMenuItem}
                    onPress={handleExportCsv}
                    disabled={exporting}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exportMenuIcon}>⇩</Text>

                    <Text style={styles.exportMenuText}>Export CSV</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.exportMenuItem}
                    onPress={handleExportPdf}
                    disabled={exporting}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exportMenuIcon}>PDF</Text>

                    <Text style={styles.exportMenuText}>Export PDF</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL INCOME</Text>

            <Text style={styles.incomeSummary}>
              {formatCurrency(totalIncome, currency)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL EXPENSE</Text>

            <Text style={styles.expenseSummary}>
              {formatCurrency(totalExpense, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter transactions</Text>

          <View style={styles.filterButtons}>
            {["All types", "Income", "Expense"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterButton,
                  filter === item && styles.activeFilter,
                ]}
                onPress={() => setFilter(item)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === item && styles.activeFilterText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.listCard}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                currency={currency}
                onDelete={deleteTransaction}
                styles={styles}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>

              <Text style={styles.emptyText}>
                {selectedDate
                  ? "No transactions were recorded on this day."
                  : "No transactions match this filter yet."}
              </Text>
            </View>
          )}
        </View>

        <FullCalendar
          viewDate={calendarMonth}
          onChangeMonth={setCalendarMonth}
          transactionDates={transactionDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          colors={colors}
          styles={styles}
        />
      </ScrollView>

      {/* ADD TRANSACTION MODAL */}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add transaction</Text>

              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            <Dropdown
              label="Type"
              value={type}
              options={TYPES}
              onSelect={handleTypeChange}
              styles={styles}
            />

            {/* AMOUNT */}

            <Text style={styles.inputLabel}>Amount</Text>

            <View style={styles.amountRow}>
              {/* AMOUNT INPUT FIRST */}

              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder={formatCurrency(0, currency)}
                placeholderTextColor={colors.textFaint}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              {/* CALCULATOR BUTTON ON THE RIGHT */}

              <Pressable
                style={[
                  styles.calcOpenButton,
                  {
                    backgroundColor: colors.chipBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
                onPress={() => setShowCalculator(true)}
                android_ripple={{
                  color: colors.divider,
                }}
              >
                <Text
                  style={[
                    styles.calcOpenButtonText,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  📲
                </Text>
              </Pressable>
            </View>

            <Dropdown
              label="Category"
              value={selectedCategory?.name}
              options={categoryOptions}
              onSelect={setSelectedCategory}
              placeholder={
                categoryOptions.length > 0
                  ? "Select a category"
                  : `No ${type.toLowerCase()} categories yet`
              }
              styles={styles}
            />

            <Text style={styles.inputLabel}>Description</Text>

            <TextInput
              style={styles.input}
              placeholder="Optional note"
              placeholderTextColor={colors.textFaint}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.inputLabel}>Date</Text>

            <Pressable
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {date.toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === "ios");

                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}

            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={addTransaction}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.saveButtonText}>Save transaction</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CALCULATOR MODAL */}

      <CalculatorModal
        visible={showCalculator}
        onClose={() => setShowCalculator(false)}
        onApply={(value) => setAmount(value)}
        colors={colors}
        styles={styles}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    container: {
      padding: 20,
      paddingBottom: 40,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontFamily: fonts.bodyRegular,
      color: colors.textMuted,
    },

    header: {
      marginBottom: 12,
    },

    headerTitleContainer: {
      width: "100%",
    },

    heading: {
      fontSize: 18,
      fontFamily: fonts.displayBold,
      color: colors.text,
    },

    subheading: {
      fontSize: 10,
      fontFamily: fonts.bodyRegular,
      color: colors.textMuted,
      marginTop: 4,
    },

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 18,
    },

    addButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 10,
      alignSelf: "flex-start",
    },

    addButtonText: {
      color: colors.primaryText,
      fontSize: 10,
      fontFamily: fonts.bodySemiBold,
    },

    exportMenuContainer: {
      position: "relative",
      marginLeft: 215,
      zIndex: 50,
    },

    moreButton: {
      width: 36,
      height: 46,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    moreButtonText: {
      fontSize: 21,
      lineHeight: 30,
      color: colors.text,
      fontFamily: fonts.bodySemiBold,
      marginTop: -6,
    },

    exportMenu: {
      position: "absolute",
      top: 52,
      right: 0,
      width: 140,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 5,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 10,
    },

    exportMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 14,
    },

    exportMenuIcon: {
      width: 28,
      fontSize: 11,
      fontFamily: fonts.bodySemiBold,
      color: colors.primary,
    },

    exportMenuText: {
      fontSize: 11,
      fontFamily: fonts.bodySemiBold,
      color: colors.text,
    },

    summaryContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 15,
    },

    summaryCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },

    summaryLabel: {
      fontSize: 10,
      fontFamily: fonts.displaySemiBold,
      color: colors.textFaint,
      letterSpacing: 0.5,
      marginBottom: 8,
    },

    incomeSummary: {
      fontSize: 14,
      fontFamily: fonts.monoMedium,
      color: colors.income,
    },

    expenseSummary: {
      fontSize: 14,
      fontFamily: fonts.monoMedium,
      color: colors.expense,
    },

    filterContainer: {
      marginBottom: 16,
    },

    filterLabel: {
      fontSize: 12,
      fontFamily: fonts.displaySemiBold,
      color: colors.text,
      marginBottom: 10,
    },

    filterButtons: {
      flexDirection: "row",
      gap: 6,
    },

    filterButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 20,
    },

    activeFilter: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    filterText: {
      fontSize: 9,
      fontFamily: fonts.bodyMedium,
      color: colors.textMuted,
    },

    activeFilterText: {
      color: colors.primaryText,
    },

    listCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: "hidden",
      marginBottom: 20,
    },

    transactionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },

    transactionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },

    transactionRight: {
      flexDirection: "row",
      alignItems: "center",
    },

    transactionIcon: {
      width: 28,
      height: 28,
      borderRadius: 21,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },

    incomeIcon: {
      backgroundColor: colors.incomeBg,
    },

    expenseIcon: {
      backgroundColor: colors.expenseBg,
    },

    iconText: {
      fontSize: 15,
      fontFamily: fonts.bodySemiBold,
    },

    incomeIconText: {
      color: colors.income,
    },

    expenseIconText: {
      color: colors.expense,
    },

    transactionTitle: {
      fontSize: 12,
      fontFamily: fonts.bodySemiBold,
      color: colors.text,
    },

    transactionMeta: {
      fontSize: 9,
      fontFamily: fonts.bodyRegular,
      color: colors.textFaint,
      marginTop: 4,
    },

    transactionAmount: {
      fontSize: 13,
      fontFamily: fonts.monoMedium,
      marginLeft: 10,
    },

    incomeAmount: {
      color: colors.income,
    },

    expenseAmount: {
      color: colors.expense,
    },

    deleteButton: {
      marginLeft: 10,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.chipBg,
      alignItems: "center",
      justifyContent: "center",
    },

    deleteButtonText: {
      fontSize: 13,
      lineHeight: 16,
      fontFamily: fonts.bodySemiBold,
      color: colors.textFaint,
    },

    emptyState: {
      paddingVertical: 50,
      alignItems: "center",
      justifyContent: "center",
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

    /*
    |--------------------------------------------------------------------------
    | FULL CALENDAR
    |--------------------------------------------------------------------------
    */

    calendarWrap: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
    },

    calendarHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },

    calendarTitle: {
      fontSize: 13,
      fontFamily: fonts.displaySemiBold,
      color: colors.text,
    },

    calendarClear: {
      fontSize: 10,
      fontFamily: fonts.bodySemiBold,
    },

    calendarNavRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      marginBottom: 12,
    },

    calendarNavButton: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },

    calendarNavArrow: {
      fontSize: 20,
      fontFamily: fonts.bodySemiBold,
    },

    calendarMonthLabel: {
      fontSize: 13,
      fontFamily: fonts.displaySemiBold,
    },

    weekdayRow: {
      flexDirection: "row",
      marginBottom: 6,
    },

    weekdayText: {
      width: `${100 / 7}%`,
      textAlign: "center",
      fontSize: 9,
      fontFamily: fonts.bodySemiBold,
      textTransform: "uppercase",
    },

    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    calendarDayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    calendarDayText: {
      fontSize: 12,
      fontFamily: fonts.monoRegular,
    },

    calendarDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginTop: 3,
    },

    /*
    |--------------------------------------------------------------------------
    | ADD TRANSACTION MODAL
    |--------------------------------------------------------------------------
    */

    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: 20,
    },

    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
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

    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingVertical: 7,
      paddingHorizontal: 13,
      fontSize: 12,
      fontFamily: fonts.bodyRegular,
      color: colors.text,
      backgroundColor: colors.inputBg,
    },

    /*
    |--------------------------------------------------------------------------
    | AMOUNT ROW
    |--------------------------------------------------------------------------
    |
    | Calculator button is now positioned on the RIGHT side of the
    | amount input.
    |
    */

    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    calcOpenButton: {
      width: 48,
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    calcOpenButtonText: {
      fontSize: 21,
      fontFamily: fonts.bodySemiBold,
    },

    amountInput: {
      flex: 1,
    },

    /*
    |--------------------------------------------------------------------------
    | CALCULATOR MODAL
    |--------------------------------------------------------------------------
    */

    calcModalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: 24,
    },

    calcCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
    },

    /*
    |--------------------------------------------------------------------------
    | CALCULATOR HEADER
    |--------------------------------------------------------------------------
    */

    calcHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },

    calcHeaderTitle: {
      flexDirection: "row",
      alignItems: "center",
    },

    calcHeaderIcon: {
      fontSize: 18,
      marginRight: 8,
    },

    calcTitle: {
      fontSize: 15,
      fontFamily: fonts.displayBold,
    },

    calcCloseButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.chipBg,
    },

    calcCloseText: {
      fontSize: 20,
      lineHeight: 22,
      fontFamily: fonts.bodySemiBold,
    },

    calcDisplay: {
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },

    calcDisplayText: {
      fontSize: 22,
      fontFamily: fonts.monoMedium,
      textAlign: "right",
      flexShrink: 1,
    },

    calcOperatorIndicator: {
      fontSize: 14,
      fontFamily: fonts.monoMedium,
      marginLeft: 8,
    },

    calcRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },

    calcKey: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.chipBg,
    },

    calcKeyWide: {
      flex: 2,
    },

    calcKeyText: {
      fontSize: 16,
      fontFamily: fonts.monoMedium,
      color: colors.text,
    },

    calcCancelButton: {
      marginTop: 4,
      paddingVertical: 10,
      alignItems: "center",
    },

    calcCancelText: {
      fontSize: 11,
      fontFamily: fonts.bodyMedium,
    },

    dateText: {
      color: colors.text,
      fontSize: 12,
      fontFamily: fonts.bodyRegular,
    },

    dropdownField: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 13,
      backgroundColor: colors.inputBg,
    },

    dropdownValue: {
      fontSize: 12,
      fontFamily: fonts.bodyRegular,
      color: colors.text,
    },

    dropdownPlaceholder: {
      color: colors.textFaint,
    },

    dropdownArrow: {
      fontSize: 16,
      color: colors.textFaint,
    },

    dropdownOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: 40,
    },

    dropdownMenu: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 6,
      maxHeight: 300,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },

    dropdownOption: {
      paddingVertical: 12,
      paddingHorizontal: 18,
    },

    dropdownOptionText: {
      fontSize: 12,
      fontFamily: fonts.bodyRegular,
      color: colors.text,
    },

    dropdownOptionTextActive: {
      fontFamily: fonts.bodySemiBold,
      color: colors.primary,
    },

    saveButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      borderRadius: 9,
      paddingVertical: 12,
      alignItems: "center",
    },

    saveButtonDisabled: {
      opacity: 0.6,
    },

    saveButtonText: {
      color: colors.primaryText,
      fontSize: 12,
      fontFamily: fonts.bodySemiBold,
    },
  });
