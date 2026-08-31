import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const TREND_COPY = {
  up: {
    label: "Trending up",
    tone: "warning",
  },

  down: {
    label: "Trending down",
    tone: "income",
  },

  flat: {
    label: "Holding steady",
    tone: "income",
  },
};

/*
|--------------------------------------------------------------------------
| CURRENCY FORMATTER
|--------------------------------------------------------------------------
*/

function formatCurrency(amount, currency = "NGN") {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    return `${currency} ${numericAmount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/*
|--------------------------------------------------------------------------
| FORECAST CARD
|--------------------------------------------------------------------------
*/

export default function ForecastCard({ forecast, currency = "NGN", colors }) {
  const trend = TREND_COPY[forecast?.trend] || TREND_COPY.flat;

  const confidenceText =
    forecast?.confidence === "low"
      ? "Building confidence"
      : `${forecast?.confidence || "low"} confidence`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors?.card || "#111827",
          borderColor: colors?.cardBorder || "#334155",
        },
      ]}
    >
      {/* Decorative gradient glow */}

      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(99, 102, 241, 0.45)",
          "rgba(168, 85, 247, 0.25)",
          "rgba(20, 39, 78, 0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientGlow}
      />

      {/* TITLE */}

      <Text
        style={[
          styles.statLabel,
          {
            color: colors?.textFaint || "#71809B",
          },
        ]}
      >
        NEXT MONTH'S
        {"\n"}
        FORECAST
      </Text>

      {/* FORECAST VALUE */}

      <Text
        style={[
          styles.statValue,
          {
            color: colors?.text || "#E5E7EB",
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatCurrency(forecast?.nextMonthPredictedExpense, currency)}
      </Text>

      {/* TREND + CONFIDENCE */}

      <View style={styles.pillsContainer}>
        {/* TREND */}

        <View
          style={[
            styles.pill,
            trend.tone === "warning" ? styles.warningPill : styles.incomePill,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              trend.tone === "warning" ? styles.warningText : styles.incomeText,
            ]}
          >
            {trend.label}
          </Text>
        </View>

        {/* CONFIDENCE */}

        <View
          style={[
            styles.pill,
            {
              backgroundColor: colors?.surfaceStrong || "#252A3B",
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              {
                color: colors?.textFaint || "#71809B",
              },
            ]}
          >
            {confidenceText}
          </Text>
        </View>
      </View>

      {/* DESCRIPTION */}

      <Text
        style={[
          styles.helperText,
          {
            color: colors?.textFaint || "#71809B",
          },
        ]}
      >
        Estimated from your last few months of spending. More history sharpens
        the forecast.
      </Text>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 250,

    borderRadius: 20,

    borderWidth: 1,

    padding: 28,

    position: "relative",

    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },

  /*
  |--------------------------------------------------------------------------
  | GRADIENT
  |--------------------------------------------------------------------------
  */

  gradientGlow: {
    position: "absolute",

    top: -45,
    right: -45,

    width: 150,
    height: 150,

    borderRadius: 75,

    opacity: 0.55,
  },

  /*
  |--------------------------------------------------------------------------
  | LABEL
  |--------------------------------------------------------------------------
  */

  statLabel: {
    fontSize: 15,

    fontWeight: "800",

    letterSpacing: 0.8,

    lineHeight: 19,

    marginBottom: 12,
  },

  /*
  |--------------------------------------------------------------------------
  | VALUE
  |--------------------------------------------------------------------------
  */

  statValue: {
    fontSize: 30,

    fontWeight: "800",

    letterSpacing: 0.4,

    marginBottom: 14,
  },

  /*
  |--------------------------------------------------------------------------
  | PILLS
  |--------------------------------------------------------------------------
  */

  pillsContainer: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",

    gap: 8,

    marginTop: 2,
  },

  pill: {
    borderRadius: 18,

    paddingVertical: 7,

    paddingHorizontal: 14,

    minHeight: 34,

    justifyContent: "center",
  },

  incomePill: {
    backgroundColor: "rgba(16, 185, 129, 0.18)",
  },

  warningPill: {
    backgroundColor: "rgba(245, 158, 11, 0.18)",
  },

  pillText: {
    fontSize: 13,

    fontWeight: "700",
  },

  incomeText: {
    color: "#20D9A0",
  },

  warningText: {
    color: "#F59E0B",
  },

  /*
  |--------------------------------------------------------------------------
  | HELPER TEXT
  |--------------------------------------------------------------------------
  */

  helperText: {
    fontSize: 14,

    lineHeight: 20,

    marginTop: 14,

    maxWidth: 310,
  },
});
