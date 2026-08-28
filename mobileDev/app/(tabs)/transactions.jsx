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

const TYPES = ["Expense", "Income"];

function Dropdown({ label, value, options, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable style={styles.dropdownField} onPress={() => setOpen(true)}>
        <Text style={styles.dropdownValue}>
          {value ? value : placeholder || "Select..."}
        </Text>
        <Text style={styles.dropdownArrow}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
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

function TransactionCard({ transaction, onDelete }) {
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
          <Text style={styles.iconText}>{isIncome ? "↓" : "↑"}</Text>
        </View>

        <View>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={styles.transactionMeta}>
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
  Normalizes a raw backend transaction row into the shape
  this screen renders. Matches transactionController.js:
  - type: 'income' | 'expense'
  - amount, description, occurred_on
  - category_name / category_color from the categories JOIN
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

export default function Transactions() {
  const [filter, setFilter] = useState("All types");
  const [showAddModal, setShowAddModal] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add-transaction form state
  const [type, setType] = useState("Expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null); // { id, name, type, color }
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

      console.log("Categories API response (transactions screen):", data);

      setAllCategories(data.categories || []);
    } catch (error) {
      console.log("Get categories error (transactions screen):", error);
      // Non-fatal: user just won't be able to pick a category yet.
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

  // Categories filtered to match the currently selected transaction type
  const categoryOptions = allCategories.filter(
    (c) => c.type?.toLowerCase() === type.toLowerCase(),
  );

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "All types") return true;
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
    setSelectedCategory(null); // category list changes with type, so reset selection
  };

  const addTransaction = async () => {
    if (!amount.trim()) {
      Alert.alert("Missing information", "Please enter an amount.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        type: type.toLowerCase(), // 'income' | 'expense'
        amount: Number(amount),
        description: description.trim() || null,
        occurredOn: date.toISOString().slice(0, 10), // YYYY-MM-DD
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
    // Optimistic UI update
    const previous = transactions;
    setTransactions((current) => current.filter((t) => t.id !== id));

    try {
      await deleteTransactionApi(id);
    } catch (error) {
      console.log("Delete transaction error:", error);
      Alert.alert("Error", error.message || "Unable to delete transaction.");
      // Roll back on failure
      setTransactions(previous);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#174E78" />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
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

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL INCOME</Text>
            <Text style={styles.incomeSummary}>
              ₦{totalIncome.toLocaleString()}.00
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL EXPENSE</Text>
            <Text style={styles.expenseSummary}>
              ₦{totalExpense.toLocaleString()}.00
            </Text>
          </View>
        </View>

        {/* Filter */}
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

        {/* Transaction List */}
        <View style={styles.listCard}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onDelete={deleteTransaction}
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

      {/* Add Transaction Modal */}
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

            {/* TYPE — dropdown */}
            <Dropdown
              label="Type"
              value={type}
              options={TYPES}
              onSelect={handleTypeChange}
            />

            {/* AMOUNT */}
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="₦0.00"
              placeholderTextColor="#9CA3AF"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {/* CATEGORY — dropdown, sourced from real API categories */}
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
            />

            {/* DESCRIPTION */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional note"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
            />

            {/* DATE */}
            <Text style={styles.inputLabel}>Date</Text>
            <Pressable
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: "#111827", fontSize: 14 }}>
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
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            {/* SAVE */}
            <Pressable
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={addTransaction}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    color: "#6B7280",
  },

  header: {
    marginBottom: 24,
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },

  subheading: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },

  addButton: {
    marginTop: 18,
    backgroundColor: "#174E78",
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  addButtonText: {
    color: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0F3",
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  incomeSummary: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16A34A",
  },

  expenseSummary: {
    fontSize: 16,
    fontWeight: "800",
    color: "#EC4899",
  },

  filterContainer: {
    marginBottom: 16,
  },

  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },

  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },

  filterButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 20,
  },

  activeFilter: {
    backgroundColor: "#174E78",
    borderColor: "#174E78",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    overflow: "hidden",
  },

  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    backgroundColor: "#DCFCE7",
  },

  expenseIcon: {
    backgroundColor: "#FCE7F3",
  },

  iconText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#374151",
  },

  transactionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  transactionMeta: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },

  transactionAmount: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 10,
  },

  incomeAmount: {
    color: "#16A34A",
  },

  expenseAmount: {
    color: "#EC4899",
  },

  deleteButton: {
    marginLeft: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 16,
    lineHeight: 16,
    color: "#9CA3AF",
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
    color: "#374151",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
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
    color: "#111827",
  },

  closeButton: {
    fontSize: 22,
    color: "#9CA3AF",
    fontWeight: "700",
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },

  dropdownField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    backgroundColor: "#F9FAFB",
  },

  dropdownValue: {
    fontSize: 14,
    color: "#111827",
  },

  dropdownArrow: {
    fontSize: 16,
    color: "#9CA3AF",
  },

  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.4)",
    justifyContent: "center",
    padding: 40,
  },

  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 8,
    maxHeight: 320,
  },

  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  dropdownOptionText: {
    fontSize: 14,
    color: "#374151",
  },

  dropdownOptionTextActive: {
    fontWeight: "700",
    color: "#174E78",
  },

  saveButton: {
    marginTop: 20,
    backgroundColor: "#174E78",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
