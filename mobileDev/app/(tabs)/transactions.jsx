import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";

const CATEGORIES = [
  "Uncategorized",
  "Salary",
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
];

const TYPES = ["Expense", "Income"];

function Dropdown({ label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable style={styles.dropdownField} onPress={() => setOpen(true)}>
        <Text style={styles.dropdownValue}>{value}</Text>
        <Text style={styles.dropdownArrow}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={styles.dropdownOption}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    opt === value && styles.dropdownOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
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
          {isIncome ? "+" : "-"}₦{transaction.amount.toLocaleString()}.00
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

export default function Transactions() {
  const [filter, setFilter] = useState("All types");
  const [showAddModal, setShowAddModal] = useState(false);

  const [transactions, setTransactions] = useState([
    {
      id: "1",
      title: "Monthly Salary",
      category: "Salary",
      date: "Aug 25, 2026",
      amount: 300000,
      type: "Income",
    },
    {
      id: "2",
      title: "Groceries",
      category: "Food",
      date: "Aug 24, 2026",
      amount: 15000,
      type: "Expense",
    },
    {
      id: "3",
      title: "Uber",
      category: "Transport",
      date: "Aug 23, 2026",
      amount: 5000,
      type: "Expense",
    },
    {
      id: "4",
      title: "Freelance Project",
      category: "Income",
      date: "Aug 20, 2026",
      amount: 75000,
      type: "Income",
    },
  ]);

  // Add-transaction form state — matches the screenshot's fields
  const [type, setType] = useState("Expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    setCategory("Uncategorized");
    setDescription("");
    setDate(new Date());
  };

  const addTransaction = () => {
    if (!amount.trim()) {
      Alert.alert("Missing information", "Please enter an amount.");
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      title: description.trim() || category,
      category,
      amount: Number(amount),
      type,
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    setTransactions((currentTransactions) => [
      newTransaction,
      ...currentTransactions,
    ]);

    resetForm();
    setShowAddModal(false);
  };

  const deleteTransaction = (id) => {
    setTransactions((currentTransactions) =>
      currentTransactions.filter((transaction) => transaction.id !== id),
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
              onSelect={setType}
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

            {/* CATEGORY — dropdown */}
            <Dropdown
              label="Category"
              value={category}
              options={CATEGORIES}
              onSelect={setCategory}
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
            <Pressable style={styles.saveButton} onPress={addTransaction}>
              <Text style={styles.saveButtonText}>Save transaction</Text>
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
