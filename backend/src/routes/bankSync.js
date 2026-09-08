const express = require("express");

const router = express.Router();

const MONO_API_URL = "https://api.withmono.com";

/**
 * ==========================================
 * BANK SYNC HEALTH CHECK
 * ==========================================
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    provider: "mono",
    message: "Bank sync route is working.",
  });
});

/**
 * ==========================================
 * INITIATE MONO BANK CONNECTION
 * ==========================================
 */
router.post("/initiate", async (req, res) => {
  try {
    const secretKey = process.env.MONO_SEC_KEY;

    console.log(
      "MONO KEY STATUS:",
      secretKey ? `Loaded - ${secretKey.length} characters` : "NOT LOADED",
    );

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        error: "MONO_SEC_KEY is not configured",
      });
    }

    const { name, email, reference } = req.body || {};

    console.log("MONO CUSTOMER:", {
      name,
      email,
    });

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Customer name and email are required.",
      });
    }

    const redirectUrl =
      process.env.MONO_REDIRECT_URL || "budgetiqmobileapp://bank-sync";

    const metaRef =
      reference ||
      `budgetiq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    console.log("MONO REDIRECT URL:", redirectUrl);
    console.log("MONO REFERENCE:", metaRef);

    const monoResponse = await fetch(`${MONO_API_URL}/v2/accounts/initiate`, {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "mono-sec-key": secretKey,
      },

      body: JSON.stringify({
        customer: {
          name: String(name).trim(),
          email: String(email).trim(),
        },

        meta: {
          ref: metaRef,
        },

        scope: "auth",

        redirect_url: redirectUrl,
      }),
    });

    const data = await monoResponse.json().catch(() => null);

    console.log("MONO RESPONSE STATUS:", monoResponse.status);

    console.log("MONO RESPONSE:", JSON.stringify(data, null, 2));

    if (!monoResponse.ok) {
      return res.status(monoResponse.status || 500).json({
        success: false,

        error:
          data?.message ||
          data?.error ||
          data?.details?.message ||
          "Mono failed to initialize bank synchronization.",

        mono: data,
      });
    }

    const monoUrl = data?.data?.mono_url || data?.mono_url;

    if (!monoUrl) {
      console.error("MONO DID NOT RETURN A CONNECTION URL:", data);

      return res.status(502).json({
        success: false,
        error: "Mono did not return a connection link.",
        mono: data,
      });
    }

    console.log("MONO CONNECTION URL RECEIVED");

    return res.json({
      success: true,
      provider: "mono",
      link: monoUrl,
      redirectUrl,
      reference: metaRef,
    });
  } catch (error) {
    console.error("BANK SYNC INITIATE ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Unable to initialize bank synchronization.",
    });
  }
});

/**
 * ==========================================
 * AUTHORIZE MONO ACCOUNT
 * ==========================================
 */
router.post("/accounts", async (req, res) => {
  try {
    const secretKey = process.env.MONO_SEC_KEY;

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        error: "MONO_SEC_KEY is not configured",
      });
    }

    const { code } = req.body || {};

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Mono authorization code is required.",
      });
    }

    const monoResponse = await fetch(`${MONO_API_URL}/v2/accounts/auth`, {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "mono-sec-key": secretKey,
      },

      body: JSON.stringify({
        code,
      }),
    });

    const data = await monoResponse.json().catch(() => null);

    console.log("MONO AUTH RESPONSE:", JSON.stringify(data, null, 2));

    if (!monoResponse.ok) {
      return res.status(monoResponse.status || 500).json({
        success: false,

        error:
          data?.message ||
          data?.error ||
          data?.details?.message ||
          "Mono failed to authorize the bank account.",

        mono: data,
      });
    }

    return res.json({
      success: true,
      provider: "mono",
      data: data?.data || data,
    });
  } catch (error) {
    console.error("BANK SYNC AUTH ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Unable to authorize bank account.",
    });
  }
});

/**
 * ==========================================
 * GET MONO ACCOUNT
 * ==========================================
 */
router.get("/account/:accountId", async (req, res) => {
  try {
    const secretKey = process.env.MONO_SEC_KEY;

    const { accountId } = req.params;

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        error: "MONO_SEC_KEY is not configured",
      });
    }

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "Account ID is required.",
      });
    }

    const monoResponse = await fetch(
      `${MONO_API_URL}/v2/accounts/${encodeURIComponent(accountId)}`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
          "mono-sec-key": secretKey,
        },
      },
    );

    const data = await monoResponse.json().catch(() => null);

    if (!monoResponse.ok) {
      return res.status(monoResponse.status || 500).json({
        success: false,

        error:
          data?.message ||
          data?.error ||
          data?.details?.message ||
          "Unable to retrieve Mono account.",

        mono: data,
      });
    }

    return res.json({
      success: true,
      provider: "mono",
      data: data?.data || data,
    });
  } catch (error) {
    console.error("MONO ACCOUNT ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Unable to retrieve bank account.",
    });
  }
});

/**
 * ==========================================
 * GET MONO ACCOUNT TRANSACTIONS
 * ==========================================
 */
router.get("/account/:accountId/transactions", async (req, res) => {
  try {
    const secretKey = process.env.MONO_SEC_KEY;

    const { accountId } = req.params;

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        error: "MONO_SEC_KEY is not configured",
      });
    }

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "Account ID is required.",
      });
    }

    const monoResponse = await fetch(
      `${MONO_API_URL}/v2/accounts/${encodeURIComponent(
        accountId,
      )}/transactions`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
          "mono-sec-key": secretKey,
        },
      },
    );

    const data = await monoResponse.json().catch(() => null);

    if (!monoResponse.ok) {
      return res.status(monoResponse.status || 500).json({
        success: false,

        error:
          data?.message ||
          data?.error ||
          data?.details?.message ||
          "Unable to retrieve Mono transactions.",

        mono: data,
      });
    }

    return res.json({
      success: true,
      provider: "mono",
      data: data?.data || data,
    });
  } catch (error) {
    console.error("MONO TRANSACTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Unable to retrieve bank transactions.",
    });
  }
});

/**
 * ==========================================
 * MONO WEBHOOK
 * ==========================================
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log("====================================");

    console.log("MONO WEBHOOK RECEIVED");

    console.log(JSON.stringify(req.body, null, 2));

    console.log("====================================");

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("MONO WEBHOOK ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Webhook processing failed.",
    });
  }
});

module.exports = router;
