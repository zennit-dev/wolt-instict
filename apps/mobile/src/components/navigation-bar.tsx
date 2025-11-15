import {
  BagSearchIcon,
  BuildingIcon,
  StoreIcon,
  UserIcon,
  UtencilesIcon,
} from "@zenncore/icons";
import { Pressable, Text, View } from "react-native";

const routes = [
  {
    name: "Discovery",
    icon: BuildingIcon,
  },
  {
    name: "Restaurants",
    icon: UtencilesIcon,
  },
  {
    name: "Stores",
    icon: StoreIcon,
  },
  {
    name: "Search",
    icon: BagSearchIcon,
  },
  {
    name: "Profile",
    icon: UserIcon,
  },
];
export const NavigationBar = () => {
  return (
    <View className="bg-background-dimmed pt-6 pb-safe">
      <View className="flex-row items-center justify-around">
        {routes.map((route) => (
          <Pressable
            key={route.name}
            className="flex flex-1 flex-col items-center justify-center gap-2"
          >
            <route.icon className="size-12 fill-foreground-dimmed" />
            <Text className="mt-1 text-foreground-dimmed text-sm">
              {route.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
