import {
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DeliveryManIcon,
  ShoppingCartIcon,
  ShuffleIcon,
  UserIcon,
} from "@zenncore/icons";
import { Button } from "@zenncore/mobile/components/button";
import { Image } from "@zenncore/mobile/components/image";
import { cn } from "@zenncore/utils";
import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const icons = {
  football_popcorn: require("@/assets/images/icons/football_popcorn.png"),
  cinema_gaming: require("@/assets/images/icons/cinema_gaming.png"),
  running: require("@/assets/images/icons/running.png"),
  coffee_work: require("@/assets/images/icons/coffee_work.png"),
};

export default () => {
  return (
    <SafeAreaView className="z-50 flex flex-1 flex-col gap-4 px-4 text-foreground-rich">
      <Image
        source={require("@/assets/images/banner.png")}
        className="-top-1/2 absolute h-[64rem] w-screen"
      />
      <View className="flex-row items-center justify-between py-3">
        <UserIcon className="size-10 fill-foreground" />
        <View className="flex-row items-center gap-1">
          <Text className="text-base text-foreground">
            Your Current Location
          </Text>
          <ChevronDownIcon className="size-4 fill-foreground" />
        </View>
        <BellIcon className="size-10 fill-foreground" />
      </View>
      {cards.map((card) => (
        <View
          className="flex w-full flex-1 flex-col gap-2 rounded-3xl p-4"
          key={card.title}
          style={{ backgroundColor: card.background }}
        >
          <View className="flex w-full flex-row items-center justify-between">
            <Text className="flex-1 font-semibold text-2xl text-foreground">
              {card.title}
            </Text>
            <View className="flex flex-1 items-end">
              <Image source={icons[card.icon]} className="h-20 w-20" />
            </View>
          </View>
          {card.group && (
            <View className="mb-2 w-full flex-row items-center gap-2 rounded-3xl bg-white/10 p-4">
              <View className="flex flex-row items-center">
                {card.group.friends.slice(0, 3).map((friend, index) => (
                  <Image
                    key={friend.name}
                    source={friend.avatar}
                    className={cn(
                      "-ml-2 size-8 rounded-full border-2 border-white/30",
                      index === 0 && "ml-0",
                    )}
                  />
                ))}
              </View>
              <Text className="text-foreground">
                See what your friends are ordering
              </Text>
              <ChevronRightIcon className="ml-auto fill-foreground" />
            </View>
          )}
          <View className="flex flex-row items-center justify-between px-4">
            <View className="flex flex-row items-center gap-2">
              <DeliveryManIcon className="size-6 fill-foreground" />
              <Text className="text-foreground text-lg">
                {(card.time - 300) / 60} - {(card.time + 300) / 60} Min
              </Text>
            </View>
            <View className="flex flex-row items-center gap-2">
              <ShuffleIcon className="size-6 fill-foreground" />
              <Text className="text-foreground text-lg">Shuffle</Text>
            </View>
          </View>
          <View className="flex-1 overflow-hidden rounded-3xl bg-white/10 px-4">
            <ScrollView
              className="flex flex-1 gap-1"
              contentContainerClassName="grow py-4 gap-4"
            >
              {card.items.map((item) => (
                <View className="flex-row gap-4" key={item.title}>
                  <Image
                    source={item.image}
                    className="size-28 rounded-xl"
                    contentFit="cover"
                  />
                  <View className="h-[110px] flex-1 border-white/40 border-b">
                    <Text className="font-semibold text-foreground text-xl">
                      {item.title}
                    </Text>
                    <Text
                      className="text-foreground opacity-60"
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                    <Text className="mt-2 font-bold text-3xl text-[#FFCB77]">
                      €{item.price}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View
              className="absolute inset-x-0 bottom-0 h-48 flex-1"
              style={{
                experimental_backgroundImage:
                  "linear-gradient(180deg, rgba(26, 67, 81, 0) 0%, rgba(26, 67, 81, 0.7) 100%)",
              }}
            />
            <Link href={"/cart"} asChild>
              <Button className="absolute inset-x-4 bottom-4 w-full items-center gap-2 rounded-2xl">
                <ShoppingCartIcon className="size-6 fill-foreground" />
                <View className="flex-row items-center gap-1">
                  <Text className="text-foreground text-lg">Add to Card</Text>
                  <Text className="font-semibold text-foreground text-lg">
                    €
                    {card.items
                      .reduce((sum, { price }) => sum + price, 0)
                      .toFixed(2)}
                  </Text>
                </View>
              </Button>
            </Link>
          </View>
        </View>
      ))}
    </SafeAreaView>
  );
};

type AISuggestion = {
  background: string; // color
  group?: {
    friends: {
      name: string;
      avatar: string;
    }[];
  };
  title: string;
  items: {
    title: string;
    image: string;
    description: string;
    price: number;
  }[];
  icon: "football_popcorn" | "sushi" | "burger" | "salad" | "dessert";
  time: number; // seconds to prepare the order and deliver
};
const cards = [
  {
    background: "#1A4351",
    title: "For Today's 🇫🇮 Football Match",
    items: [
      {
        title: "Classic Pepperoni Pizza",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Pizza-3007395.jpg/1200px-Pizza-3007395.jpg",
        description: "Gluten Free and Vegan Pizza, with extra cheese",
        price: 12.99,
      },
      {
        title: "Loaded Nachos",
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6ui4fvm7xt0Z30qeSjF9ZnSSxjfgpcMCWew&s",
        description: "Tortilla chips topped with melted cheese and jalapenos",
        price: 8.5,
      },
      {
        title: "Chicken Wings",
        image:
          "https://www.thecookierookie.com/wp-content/uploads/2024/02/bbq-chicken-wings-recipe-2.jpg",
        description: "Spicy buffalo wings served with blue cheese dip",
        price: 10.0,
      },
    ],
    group: {
      friends: [
        {
          name: "Alice",
          avatar:
            "https://i.scdn.co/image/ab6761610000e5eb04673b566c0df820fb92d602",
        },
        {
          name: "Bob",
          avatar:
            "https://i.scdn.co/image/ab6761610000e5eb04673b566c0df820fb92d602",
        },
      ],
    },
    icon: "football_popcorn",
    time: 600,
  },
] satisfies AISuggestion[];
