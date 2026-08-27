import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import SplashScreenView from "../components/SplashScreenView";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await new Promise((r) => setTimeout(r, 1500));
      setReady(true);
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  if (!ready) {
    return <SplashScreenView />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
