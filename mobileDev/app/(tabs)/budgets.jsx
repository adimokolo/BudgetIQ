import React, { useCallback, useState } from "react";
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
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget as deleteBudgetApi,
} from "../../services/budgets";
import { getCategories } from "../../services/categories";

function progressColor(percent) {
  if (percent >= 100) return "#EF4444";
  if (percent >= 80) return "#FBBF24";
  return "#16A34A";
}

function formatAmount(amount) {
  const numericAmount = Number(amount) || 0;

  return numericAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function BudgetCard({ budget, onEdit, onDelete }) {
  const spent = Number(budget.spent_this_month || 0);
  const limit = Number(budget.monthly_limit || 0);
  const percent = Number(
    budget.percent_used ?? (limit > 0 ? Math.round((spent / limit) * 100) : 0),
  );

  const barColor = progressColor(percent);

  return (
    <View style={styles.budgetCard}>
      {/* HEADER */}
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[
              styles.dot,
              { backgroundColor: budget.category_color || "#9CA3AF" },
            ]}
          />

          <Text style={styles.budgetName}>
            {budget.category_name || "Uncategorized"}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => onEdit(budget)}
            hitSlop={8}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(budget)}
            hitSlop={8}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </Pressable>
        </View>
      </View>

      {/* PROGRESS */}
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

      {/* FOOTER */}
      <View style={styles.budgetFooter}>
        <Text style={styles.budgetSpent}>
          ₦{formatAmount(spent)}{" "}
          <Text style={styles.budgetOf}>of ₦{formatAmount(limit)}</Text>
        </Text>

        <Text style={[styles.budgetPercent, { color: barColor }]}>
          {percent}%
        </Text>
      </View>

      {/* STATUS */}
      {percent >= 100 && (
        <Text style={styles.warningText}>You have exceeded this budget.</Text>
      )}

      {percent >= 80 && percent < 100 && (
        <Text style={styles.cautionText}>
          You are approaching your budget limit.
        </Text>
      )}
    </View>
  );
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null); // { id, name, color }
  const [limit, setLimit] = useState("");

  const [editingBudget, setEditingBudget] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBudgets = async () => {
    try {
      setLoading(true);

      const [budgetsResponse, categoriesResponse] = await Promise.all([
        getBudgets(),
        getCategories(),
      ]);

      console.log("Budgets API response:", budgetsResponse);
      console.log(
        "Categories API response (budgets screen):",
        categoriesResponse,
      );

      setBudgets(budgetsResponse.budgets || []);

      const categories = categoriesResponse.categories || [];
      setExpenseCategories(
        categories.filter((c) => c.type?.toLowerCase() === "expense"),
      );
    } catch (error) {
      console.log("Get budgets error:", error);

      Alert.alert(
        "Unable to load budgets",
        error?.message ||
          error?.error ||
          "Something went wrong while loading your budgets.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, []),
  );

  const refreshBudgets = async () => {
    try {
      setRefreshing(true);
      await loadBudgets();
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setLimit("");
    setEditingBudget(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);

    setSelectedCategory({
      id: budget.category_id,
      name: budget.category_name,
      color: budget.category_color,
    });

    setLimit(String(budget.monthly_limit ?? ""));

    setShowAddModal(true);
  };

  const saveBudget = async () => {
    const numericLimit = Number(limit);

    if (!limit.trim() || numericLimit <= 0) {
      Alert.alert(
        "Missing information",
        "Please enter a monthly limit greater than zero.",
      );
      return;
    }

    if (!editingBudget && !selectedCategory) {
      Alert.alert("Missing information", "Please select a category.");
      return;
    }

    if (!editingBudget) {
      const duplicate = budgets.some(
        (budget) => budget.category_id === selectedCategory.id,
      );

      if (duplicate) {
        Alert.alert(
          "Budget already set",
          `${selectedCategory.name} already has a monthly budget. Edit the existing budget instead.`,
        );
        return;
      }
    }

    try {
      setSaving(true);

      if (editingBudget) {
        await updateBudget(editingBudget.id, { monthlyLimit: numericLimit });

        Alert.alert(
          "Budget updated",
          `${selectedCategory.name} budget has been updated successfully.`,
        );
      } else {
        await createBudget({
          categoryId: selectedCategory.id,
          monthlyLimit: numericLimit,
        });

        Alert.alert(
          "Budget created",
          `${selectedCategory.name} budget has been created successfully.`,
        );
      }

      resetForm();
      setShowAddModal(false);

      await loadBudgets();
    } catch (error) {
      console.log("Save budget error:", error);

      Alert.alert(
        "Unable to save budget",
        error?.message ||
          error?.error ||
          "Something went wrong while saving your budget.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteBudget = (budget) => {
    Alert.alert(
      "Delete budget",
      `Are you sure you want to remove the ${budget.category_name} budget?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Optimistic UI update
            const previous = budgets;
            setBudgets((current) => current.filter((b) => b.id !== budget.id));

            try {
              await deleteBudgetApi(budget.id);
            } catch (error) {
              console.log("Delete budget error:", error);
              Alert.alert(
                "Unable to delete budget",
                error?.message || error?.error || "Something went wrong.",
              );
              setBudgets(previous); // roll back
            }
          },
        },
      ],
    );
  };

  const closeModal = () => {
    if (saving) return;

    resetForm();
    setShowAddModal(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshBudgets} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.heading}>Budgets</Text>

            <Text style={styles.subheading}>
              Set monthly limits and see how close you are to them.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddModal}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>+ Set budget</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#174E78" />
            <Text style={styles.loadingText}>Loading budgets...</Text>
          </View>
        ) : budgets.length > 0 ? (
          <View style={styles.budgetList}>
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={openEditModal}
                onDelete={deleteBudget}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>₦</Text>
            </View>

            <Text style={styles.emptyTitle}>No budgets yet</Text>

            <Text style={styles.emptyText}>
              Set a monthly limit to start tracking your spending.
            </Text>

            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Set your first budget</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* SET / EDIT BUDGET MODAL */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingBudget ? "Edit budget" : "Set budget"}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {editingBudget
                    ? "Update your monthly spending limit."
                    : "Create a monthly spending limit."}
                </Text>
              </View>

              <Pressable onPress={closeModal} disabled={saving}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            {/* CATEGORY — real categories, disabled while editing */}
            <Text style={styles.inputLabel}>Category</Text>

            {expenseCategories.length > 0 ? (
              <View style={styles.categoryChips}>
                {expenseCategories.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory?.id === c.id && {
                        backgroundColor: (c.color || "#9CA3AF") + "22",
                        borderColor: c.color || "#9CA3AF",
                      },
                    ]}
                    onPress={() =>
                      !saving && !editingBudget && setSelectedCategory(c)
                    }
                    disabled={saving || !!editingBudget}
                  >
                    <View
                      style={[
                        styles.chipDot,
                        { backgroundColor: c.color || "#9CA3AF" },
                      ]}
                    />

                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory?.id === c.id && { color: "#111827" },
                      ]}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No expense categories yet. Add one on the Categories screen
                first.
              </Text>
            )}

            {/* LIMIT */}
            <Text style={styles.inputLabel}>Monthly limit</Text>

            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>

              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={limit}
                onChangeText={setLimit}
                keyboardType="numeric"
                editable={!saving}
              />
            </View>

            {/* SAVE */}
            <Pressable
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={saveBudget}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingBudget ? "Update budget" : "Set budget"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerTextContainer: { flex: 1 },
  heading: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subheading: { fontSize: 14, color: "#6B7280", marginTop: 5, lineHeight: 20 },
  addButton: {
    marginTop: 18,
    backgroundColor: "#174E78",
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  addButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { marginTop: 12, fontSize: 13, color: "#9CA3AF" },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#EAF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyIconText: { fontSize: 22, fontWeight: "800", color: "#174E78" },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: "#174E78",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  emptyButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  budgetList: { gap: 12 },
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
  budgetLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  budgetName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  actionButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  editButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: "#F3F6F8",
  },
  editButtonText: { fontSize: 11, fontWeight: "700", color: "#174E78" },
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
  progressFill: { height: 8, borderRadius: 4 },
  budgetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  budgetSpent: { fontSize: 13, fontWeight: "700", color: "#111827" },
  budgetOf: { fontSize: 12, fontWeight: "500", color: "#9CA3AF" },
  budgetPercent: { fontSize: 13, fontWeight: "800" },
  warningText: {
    marginTop: 9,
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "600",
  },
  cautionText: {
    marginTop: 9,
    fontSize: 11,
    color: "#D97706",
    fontWeight: "600",
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  modalSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 3 },
  closeButton: { fontSize: 22, color: "#9CA3AF", fontWeight: "700" },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
    marginTop: 12,
  },
  categoryChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  categoryChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingLeft: 13,
  },
  currencySymbol: { fontSize: 15, fontWeight: "700", color: "#374151" },
  input: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 9,
    fontSize: 14,
    color: "#111827",
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#174E78",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
