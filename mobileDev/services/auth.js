import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { saveToken, readToken, removeToken } from "./api";
import { USER_KEY } from "./constants";

// Logs only safe fields, and only in development.
// Never log the raw axios error: it includes request headers (JWT) and body (passwords).
const logApiError = (label, error) => {
  if (!__DEV__) return;

  console.log(`${label}:`, {
    message: error?.message,
    status: error?.response?.status,
    data: error?.response?.data,
  });
};

// Normalises whatever went wrong into an object with a `message`.
const toApiError = (error, fallbackMessage) =>
  error?.response?.data || {
    message: error?.message || fallbackMessage,
  };

export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);

    return response.data;
  } catch (error) {
    logApiError("REGISTER API ERROR", error);

    throw toApiError(error, "Registration failed");
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-otp", {
      email,
      otp,
    });

    const data = response.data;

    if (data.token) {
      await saveToken(data.token);
    }

    if (data.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    logApiError("OTP VERIFICATION ERROR", error);

    throw toApiError(error, "OTP verification failed");
  }
};

export const resendOTP = async (email) => {
  try {
    const response = await api.post("/auth/resend-otp", {
      email,
    });

    return response.data;
  } catch (error) {
    logApiError("RESEND OTP ERROR", error);

    throw toApiError(error, "Unable to resend OTP");
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });

    const data = response.data;

    if (data.token) {
      await saveToken(data.token);
    }

    if (data.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    logApiError("LOGIN API ERROR", error);

    throw toApiError(error, "Login failed");
  }
};

export const getToken = async () => {
  return await readToken();
};

export const getSavedUser = async () => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);

    return user ? JSON.parse(user) : null;
  } catch (error) {
    // Corrupted or unreadable saved user: treat as logged out
    await AsyncStorage.removeItem(USER_KEY);

    return null;
  }
};

export const logoutUser = async () => {
  await removeToken();
  await AsyncStorage.removeItem(USER_KEY);
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");

    return response.data;
  } catch (error) {
    logApiError("GET CURRENT USER ERROR", error);

    throw toApiError(error, "Unable to get current user");
  }
};

export const deleteAccount = async () => {
  try {
    const response = await api.delete("/auth/account");

    return response.data;
  } catch (error) {
    logApiError("DELETE ACCOUNT API ERROR", error);

    throw toApiError(error, "Unable to delete your account.");
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password-otp", {
      email: email.trim().toLowerCase(),
    });

    return response.data;
  } catch (error) {
    logApiError("FORGOT PASSWORD ERROR", error);

    throw toApiError(error, "Unable to process password reset");
  }
};

export const verifyResetOTP = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-reset-otp", {
      email: email.trim().toLowerCase(),
      code: otp,
    });

    return response.data;
  } catch (error) {
    logApiError("VERIFY RESET OTP ERROR", error);

    throw toApiError(error, "Unable to verify reset OTP");
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await api.post("/auth/reset-password-otp", {
      email: email.trim().toLowerCase(),
      code: otp,
      newPassword,
    });

    return response.data;
  } catch (error) {
    logApiError("RESET PASSWORD ERROR", error);

    throw toApiError(error, "Unable to reset password");
  }
};

export const uploadAvatar = async (avatarDataUrl) => {
  try {
    const response = await api.patch("/auth/avatar", {
      avatarDataUrl,
    });

    return response.data;
  } catch (error) {
    logApiError("UPLOAD AVATAR ERROR", error);

    throw toApiError(error, "Unable to upload profile picture");
  }
};
