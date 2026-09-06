import api from "./api";

/*
|--------------------------------------------------------------------------
| NOTIFICATIONS SERVICE (backend-backed)
|--------------------------------------------------------------------------
|
| Every function here hits the real backend, scoped by the logged-in
| user's JWT - no shared local storage, so nothing can leak between
| accounts on the same device. Field names are mapped at this layer
| (body -> message, read_at -> read, created_at -> createdAt) so the
| screens that already consume this service don't need to change.
|
*/

function mapNotification(raw) {
  return {
    id: raw.id,
    title: raw.title,
    message: raw.body,
    type: raw.type,
    read: raw.read_at !== null && raw.read_at !== undefined,
    createdAt: raw.created_at,
  };
}

/*
|--------------------------------------------------------------------------
| GET NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export const getNotifications = async () => {
  try {
    const response = await api.get("/notifications");

    const raw = response.data?.notifications || [];

    return raw.map(mapNotification);
  } catch (error) {
    console.log("Get notifications error:", error);

    return [];
  }
};

/*
|--------------------------------------------------------------------------
| ADD NOTIFICATION
|--------------------------------------------------------------------------
*/

export const addNotification = async ({
  title,
  message,
  type = "info",
  budgetId = null,
}) => {
  try {
    const response = await api.post("/notifications", {
      title,
      body: message,
      type,
      budgetId,
    });

    console.log("NOTIFICATION CREATED:", response.data?.notification);

    return response.data?.notification
      ? mapNotification(response.data.notification)
      : null;
  } catch (error) {
    console.log("Add notification error:", error);

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| MARK NOTIFICATION AS READ
|--------------------------------------------------------------------------
*/

export const markNotificationAsRead = async (notificationId) => {
  try {
    await api.patch(`/notifications/${notificationId}/read`);

    return true;
  } catch (error) {
    console.log("Mark notification read error:", error);

    return false;
  }
};

/*
|--------------------------------------------------------------------------
| MARK ALL AS READ
|--------------------------------------------------------------------------
*/

export const markAllNotificationsAsRead = async () => {
  try {
    await api.post("/notifications/read-all");

    return true;
  } catch (error) {
    console.log("Mark all notifications read error:", error);

    return false;
  }
};

/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
*/

export const deleteNotification = async (notificationId) => {
  try {
    await api.delete(`/notifications/${notificationId}`);

    return true;
  } catch (error) {
    console.log("Delete notification error:", error);

    return false;
  }
};

/*
|--------------------------------------------------------------------------
| CLEAR ALL NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export const clearNotifications = async () => {
  try {
    await api.delete("/notifications");

    return true;
  } catch (error) {
    console.log("Clear notifications error:", error);

    return false;
  }
};

/*
|--------------------------------------------------------------------------
| BUDGET STATUS CACHE (local, per-device dedupe only)
|--------------------------------------------------------------------------
|
| This is NOT user data - it's just a local memo so the app doesn't
| re-fire the same "budget exceeded" alert on every refresh. Safe to
| stay in AsyncStorage since losing/mixing it only risks a duplicate
| or missed alert, never someone else's financial data.
|--------------------------------------------------------------------------
*/

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSavedUser } from "./auth";

const BUDGET_STATUS_KEY_PREFIX = "budgetiq_budget_statuses";

async function getBudgetStatusKey() {
  const user = await getSavedUser();
  return `${BUDGET_STATUS_KEY_PREFIX}:${user?.id || "guest"}`;
}

export const getBudgetStatuses = async () => {
  try {
    const key = await getBudgetStatusKey();
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return {};
    }

    const parsed = JSON.parse(data);

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.log("Get budget statuses error:", error);

    return {};
  }
};

export const saveBudgetStatuses = async (statuses) => {
  try {
    const key = await getBudgetStatusKey();
    await AsyncStorage.setItem(key, JSON.stringify(statuses));

    console.log("Budget statuses saved:", statuses);
  } catch (error) {
    console.log("Save budget statuses error:", error);
  }
};

/*
|--------------------------------------------------------------------------
| CHECK BUDGET NOTIFICATIONS
|--------------------------------------------------------------------------
|
| safe     = below 80%
| warning  = 80% - 99%
| exceeded = 100%+
|
|--------------------------------------------------------------------------
*/

export const checkBudgetNotifications = async (budgets) => {
  try {
    console.log("Checking budget notifications...");

    if (!Array.isArray(budgets)) {
      console.log("No budgets supplied.");
      return;
    }

    const previousStatuses = await getBudgetStatuses();

    const updatedStatuses = {};

    for (const budget of budgets) {
      const spent = Number(budget.spent_this_month || 0);

      const limit = Number(budget.monthly_limit || 0);

      if (limit <= 0) {
        continue;
      }

      const percent = Math.round((spent / limit) * 100);

      let currentStatus = "safe";

      if (percent >= 100) {
        currentStatus = "exceeded";
      } else if (percent >= 80) {
        currentStatus = "warning";
      }

      const previousStatus = previousStatuses[budget.id];

      console.log("Budget notification check:", {
        id: budget.id,
        category: budget.category_name,
        spent,
        limit,
        percent,
        previousStatus,
        currentStatus,
      });

      updatedStatuses[budget.id] = currentStatus;

      if (!previousStatus) {
        if (currentStatus === "exceeded") {
          await addNotification({
            title: "Budget exceeded",
            message: `You have exceeded your ${
              budget.category_name || "category"
            } budget. You have spent ${spent.toLocaleString(
              "en",
            )} out of your ${limit.toLocaleString("en")} limit.`,
            type: "danger",
            budgetId: budget.id,
          });
        } else if (currentStatus === "warning") {
          await addNotification({
            title: "Budget limit approaching",
            message: `You have used ${percent}% of your ${
              budget.category_name || "category"
            } budget. You have ${Math.max(limit - spent, 0).toLocaleString(
              "en",
            )} remaining.`,
            type: "warning",
            budgetId: budget.id,
          });
        }

        continue;
      }

      if (currentStatus === "warning" && previousStatus === "safe") {
        await addNotification({
          title: "Budget limit approaching",
          message: `You have used ${percent}% of your ${
            budget.category_name || "category"
          } budget. You have ${Math.max(limit - spent, 0).toLocaleString(
            "en",
          )} remaining.`,
          type: "warning",
          budgetId: budget.id,
        });
      }

      if (currentStatus === "exceeded" && previousStatus !== "exceeded") {
        await addNotification({
          title: "Budget exceeded",
          message: `You have exceeded your ${
            budget.category_name || "category"
          } budget. You have spent ${spent.toLocaleString(
            "en",
          )} out of your ${limit.toLocaleString("en")} limit.`,
          type: "danger",
          budgetId: budget.id,
        });
      }

      if (
        currentStatus === "safe" &&
        (previousStatus === "warning" || previousStatus === "exceeded")
      ) {
        await addNotification({
          title: "Budget back on track",
          message: `Great job! Your ${
            budget.category_name || "category"
          } budget is now back within your monthly limit.`,
          type: "success",
          budgetId: budget.id,
        });
      }
    }

    await saveBudgetStatuses(updatedStatuses);

    console.log("Budget notification check completed.");
  } catch (error) {
    console.log("Check budget notifications error:", error);
  }
};
