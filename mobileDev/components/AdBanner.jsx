import React from "react";
import { View, Platform, StyleSheet } from "react-native";

let BannerAd, BannerAdSize, TestIds;
try {
  ({
    BannerAd,
    BannerAdSize,
    TestIds,
  } = require("react-native-google-mobile-ads"));
} catch (e) {
  console.log("Google Mobile Ads native module unavailable:", e.message);
}

const AD_UNIT_IDS = {
  android: "ca-app-pub-1490675395669448/1102787466",
  ios: "ca-app-pub-1490675395669448/1314451169",
};

const ENABLE_LIVE_ADS = false;

export default function AdBanner() {
  // Native module missing (Expo Go or stale dev build): skip ads
  if (!BannerAd) return null;

  const productionAdUnitId = Platform.select({
    android: AD_UNIT_IDS.android,
    ios: AD_UNIT_IDS.ios,
    default: null,
  });

  const adUnitId = __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : ENABLE_LIVE_ADS
      ? productionAdUnitId
      : null;

  if (!adUnitId) return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => console.log("BudgetIQ banner loaded successfully")}
        onAdFailedToLoad={(error) =>
          console.log("BudgetIQ banner error:", error.message)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
});
