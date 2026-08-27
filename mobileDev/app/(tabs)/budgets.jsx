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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EXPENSE_CATEGORIES = [
  { name: "Entertainment", color: "#7C6FF0" },
  { name: "Food & Groceries", color: "#EC4899" },
  { name: "Health", color: "#F59E0B" },
  { name: "Housing & Utilities", color: "#7C6FF0" },
  { name: "Savings", color: "#2DD4BF" },
  { name: "Transport", color: "#FBBF24" },
];

// Mock month-to-date spend per category, used to compute progress.
const MOCK_SPENT = {
  Entertainment: 0,
  "Food & Groceries": 22000,
  Health: 0,
  "Housing & Utilities": 18000,
  Savings: 30000,
  Transport: 15000,
};

function getCategoryMeta(name) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.name === name) || {
      name,
      color: "#9CA3AF",
    }
  );
}

function progressColor(percent) {
  if (percent >= 100) return "#EF4444";
  if (percent >= 80) return "#FBBF24";
  return "#16A34A";
}

function BudgetCard({ budget, onDelete }) {
  const meta = getCategoryMeta(budget.category);
  const spent = MOCK_SPENT[budget.category] || 0;
  const percent =
    budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
  const barColor = progressColor(percent);

  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View style={[styles.dot, { backgroundColor: meta.color }]} />
          <Text style={styles.budgetName}>{budget.category}</Text>
        </View>

        <Pressable
          onPress={() => onDelete(budget.id)}
          hitSlop={8}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(percent, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.budgetFooter}>
        <Text style={styles.budgetSpent}>
          ₦{spent.toLocaleString()}.00{" "}
          <Text style={styles.budgetOf}>
            of ₦{budget.limit.toLocaleString()}.00
          </Text>
        </Text>
        <Text style={[styles.budgetPercent, { color: barColor }]}>
          {percent}%
        </Text>
      </View>
    </View>
  );
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [limit, setLimit] = useState("");

  const resetForm = () => {
    setCategory(EXPENSE_CATEGORIES[0].name);
    setLimit("");
  };

  const addBudget = () => {
    if (!limit.trim() || Number(limit) <= 0) {
      Alert.alert(
        "Missing information",
        "Please enter a monthly limit greater than zero.",
      );
      return;
    }

    if (budgets.some((b) => b.category === category)) {
      Alert.alert(
        "Budget already set",
        `${category} already has a monthly budget. Delete it first to set a new one.`,
      );
      return;
    }

    const newBudget = {
      id: Date.now().toString(),
      category,
      limit: Number(limit),
    };

    setBudgets((current) => [...current, newBudget]);
    resetForm();
    setShowAddModal(false);
  };

  const deleteBudget = (id) => {
    setBudgets((current) => current.filter((b) => b.id !== id));
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
            <Text style={styles.heading}>Budgets</Text>
            <Text style={styles.subheading}>
              Set monthly limits and see how close you are to them.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Set budget</Text>
          </TouchableOpacity>
        </View>

        {/* Budget list / empty state */}
        {budgets.length > 0 ? (
          <View style={styles.budgetList}>
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onDelete={deleteBudget}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No budgets yet — set a monthly limit to start tracking.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Set Budget Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set budget</Text>

              <Pressable
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            {/* CATEGORY */}
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryChips}>
              {EXPENSE_CATEGORIES.map((c) => (
                <Pressable
                  key={c.name}
                  style={[
                    styles.categoryChip,
                    category === c.name && {
                      backgroundColor: c.color + "22",
                      borderColor: c.color,
                    },
                  ]}
                  onPress={() => setCategory(c.name)}
                >
                  <View
                    style={[styles.chipDot, { backgroundColor: c.color }]}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === c.name && { color: "#111827" },
                    ]}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* LIMIT */}
            <Text style={styles.inputLabel}>Monthly limit</Text>
            <TextInput
              style={styles.input}
              placeholder="₦0.00"
              placeholderTextColor="#9CA3AF"
              value={limit}
              onChangeText={setLimit}
              keyboardType="numeric"
            />

            {/* SAVE */}
            <Pressable style={styles.saveButton} onPress={addBudget}>
              <Text style={styles.saveButtonText}>Set budget</Text>
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

  /* Header */
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

  /* Empty State */
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },

  /* Budget List */
  budgetList: {
    gap: 12,
  },

  budgetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    padding: 16,
  },

  budgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  budgetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  budgetName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  deleteButton: {
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

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },

  progressFill: {
    height: 8,
    borderRadius: 4,
  },

  budgetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  budgetSpent: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  budgetOf: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
  },

  budgetPercent: {
    fontSize: 13,
    fontWeight: "800",
  },

  /* Set Budget Modal */
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
    marginBottom: 16,
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
  },

  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
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
