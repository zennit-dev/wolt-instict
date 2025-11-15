import { Stack } from "expo-router";
import "expo-dev-client";
import "../globals.css";
import { View } from "react-native";
import { NavigationBar } from "@/components/navigation-bar";

export default () => {
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#141414",
          },
        }}
      />
      <NavigationBar />
    </View>
  );
};
