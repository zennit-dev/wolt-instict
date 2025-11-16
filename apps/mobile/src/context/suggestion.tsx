import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  type Type,
  type SuggestionOverrides,
  getSuggestions,
} from "@/server/suggestions";
import { useCurrentSession } from "./auth";

// Equal distribution: Health, Sports, Sunday/Events, Work Break
const overrides: (SuggestionOverrides | undefined)[] = [
  // Health (25%) - post-workout, fitness, wellness
  {
    scenario: "post-workout",
    meal: "lunch",
  },
  // Sports/Events (25%) - game day, sports events
  {
    context: "Super Bowl Sunday - game day snacks and drinks",
    meal: "snack",
  },
  // Sunday/Events (25%) - weekend events, movie nights
  {
    context: "Sunday Football - game day snacks and drinks",
    meal: "snack",
  },
  // Work Break (25%) - coffee break, breakfast at work
  {
    meal: "breakfast",
  },
];

export const SuggestionContext = createContext<{
  suggestion: Type | undefined;
  isPending: boolean;
  shuffle: () => void;
  isShuffling: boolean;
} | null>(null);

export const SuggestionProvider = ({ children }: PropsWithChildren) => {
  const { user } = useCurrentSession();

  const [counter, setCounter] = useState(0);

  // Select a random override based on shuffle counter (deterministic)
  const override = useMemo(() => {
    const index = counter % overrides.length;
    return overrides[index];
  }, [counter]);

  const {
    data: suggestion,
    isFetching,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["suggestions", counter],
    queryFn: () => getSuggestions(user.id, override),
    placeholderData: keepPreviousData,
  });

  console.log({ error });

  const context = useMemo(
    () => ({
      suggestion,
      isPending: isLoading,
      isShuffling: isFetching,
      shuffle: () => setCounter((prev) => prev + 1),
    }),
    [suggestion, isFetching, isLoading]
  );

  return (
    <SuggestionContext.Provider value={context}>
      {children}
    </SuggestionContext.Provider>
  );
};

export const useSuggestion = () => {
  const context = useContext(SuggestionContext);

  if (!context)
    throw new Error("useSuggestion must be used within a SuggestionProvider");

  return context;
};
