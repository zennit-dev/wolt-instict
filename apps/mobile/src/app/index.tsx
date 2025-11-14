import { ScrollView, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@zenncore/mobile/components/text";
import { ChevronDownIcon } from "@zenncore/icons";
import { NavigationBar } from "@/components/navigation-bar";

export default () => {
  return (
    <SafeAreaView className="flex-1 bg-background text-foreground">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
            <Text className="text-lg text-foreground">👤</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-base text-foreground">
              Your Current Location
            </Text>
            <ChevronDownIcon className="size-4 text-foreground-dimmed" />
          </View>
        </View>
        <View className="relative">
          <Text className="text-xl">🔔</Text>
          <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-info-rich" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Football Match Card */}
        <View className="mx-4 mt-2 mb-6">
          <View className="bg-secondary/30 rounded-2xl p-5 overflow-hidden">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-xl font-semibold flex-1 pr-2">
                For Today's Football Match
              </Text>
              <View className="flex-row gap-2">
                <Text className="text-3xl">⚽</Text>
                <Text className="text-3xl">🍿</Text>
              </View>
            </View>
            <View className="bg-accent/50 rounded-xl h-32 items-center justify-center">
              <Text className="text-foreground-dimmed text-sm">
                Content placeholder
              </Text>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View className="mb-6">
          <Text className="text-xl font-semibold text-center mb-4">
            Categories
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4"
            contentContainerStyle={{ gap: 12 }}
          >
            {/* Restaurants */}
            <Pressable className="w-20 items-center gap-2">
              <View className="w-16 h-16 bg-accent rounded-xl items-center justify-center">
                <Text className="text-3xl">🍝</Text>
              </View>
              <Text className="text-xs text-center">Restaurants</Text>
            </Pressable>

            {/* Groceries */}
            <Pressable className="w-20 items-center gap-2">
              <View className="w-16 h-16 bg-accent rounded-xl items-center justify-center">
                <Text className="text-3xl">🥑</Text>
              </View>
              <Text className="text-xs text-center">Groceries</Text>
            </Pressable>

            {/* Wolt Market */}
            <Pressable className="w-20 items-center gap-2">
              <View className="w-16 h-16 bg-accent rounded-xl items-center justify-center">
                <Text className="text-3xl">🛒</Text>
              </View>
              <Text className="text-xs text-center">Wolt Market</Text>
            </Pressable>

            {/* Pharmacy */}
            <Pressable className="w-20 items-center gap-2">
              <View className="w-16 h-16 bg-accent rounded-xl items-center justify-center">
                <Text className="text-3xl">🏥</Text>
              </View>
              <Text className="text-xs text-center">Pharmacy</Text>
            </Pressable>

            {/* Pickup */}
            <Pressable className="w-20 items-center gap-2">
              <View className="w-16 h-16 bg-accent rounded-xl items-center justify-center">
                <Text className="text-3xl">📦</Text>
              </View>
              <Text className="text-xs text-center">Pickup</Text>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>

      <NavigationBar />
    </SafeAreaView>
  );
};
