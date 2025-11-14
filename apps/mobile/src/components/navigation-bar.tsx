import { Pressable, View, Text } from "react-native";
import {
  BuildingIcon,
  UtencilesIcon,
  StoreIcon,
  BagSearchIcon,
  UserIcon,
} from "@zenncore/icons";

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
    <View className="bg-background-dimmed border-t border-accent-foreground pb-safe pt-6">
      <View className="flex-row justify-around items-center">
        {routes.map((route) => (
          <Pressable
            key={route.name}
            className="items-center justify-center gap-2 flex flex-col"
          >
           <route.icon className="size-12"/>
            <Text className="mt-1 text-foreground-dimmed">{route.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
