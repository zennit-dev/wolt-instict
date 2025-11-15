export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type SuggestionType =
  | "proactiveMeal"
  | "proactiveGroceries"
  | "groupOrder";

export interface MealRecommendationParams {
  userId: string;
  itemId?: string;
  dayOfWeek: DayOfWeek;
  timeOfDay: TimeOfDay;
  atWork: boolean;
  atHome: boolean;
  wasTraining: boolean;
  temperature: number;
  rain: boolean;
  season: Season;
  paydayDistance: number;
  holiday: boolean;
  price?: number;
  category?: string;
  brand?: string;
  pastBuys?: number;
  pastRecency?: number;
  avgGap?: number;
  avgQuantity?: number;
  isRecurring?: boolean;
  itemPopularity?: number;
  // Additional context fields for Wolt Instinct
  healthActivityType?: string;
  healthActivityDuration?: number;
  healthGoal?: string;
  calendarEventType?: string;
  calendarEventParticipants?: number;
}

export interface SuggestionItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface Suggestion {
  restaurantId: string;
  restaurantName: string;
  items: SuggestionItem[];
  totalPrice: number;
  justification: string;
}

export interface MealRecommendationResponse {
  suggestionType: SuggestionType;
  confidence: number;
  primarySuggestion: Suggestion;
  alternativeSuggestion: Suggestion;
}
