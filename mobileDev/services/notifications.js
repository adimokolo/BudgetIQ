import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_KEY = "budgetiq_notifications";
const BUDGET_STATUS_KEY = "budgetiq_budget_statuses";

/*
|--------------------------------------------------------------------------
| GET NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export const getNotifications = async () => {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.log("Get notifications error:", error);

    return [];
  }
};

/*
|--------------------------------------------------------------------------
| SAVE NOTIFICATIONS
|--------------------------------------------------------------------------
*/

const saveNotifications = async (notifications) => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATIONS_KEY,
      JSON.stringify(notifications),
    );
  } catch (error) {
    console.log("Save notifications error:", error);
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
    const notifications = await getNotifications();

    const newNotification = {
      id: `${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      budgetId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const updatedNotifications = [newNotification, ...notifications];

    await saveNotifications(updatedNotifications.slice(0, 100));

    console.log("NOTIFICATION CREATED:", newNotification);

    return newNotification;
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
    const notifications = await getNotifications();

    const updatedNotifications = notifications.map((notification) =>
      notification.id === notificationId
        ? {
            ...notification,
            read: true,
          }
        : notification,
    );

    await saveNotifications(updatedNotifications);

    return updatedNotifications;
  } catch (error) {
    console.log("Mark notification read error:", error);

    return [];
  }
};

/*
|--------------------------------------------------------------------------
| MARK ALL AS READ
|--------------------------------------------------------------------------
*/

export const markAllNotificationsAsRead = async () => {
  try {
    const notifications = await getNotifications();

    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));

    await saveNotifications(updatedNotifications);

    return updatedNotifications;
  } catch (error) {
    console.log("Mark all notifications read error:", error);

    return [];
  }
};

/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
*/

export const deleteNotification = async (notificationId) => {
  try {
    const notifications = await getNotifications();

    const updatedNotifications = notifications.filter(
      (notification) => notification.id !== notificationId,
    );

    await saveNotifications(updatedNotifications);

    return updatedNotifications;
  } catch (error) {
    console.log("Delete notification error:", error);

    return [];
  }
};

/*
|--------------------------------------------------------------------------
| CLEAR ALL NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export const clearNotifications = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_KEY);

    return [];
  } catch (error) {
    console.log("Clear notifications error:", error);

    return [];
  }
};

/*
|--------------------------------------------------------------------------
| GET BUDGET STATUSES
|--------------------------------------------------------------------------
*/

export const getBudgetStatuses = async () => {
  try {
    const data = await AsyncStorage.getItem(BUDGET_STATUS_KEY);

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

/*
|--------------------------------------------------------------------------
| SAVE BUDGET STATUSES
|--------------------------------------------------------------------------
*/

export const saveBudgetStatuses = async (statuses) => {
  try {
    await AsyncStorage.setItem(BUDGET_STATUS_KEY, JSON.stringify(statuses));

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

      /*
      |--------------------------------------------------------------------------
      | SAVE CURRENT STATUS
      |--------------------------------------------------------------------------
      */

      updatedStatuses[budget.id] = currentStatus;

      /*
      |--------------------------------------------------------------------------
      | FIRST TIME CHECK
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      | If there is no previous status, create a notification when
      | the budget is already warning/exceeded.
      |
      */

      if (!previousStatus) {
        if (currentStatus === "exceeded") {
          await addNotification({
            title: "Budget exceeded",
            message: `You have exceeded your ${
              budget.category_name || "category"
            } budget. You have spent ₦${spent.toLocaleString(
              "en-NG",
            )} out of your ₦${limit.toLocaleString("en-NG")} limit.`,
            type: "danger",
            budgetId: budget.id,
          });
        } else if (currentStatus === "warning") {
          await addNotification({
            title: "Budget limit approaching",
            message: `You have used ${percent}% of your ${
              budget.category_name || "category"
            } budget. You have ₦${Math.max(limit - spent, 0).toLocaleString(
              "en-NG",
            )} remaining.`,
            type: "warning",
            budgetId: budget.id,
          });
        }

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | SAFE → WARNING
      |--------------------------------------------------------------------------
      */

      if (currentStatus === "warning" && previousStatus === "safe") {
        await addNotification({
          title: "Budget limit approaching",
          message: `You have used ${percent}% of your ${
            budget.category_name || "category"
          } budget. You have ₦${Math.max(limit - spent, 0).toLocaleString(
            "en-NG",
          )} remaining.`,
          type: "warning",
          budgetId: budget.id,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | WARNING → EXCEEDED
      |--------------------------------------------------------------------------
      */

      if (currentStatus === "exceeded" && previousStatus !== "exceeded") {
        await addNotification({
          title: "Budget exceeded",
          message: `You have exceeded your ${
            budget.category_name || "category"
          } budget. You have spent ₦${spent.toLocaleString(
            "en-NG",
          )} out of your ₦${limit.toLocaleString("en-NG")} limit.`,
          type: "danger",
          budgetId: budget.id,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | WARNING/EXCEEDED → SAFE
      |--------------------------------------------------------------------------
      */

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

    /*
    |--------------------------------------------------------------------------
    | SAVE ALL CURRENT STATUSES
    |--------------------------------------------------------------------------
    */

    await saveBudgetStatuses(updatedStatuses);

    console.log("Budget notification check completed.");
  } catch (error) {
    console.log("Check budget notifications error:", error);
  }
};
