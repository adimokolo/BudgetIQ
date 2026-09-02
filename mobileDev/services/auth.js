import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";
import { TOKEN_KEY, USER_KEY } from "./constants";
import * as ImagePicker from "expo-image-picker";
/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);

    return response.data;
  } catch (error) {
    console.log("REGISTER API ERROR:", error);
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    throw (
      error.response?.data || {
        message: error.message || "Registration failed",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| VERIFY OTP
|--------------------------------------------------------------------------
*/

export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-otp", {
      email,
      otp,
    });

    const data = response.data;

    console.log("OTP VERIFICATION RESPONSE:", data);

    if (data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
    }

    if (data.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.log("OTP VERIFICATION ERROR:", error);
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    throw (
      error.response?.data || {
        message: error.message || "OTP verification failed",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| RESEND OTP
|--------------------------------------------------------------------------
*/

export const resendOTP = async (email) => {
  try {
    const response = await api.post("/auth/resend-otp", {
      email,
    });

    return response.data;
  } catch (error) {
    console.log("RESEND OTP ERROR:", error);

    throw (
      error.response?.data || {
        message: error.message || "Unable to resend OTP",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });

    const data = response.data;

    console.log("LOGIN RESPONSE:", data);

    if (data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
    }

    if (data.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.log("LOGIN API ERROR:", error);
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    throw (
      error.response?.data || {
        message: error.message || "Login failed",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| GET TOKEN
|--------------------------------------------------------------------------
*/

export const getToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

/*
|--------------------------------------------------------------------------
| GET SAVED USER
|--------------------------------------------------------------------------
*/

export const getSavedUser = async () => {
  const user = await AsyncStorage.getItem(USER_KEY);

  return user ? JSON.parse(user) : null;
};

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

export const logoutUser = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
};

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");

    return response.data;
  } catch (error) {
    console.log("GET CURRENT USER ERROR:", error);

    throw (
      error.response?.data || {
        message: error.message || "Unable to get current user",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password-otp", {
      email: email.trim().toLowerCase(),
    });

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: error.message || "Unable to process password reset",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| VERIFY RESET OTP
|--------------------------------------------------------------------------
*/

export const verifyResetOTP = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-reset-otp", {
      email: email.trim().toLowerCase(),
      code: otp,
    });

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: error.message || "Unable to verify reset OTP",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| RESET PASSWORD (with OTP)
|--------------------------------------------------------------------------
*/

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await api.post("/auth/reset-password-otp", {
      email: email.trim().toLowerCase(),
      code: otp,
      newPassword,
    });

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: error.message || "Unable to reset password",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| UPLOAD AVATAR
|--------------------------------------------------------------------------
*/

export const uploadAvatar = async (avatarDataUrl) => {
  try {
    const response = await api.patch("/auth/avatar", { avatarDataUrl });

    return response.data;
  } catch (error) {
    console.log("UPLOAD AVATAR ERROR:", error);
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    throw (
      error.response?.data || {
        message: error.message || "Unable to upload profile picture",
      }
    );
  }
};
