import { writeFileSync } from "fs";
import { join } from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================
const NUM_ROWS = 1000; // Change this to generate more or fewer rows
const OUTPUT_FILE = "dummy-data.csv"; // Output filename
// ============================================================================

type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
type Season = "spring" | "summer" | "autumn" | "winter";

const DAYS_OF_WEEK: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES_OF_DAY: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

const CATEGORIES = ["breakfast", "lunch", "brunch", "dinner", "snack", "dessert", "beverage"];
const BRANDS = [
  "HealthyBites", "SushiExpress", "ProteinPlus", "BurgerHouse", "PizzaPalace",
  "SmoothieBar", "CafeBrunch", "ThaiCuisine", "BagelShop", "SaladBowl",
  "SteakHouse", "MexicanFood", "SeafoodRestaurant", "ItalianPlace", "VeganKitchen",
  "CoffeeShop", "BBQRestaurant", "TapasBar", "FineDining", "FoodTruck",
  "JapaneseRestaurant", "IndianCuisine", "Mediterranean", "KoreanBBQ", "FrenchBistro"
];

const HEALTH_ACTIVITIES = ["running", "gym", "yoga", "cycling", "swimming", "boxing", "pilates", "meditation", "hiking"];
const HEALTH_GOALS = ["weight_loss", "muscle_gain", "fitness", "wellness", "endurance", "flexibility"];
const CALENDAR_EVENT_TYPES = [
  "team_meeting", "business_lunch", "date_night", "family_gathering", "office_party",
  "team_lunch", "work_dinner", "lunch_meeting", "date", "family_brunch", "friends_hangout",
  "birthday_party", "anniversary", "new_years_eve", "client_meeting"
];

// CSV Header
const CSV_HEADER = [
  "userId",
  "dayOfWeek",
  "timeOfDay",
  "atWork",
  "atHome",
  "wasTraining",
  "temperature",
  "rain",
  "season",
  "paydayDistance",
  "holiday",
  "itemId",
  "price",
  "category",
  "brand",
  "pastBuys",
  "pastRecency",
  "avgGap",
  "avgQuantity",
  "isRecurring",
  "itemPopularity",
  "healthActivityType",
  "healthActivityDuration",
  "healthGoal",
  "calendarEventType",
  "calendarEventParticipants"
].join(",");

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return Number.parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function generateTemperature(season: Season): number {
  const ranges = {
    winter: { min: -5, max: 15 },
    spring: { min: 10, max: 25 },
    summer: { min: 20, max: 35 },
    autumn: { min: 5, max: 20 }
  };
  const range = ranges[season];
  return randomInt(range.min, range.max);
}

function generateRow(userIndex: number): string {
  const userId = `user${String(userIndex + 1).padStart(6, "0")}`;
  const dayOfWeek = randomChoice(DAYS_OF_WEEK);
  const timeOfDay = randomChoice(TIMES_OF_DAY);
  const season = randomChoice(SEASONS);
  const temperature = generateTemperature(season);
  
  // Contextual boolean logic
  const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";
  const atWork = !isWeekend && timeOfDay !== "night" && randomBool(0.7);
  const atHome = !atWork || (isWeekend && randomBool(0.8));
  const wasTraining = randomBool(0.25);
  const rain = randomBool(0.3);
  const holiday = randomBool(0.1);
  
  // Generate optional fields with realistic probability
  const hasItemData = randomBool(0.8);
  const itemId = hasItemData ? `i${randomInt(100, 999)}` : "";
  const price = hasItemData ? randomFloat(8.0, 30.0) : "";
  const category = hasItemData ? randomChoice(CATEGORIES) : "";
  const brand = hasItemData ? randomChoice(BRANDS) : "";
  
  const hasHistory = randomBool(0.7);
  const pastBuys = hasHistory ? randomInt(1, 50) : "";
  const pastRecency = hasHistory ? randomInt(1, 14) : "";
  const avgGap = hasHistory ? randomInt(1, 7) : "";
  const avgQuantity = hasHistory ? randomInt(1, 3) : "";
  const isRecurring = hasHistory && randomBool(0.6) ? 1 : (hasHistory ? 0 : "");
  const itemPopularity = hasItemData ? randomFloat(0.3, 0.95) : "";
  
  // Health activity (more likely if wasTraining)
  const hasHealthActivity = wasTraining || randomBool(0.15);
  const healthActivityType = hasHealthActivity ? randomChoice(HEALTH_ACTIVITIES) : "";
  const healthActivityDuration = hasHealthActivity ? randomInt(15, 120) : "";
  const healthGoal = hasHealthActivity ? randomChoice(HEALTH_GOALS) : "";
  
  // Calendar events (more likely during work hours and weekends)
  const hasCalendarEvent = randomBool(0.2);
  const calendarEventType = hasCalendarEvent ? randomChoice(CALENDAR_EVENT_TYPES) : "";
  const calendarEventParticipants = hasCalendarEvent ? randomInt(2, 15) : "";
  
  const paydayDistance = randomInt(0, 14);
  
  // Escape CSV values (handle empty strings and commas)
  const escapeCSV = (value: string | number | boolean | ""): string => {
    if (value === "" || value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  return [
    escapeCSV(userId),
    escapeCSV(dayOfWeek),
    escapeCSV(timeOfDay),
    escapeCSV(atWork ? 1 : 0),
    escapeCSV(atHome ? 1 : 0),
    escapeCSV(wasTraining ? 1 : 0),
    escapeCSV(temperature),
    escapeCSV(rain ? 1 : 0),
    escapeCSV(season),
    escapeCSV(paydayDistance),
    escapeCSV(holiday ? 1 : 0),
    escapeCSV(itemId),
    escapeCSV(price),
    escapeCSV(category),
    escapeCSV(brand),
    escapeCSV(pastBuys),
    escapeCSV(pastRecency),
    escapeCSV(avgGap),
    escapeCSV(avgQuantity),
    escapeCSV(isRecurring),
    escapeCSV(itemPopularity),
    escapeCSV(healthActivityType),
    escapeCSV(healthActivityDuration),
    escapeCSV(healthGoal),
    escapeCSV(calendarEventType),
    escapeCSV(calendarEventParticipants)
  ].join(",");
}

function generateCSV(): void {
  console.log(`Generating ${NUM_ROWS} rows of dummy data...`);
  
  const rows = [CSV_HEADER];
  
  for (let i = 0; i < NUM_ROWS; i++) {
    rows.push(generateRow(i));
    
    // Progress indicator for large datasets
    if ((i + 1) % 100 === 0) {
      console.log(`Generated ${i + 1}/${NUM_ROWS} rows...`);
    }
  }
  
  const csvContent = rows.join("\n");
  const outputPath = join(process.cwd(), OUTPUT_FILE);
  
  writeFileSync(outputPath, csvContent, "utf-8");
  console.log(`✅ Successfully generated ${NUM_ROWS} rows in ${OUTPUT_FILE}`);
}

// Run the generator
generateCSV();

