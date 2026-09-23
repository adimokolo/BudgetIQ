import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

// Replace these with your real Google banner ad unit IDs.
// Do not use your Google App IDs here.

const GOOGLE_AD_UNITS = {
  android: "YOUR_ANDROID_BANNER_UNIT_ID",
  ios: "YOUR_IOS_BANNER_UNIT_ID",
};

// Keep production ads disabled until you have
// completed the required consent and privacy setup.
export const ENABLE_PRODUCTION_ADS = false;

export const getBannerAdUnitId = () => {
  if (__DEV__) {
    return TestIds.ADAPTIVE_BANNER;
  }

  if (!ENABLE_PRODUCTION_ADS) {
    return null;
  }

  const adUnitId = Platform.select({
    android: GOOGLE_AD_UNITS.android,
    ios: GOOGLE_AD_UNITS.ios,
    default: null,
  });

  if (!adUnitId || adUnitId.startsWith("YOUR_")) {
    return null;
  }

  return adUnitId;
};
