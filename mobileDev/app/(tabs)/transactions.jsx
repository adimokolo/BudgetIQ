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

import {
  getTransactions,
  createTransaction,
  deleteTransaction as deleteTransactionApi,
} from "../../services/transactions";

import { getCategories } from "../../services/categories";
import { useTheme } from "../../contexts/ThemeContext";

const TYPES = ["Expense", "Income"];

/*
|--------------------------------------------------------------------------
| DROPDOWN
|--------------------------------------------------------------------------
*/

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
| TRANSACTION CARD
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| NORMALIZE BACKEND TRANSACTION
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| TRANSACTIONS SCREEN
|--------------------------------------------------------------------------
*/

export default function Transactions() {
  const { colors } = useTheme();

  /*
  |--------------------------------------------------------------------------
  | THEME-AWARE STYLES
  |--------------------------------------------------------------------------
  */

  const styles = createStyles(colors);

  const [filter, setFilter] = useState("All types");
  const [showAddModal, setShowAddModal] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add transaction form
  const [type, setType] = useState("Expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD TRANSACTIONS
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | LOAD CATEGORIES
  |--------------------------------------------------------------------------
  */

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();

      console.log("Categories API response:", data);

      setAllCategories(data.categories || []);
    } catch (error) {
      console.log("Get categories error:", error);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [loadTransactions, loadCategories]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const onRefresh = () => {
    setRefreshing(true);

    loadTransactions();
    loadCategories();
  };

  /*
  |--------------------------------------------------------------------------
  | CATEGORY OPTIONS
  |--------------------------------------------------------------------------
  */

  const categoryOptions = allCategories.filter(
    (c) => c.type?.toLowerCase() === type.toLowerCase(),
  );

  /*
  |--------------------------------------------------------------------------
  | FILTER TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "All types") {
      return true;
    }

    return transaction.type === filter;
  });

  /*
  |--------------------------------------------------------------------------
  | TOTALS
  |--------------------------------------------------------------------------
  */

  const totalIncome = transactions
    .filter((item) => item.type === "Income")
    .reduce((total, item) => total + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === "Expense")
    .reduce((total, item) => total + item.amount, 0);

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setType("Expense");
    setAmount("");
    setSelectedCategory(null);
    setDescription("");
    setDate(new Date());
  };

  /*
  |--------------------------------------------------------------------------
  | TYPE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleTypeChange = (newType) => {
    setType(newType);
    setSelectedCategory(null);
  };

  /*
  |--------------------------------------------------------------------------
  | ADD TRANSACTION
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | DELETE TRANSACTION
  |--------------------------------------------------------------------------
  */

  const deleteTransaction = async (id) => {
    const previous = transactions;

    // Optimistic update
    setTransactions((current) => current.filter((t) => t.id !== id));

    try {
      await deleteTransactionApi(id);
    } catch (error) {
      console.log("Delete transaction error:", error);

      Alert.alert("Error", error.message || "Unable to delete transaction.");

      // Rollback
      setTransactions(previous);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />

          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

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
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Transactions</Text>

            <Text style={styles.subheading}>
              Every naira in, every naira out.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add transaction</Text>
          </TouchableOpacity>
        </View>

        {/* SUMMARY */}

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

        {/* FILTER */}

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

        {/* TRANSACTION LIST */}

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

            {/* TYPE */}

            <Dropdown
              label="Type"
              value={type}
              options={TYPES}
              onSelect={handleTypeChange}
              styles={styles}
            />

            {/* AMOUNT */}

            <Text style={styles.inputLabel}>Amount</Text>

            <TextInput
              style={styles.input}
              placeholder="₦0.00"
              placeholderTextColor={colors.textFaint}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {/* CATEGORY */}

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

            {/* DESCRIPTION */}

            <Text style={styles.inputLabel}>Description</Text>

            <TextInput
              style={styles.input}
              placeholder="Optional note"
              placeholderTextColor={colors.textFaint}
              value={description}
              onChangeText={setDescription}
            />

            {/* DATE */}

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

            {/* SAVE */}

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

/*
|--------------------------------------------------------------------------
| THEME-AWARE STYLES
|--------------------------------------------------------------------------
*/

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
      color: colors.textMuted,
    },

    header: {
      marginBottom: 24,
    },

    heading: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.text,
    },

    subheading: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 5,
    },

    addButton: {
      marginTop: 18,
      backgroundColor: colors.primary,
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 10,
      alignSelf: "flex-start",
    },

    addButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "700",
    },

    summaryContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 20,
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
      fontWeight: "700",
      color: colors.textFaint,
      letterSpacing: 0.5,
      marginBottom: 8,
    },

    incomeSummary: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.income,
    },

    expenseSummary: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.expense,
    },

    filterContainer: {
      marginBottom: 16,
    },

    filterLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 10,
    },

    filterButtons: {
      flexDirection: "row",
      gap: 8,
    },

    filterButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingVertical: 9,
      paddingHorizontal: 13,
      borderRadius: 20,
    },

    activeFilter: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    filterText: {
      fontSize: 12,
      fontWeight: "600",
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
      width: 42,
      height: 42,
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
      fontSize: 20,
      fontWeight: "800",
    },

    incomeIconText: {
      color: colors.income,
    },

    expenseIconText: {
      color: colors.expense,
    },

    transactionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },

    transactionMeta: {
      fontSize: 11,
      color: colors.textFaint,
      marginTop: 4,
    },

    transactionAmount: {
      fontSize: 14,
      fontWeight: "800",
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
      fontSize: 16,
      lineHeight: 16,
      color: colors.textFaint,
      fontWeight: "700",
    },

    emptyState: {
      paddingVertical: 50,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
    },

    emptyText: {
      fontSize: 13,
      color: colors.textFaint,
      textAlign: "center",
    },

    /*
    |--------------------------------------------------------------------------
    | MODAL
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
      padding: 20,
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
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },

    closeButton: {
      fontSize: 22,
      color: colors.textFaint,
      fontWeight: "700",
    },

    /*
    |--------------------------------------------------------------------------
    | INPUTS
    |--------------------------------------------------------------------------
    */

    inputLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
      marginTop: 12,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 13,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.inputBg,
    },

    dateText: {
      color: colors.text,
      fontSize: 14,
    },

    /*
    |--------------------------------------------------------------------------
    | DROPDOWN
    |--------------------------------------------------------------------------
    */

    dropdownField: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 13,
      backgroundColor: colors.inputBg,
    },

    dropdownValue: {
      fontSize: 14,
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
      paddingVertical: 8,
      maxHeight: 320,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },

    dropdownOption: {
      paddingVertical: 12,
      paddingHorizontal: 18,
    },

    dropdownOptionText: {
      fontSize: 14,
      color: colors.text,
    },

    dropdownOptionTextActive: {
      fontWeight: "700",
      color: colors.primary,
    },

    /*
    |--------------------------------------------------------------------------
    | SAVE BUTTON
    |--------------------------------------------------------------------------
    */

    saveButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
    },

    saveButtonDisabled: {
      opacity: 0.6,
    },

    saveButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "700",
    },
  });
