import { Stack } from "expo-router";
import "expo-dev-client";
import "../globals.css";
import { Image } from "@zenncore/mobile/components/image";
import { NavigationBar } from "@/components/navigation-bar";

export default () => {
  return (
    <>
      <Image
        src={require("@/assets/images/banner.png")}
        className="w-screen h-auto"
      />
      <Stack screenOptions={{ headerShown: false }} />
      <NavigationBar />
    </>
  );
};
