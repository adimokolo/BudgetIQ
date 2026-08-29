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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

// -----------------------------------------------------------------------------
// NOTIFICATIONS SERVICE
// -----------------------------------------------------------------------------
import { checkBudgetNotifications } from "../../services/notifications";

// -----------------------------------------------------------------------------
// BUDGET API SERVICE
// -----------------------------------------------------------------------------
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget as deleteBudgetApi,
} from "../../services/budgets";

// -----------------------------------------------------------------------------
// CATEGORIES SERVICE
// -----------------------------------------------------------------------------
import { getCategories } from "../../services/categories";

// -----------------------------------------------------------------------------
// THEME
// -----------------------------------------------------------------------------
import { useTheme } from "../../contexts/ThemeContext";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function progressColor(percent, colors) {
  if (percent >= 100) {
    return colors.danger;
  }

  if (percent >= 80) {
    return colors.caution;
  }

  return colors.income;
}

function formatAmount(amount) {
  const numericAmount = Number(amount) || 0;

  return numericAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/*
|--------------------------------------------------------------------------
| BUDGET CARD
|--------------------------------------------------------------------------
*/

function BudgetCard({ budget, onEdit, onDelete, colors }) {
  const spent = Number(budget.spent_this_month || 0);
  const limit = Number(budget.monthly_limit || 0);

  let percent = Number(budget.percent_used);

  if (!Number.isFinite(percent)) {
    percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  }

  const safePercent = Math.max(percent, 0);
  const barPercent = Math.min(safePercent, 100);

  const barColor = progressColor(safePercent, colors);

  return (
    <View
      style={[
        styles.budgetCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* HEADER */}
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: budget.category_color || colors.textFaint,
              },
            ]}
          />

          <Text
            style={[
              styles.budgetName,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {budget.category_name || "Uncategorized"}
          </Text>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => onEdit(budget)}
            hitSlop={8}
            style={[
              styles.editButton,
              {
                backgroundColor: colors.chipBg,
              },
            ]}
          >
            <Text
              style={[
                styles.editButtonText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(budget)}
            hitSlop={8}
            style={[
              styles.deleteButton,
              {
                backgroundColor: colors.divider,
              },
            ]}
          >
            <Text
              style={[
                styles.deleteButtonText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              ×
            </Text>
          </Pressable>
        </View>
      </View>

      {/* PROGRESS BAR */}
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.divider,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${barPercent}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      {/* FOOTER */}
      <View style={styles.budgetFooter}>
        <Text
          style={[
            styles.budgetSpent,
            {
              color: colors.text,
            },
          ]}
        >
          ₦{formatAmount(spent)}{" "}
          <Text
            style={[
              styles.budgetOf,
              {
                color: colors.textFaint,
              },
            ]}
          >
            of ₦{formatAmount(limit)}
          </Text>
        </Text>

        <Text
          style={[
            styles.budgetPercent,
            {
              color: barColor,
            },
          ]}
        >
          {safePercent}%
        </Text>
      </View>

      {/* EXCEEDED */}
      {safePercent >= 100 && (
        <Text
          style={[
            styles.warningText,
            {
              color: colors.danger,
            },
          ]}
        >
          You have exceeded this budget.
        </Text>
      )}

      {/* APPROACHING LIMIT */}
      {safePercent >= 80 && safePercent < 100 && (
        <Text
          style={[
            styles.cautionText,
            {
              color: colors.caution,
            },
          ]}
        >
          You are approaching your budget limit.
        </Text>
      )}

      {/* SAFE */}
      {safePercent < 80 && (
        <Text
          style={[
            styles.safeText,
            {
              color: colors.income,
            },
          ]}
        >
          You are within your budget.
        </Text>
      )}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| MAIN SCREEN
|--------------------------------------------------------------------------
*/

export default function Budgets() {
  const { colors } = useTheme();

  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [limit, setLimit] = useState("");

  const [editingBudget, setEditingBudget] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  const loadBudgets = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [budgetsResponse, categoriesResponse] = await Promise.all([
        getBudgets(),
        getCategories(),
      ]);

      console.log("Budgets API response:", budgetsResponse);

      /*
      |--------------------------------------------------------------------------
      | GET BUDGETS
      |--------------------------------------------------------------------------
      */

      const loadedBudgets =
        budgetsResponse?.budgets || budgetsResponse?.data || [];

      setBudgets(loadedBudgets);

      /*
      |--------------------------------------------------------------------------
      | CHECK BUDGET NOTIFICATIONS
      |--------------------------------------------------------------------------
      |
      | This is local notification logic.
      |
      | It does NOT call the backend.
      |
      */

      try {
        await checkBudgetNotifications(loadedBudgets);
      } catch (notificationError) {
        console.log("Budget notification check error:", notificationError);
      }

      /*
      |--------------------------------------------------------------------------
      | GET CATEGORIES
      |--------------------------------------------------------------------------
      */

      const categories =
        categoriesResponse?.categories || categoriesResponse?.data || [];

      const expenseOnlyCategories = categories.filter(
        (category) => category.type?.toLowerCase() === "expense",
      );

      setExpenseCategories(expenseOnlyCategories);
    } catch (error) {
      console.log("Get budgets error:", error);

      Alert.alert(
        "Unable to load budgets",
        error?.message ||
          error?.error ||
          "Something went wrong while loading your budgets.",
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD WHEN SCREEN GETS FOCUS
  |--------------------------------------------------------------------------
  */

  useFocusEffect(
    useCallback(() => {
      loadBudgets(true);
    }, [loadBudgets]),
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const refreshBudgets = async () => {
    try {
      setRefreshing(true);

      await loadBudgets(false);
    } catch (error) {
      console.log("Refresh budgets error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setSelectedCategory(null);
    setLimit("");
    setEditingBudget(null);
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN ADD MODAL
  |--------------------------------------------------------------------------
  */

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT MODAL
  |--------------------------------------------------------------------------
  */

  const openEditModal = (budget) => {
    setEditingBudget(budget);

    setSelectedCategory({
      id: budget.category_id,
      name: budget.category_name || "Uncategorized",
      color: budget.category_color || colors.textFaint,
    });

    setLimit(String(budget.monthly_limit ?? ""));

    setShowAddModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE BUDGET
  |--------------------------------------------------------------------------
  */

  const saveBudget = async () => {
    const trimmedLimit = limit.trim();

    const numericLimit = Number(trimmedLimit);

    /*
    |--------------------------------------------------------------------------
    | VALIDATE LIMIT
    |--------------------------------------------------------------------------
    */

    if (!trimmedLimit || !Number.isFinite(numericLimit) || numericLimit <= 0) {
      Alert.alert(
        "Invalid monthly limit",
        "Please enter a monthly limit greater than zero.",
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE CATEGORY
    |--------------------------------------------------------------------------
    */

    if (!editingBudget && !selectedCategory) {
      Alert.alert("Missing information", "Please select a category.");

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK DUPLICATE
    |--------------------------------------------------------------------------
    */

    if (!editingBudget) {
      const duplicate = budgets.some(
        (budget) => String(budget.category_id) === String(selectedCategory.id),
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

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */

      if (editingBudget) {
        console.log("Updating budget:", editingBudget.id);

        console.log("Update payload:", {
          monthlyLimit: numericLimit,
        });

        await updateBudget(editingBudget.id, {
          monthlyLimit: numericLimit,
        });

        Alert.alert(
          "Budget updated",
          `${selectedCategory.name} budget has been updated successfully.`,
        );
      } else {
        /*
        |--------------------------------------------------------------------------
        | CREATE
        |--------------------------------------------------------------------------
        */

        const payload = {
          categoryId: selectedCategory.id,
          monthlyLimit: numericLimit,
        };

        console.log("Creating budget:", payload);

        await createBudget(payload);

        Alert.alert(
          "Budget created",
          `${selectedCategory.name} budget has been created successfully.`,
        );
      }

      /*
      |--------------------------------------------------------------------------
      | CLOSE MODAL
      |--------------------------------------------------------------------------
      */

      resetForm();
      setShowAddModal(false);

      /*
      |--------------------------------------------------------------------------
      | RELOAD
      |--------------------------------------------------------------------------
      */

      await loadBudgets(true);
    } catch (error) {
      console.log("Save budget error:", error);

      const errorMessage =
        error?.error ||
        error?.message ||
        "Something went wrong while saving your budget.";

      Alert.alert("Unable to save budget", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE BUDGET
  |--------------------------------------------------------------------------
  */

  const deleteBudget = (budget) => {
    Alert.alert(
      "Delete budget",
      `Are you sure you want to remove the ${budget.category_name} budget?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            const previousBudgets = budgets;

            /*
            |--------------------------------------------------------------------------
            | OPTIMISTIC UPDATE
            |--------------------------------------------------------------------------
            */

            setBudgets((current) =>
              current.filter((item) => item.id !== budget.id),
            );

            try {
              console.log("Deleting budget:", budget.id);

              await deleteBudgetApi(budget.id);

              /*
              |--------------------------------------------------------------------------
              | RECHECK NOTIFICATIONS
              |--------------------------------------------------------------------------
              */

              const updatedBudgets = previousBudgets.filter(
                (item) => item.id !== budget.id,
              );

              await checkBudgetNotifications(updatedBudgets);
            } catch (error) {
              console.log("Delete budget error:", error);

              /*
              |--------------------------------------------------------------------------
              | ROLLBACK
              |--------------------------------------------------------------------------
              */

              setBudgets(previousBudgets);

              Alert.alert(
                "Unable to delete budget",
                error?.error ||
                  error?.message ||
                  "Something went wrong while deleting the budget.",
              );
            }
          },
        },
      ],
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE MODAL
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (saving) {
      return;
    }

    resetForm();
    setShowAddModal(false);
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshBudgets}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text
              style={[
                styles.heading,
                {
                  color: colors.text,
                },
              ]}
            >
              Budgets
            </Text>

            <Text
              style={[
                styles.subheading,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Set monthly limits and see how close you are to them.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={openAddModal}
            disabled={loading}
          >
            <Text
              style={[
                styles.addButtonText,
                {
                  color: colors.primaryText,
                },
              ]}
            >
              + Set budget
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOADING */}
        {loading ? (
          <View
            style={[
              styles.loadingContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />

            <Text
              style={[
                styles.loadingText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              Loading budgets...
            </Text>
          </View>
        ) : budgets.length > 0 ? (
          /* BUDGET LIST */
          <View style={styles.budgetList}>
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={openEditModal}
                onDelete={deleteBudget}
                colors={colors}
              />
            ))}
          </View>
        ) : (
          /* EMPTY STATE */
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: colors.chipBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyIconText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ₦
              </Text>
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              No budgets yet
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              Set a monthly limit to start tracking your spending.
            </Text>

            <TouchableOpacity
              style={[
                styles.emptyButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={openAddModal}
            >
              <Text
                style={[
                  styles.emptyButtonText,
                  {
                    color: colors.primaryText,
                  },
                ]}
              >
                Set your first budget
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* ADD / EDIT MODAL */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={[
            styles.modalOverlay,
            {
              backgroundColor: colors.overlay,
            },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {editingBudget ? "Edit budget" : "Set budget"}
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  {editingBudget
                    ? "Update your monthly spending limit."
                    : "Create a monthly spending limit."}
                </Text>
              </View>

              <Pressable onPress={closeModal} disabled={saving} hitSlop={10}>
                <Text
                  style={[
                    styles.closeButton,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            {/* CATEGORY */}
            <Text
              style={[
                styles.inputLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Category
            </Text>

            {expenseCategories.length > 0 ? (
              <View style={styles.categoryChips}>
                {expenseCategories.map((category) => {
                  const isSelected =
                    String(selectedCategory?.id) === String(category.id);

                  const categoryColor = category.color || colors.textFaint;

                  return (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        {
                          borderColor: colors.inputBorder,
                        },
                        isSelected && {
                          backgroundColor: categoryColor + "22",
                          borderColor: categoryColor,
                        },
                      ]}
                      onPress={() => {
                        if (!saving && !editingBudget) {
                          setSelectedCategory(category);
                        }
                      }}
                      disabled={saving || Boolean(editingBudget)}
                    >
                      <View
                        style={[
                          styles.chipDot,
                          {
                            backgroundColor: categoryColor,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: colors.textMuted,
                          },
                          isSelected && {
                            color: colors.text,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.textFaint,
                  },
                ]}
              >
                No expense categories yet. Add one on the Categories screen
                first.
              </Text>
            )}

            {/* MONTHLY LIMIT */}
            <Text
              style={[
                styles.inputLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Monthly limit
            </Text>

            <View
              style={[
                styles.amountInputContainer,
                {
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.currencySymbol,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                ₦
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textFaint}
                value={limit}
                onChangeText={setLimit}
                keyboardType="decimal-pad"
                editable={!saving}
                autoFocus={false}
              />
            </View>

            {/* SAVE BUTTON */}
            <Pressable
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                },
                saving && styles.disabledButton,
              ]}
              onPress={saveBudget}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: colors.primaryText,
                    },
                  ]}
                >
                  {editingBudget ? "Update budget" : "Set budget"}
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 24,
  },

  headerTextContainer: {
    flex: 1,
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
  },

  subheading: {
    fontSize: 14,
    marginTop: 5,
    lineHeight: 20,
  },

  addButton: {
    marginTop: 18,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  loadingContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },

  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyIconText: {
    fontSize: 22,
    fontWeight: "800",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },

  emptyButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },

  budgetList: {
    gap: 12,
  },

  budgetCard: {
    borderRadius: 16,
    borderWidth: 1,
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
    flex: 1,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  budgetName: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  editButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  editButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },

  deleteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: "700",
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
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
  },

  budgetOf: {
    fontSize: 12,
    fontWeight: "500",
  },

  budgetPercent: {
    fontSize: 13,
    fontWeight: "800",
  },

  warningText: {
    marginTop: 9,
    fontSize: 11,
    fontWeight: "600",
  },

  cautionText: {
    marginTop: 9,
    fontSize: 11,
    fontWeight: "600",
  },

  safeText: {
    marginTop: 9,
    fontSize: 11,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
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

  modalTitleContainer: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  modalSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  closeButton: {
    fontSize: 22,
    fontWeight: "700",
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 12,
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
  },

  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 13,
  },

  currencySymbol: {
    fontSize: 15,
    fontWeight: "700",
  },

  input: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 9,
    fontSize: 14,
  },

  saveButton: {
    marginTop: 20,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
