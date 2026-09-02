import React, { useState, useEffect, useCallback } from "react";

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

import {
  exportTransactionsToCsv,
  exportTransactionsToPdf,
} from "../../services/exportTransactions";

import { useTheme } from "../../contexts/ThemeContext";

const TYPES = ["Expense", "Income"];

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

function TransactionCard({ transaction, onDelete, styles }) {
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
          {isIncome ? "+" : "-"}₦{Number(transaction.amount).toLocaleString()}
          .00
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

  const [showAddModal, setShowAddModal] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const [transactions, setTransactions] = useState([]);

  const [allCategories, setAllCategories] = useState([]);

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

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [loadTransactions, loadCategories]);

  const onRefresh = () => {
    setRefreshing(true);

    loadTransactions();
    loadCategories();
  };

  const categoryOptions = allCategories.filter(
    (c) => c.type?.toLowerCase() === type.toLowerCase(),
  );

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "All types") {
      return true;
    }

    return transaction.type === filter;
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

      await exportTransactionsToCsv(rawTransactions, "NGN");
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

      await exportTransactionsToPdf(rawTransactions, "NGN");
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
              ₦{totalIncome.toLocaleString()}
              .00
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL EXPENSE</Text>

            <Text style={styles.expenseSummary}>
              ₦{totalExpense.toLocaleString()}
              .00
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
                onDelete={deleteTransaction}
                styles={styles}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>

              <Text style={styles.emptyText}>
                No transactions match this filter yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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

            <Text style={styles.inputLabel}>Amount</Text>

            <TextInput
              style={styles.input}
              placeholder="₦0.00"
              placeholderTextColor={colors.textFaint}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

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
