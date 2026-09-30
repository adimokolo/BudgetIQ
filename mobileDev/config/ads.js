import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

export const ENABLE_PRODUCTION_ADS = true;

const PRODUCTION_BANNER_AD_UNIT_ID = {
  ios: "ca-app-pub-8683588639077779/2077594847",
  android: "ca-app-pub-8683588639077779/2356796449",
};

export const getBannerAdUnitId = () => {
  if (!ENABLE_PRODUCTION_ADS) {
    return TestIds.ADAPTIVE_BANNER;
  }

  const id = Platform.select(PRODUCTION_BANNER_AD_UNIT_ID);

  if (!id || id.includes("XXXX")) {
    console.warn(
      "Production ad unit ID is missing or still a placeholder — falling back to test ads.",
    );
    return TestIds.ADAPTIVE_BANNER;
  }

  return id;
};
