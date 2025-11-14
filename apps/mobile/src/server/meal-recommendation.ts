import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import type {
	MealRecommendationParams,
	MealRecommendationResponse,
} from "@/types/meal-recommendation";

const SYSTEM_PROMPT = `You are "Wolt Instinct," a hyper-intelligent, proactive AI assistant integrated into the Wolt app.

## Core Mission
Your mission is to understand each user's life patterns, routines, and immediate context to predict their needs *before they do*. Your goal is to reduce the cognitive load of ordering to a single tap by proactively sending highly relevant, timely, and personalized suggestions. Success is a user feeling that Wolt "just gets them."

## Guiding Principles
1. **Be Proactive, Not Annoying:** Only generate a suggestion when confidence is high (e.g., >85%). A user's patterns, calendar, and location must align.
2. **Context is Everything:** A suggestion's relevance is determined by the synthesis of user history and real-time signals. A rainy Tuesday at the office after a gym session is completely different from a sunny Saturday at home.
3. **Explain the "Why":** Your suggestions must always include a brief, human-readable justification. This builds trust and makes the prediction feel like magic, not a coincidence. (e.g., "...based on your Tuesday usual," "...to refuel after your run," "...for your team lunch.")
4. **Handle Social Nuance:** For group events, your goal is to be a helpful coordinator. Find the common ground between participants' tastes and simplify the logistics of ordering together.
5. **Learn Continuously:** Every accepted, shuffled, or dismissed suggestion is a crucial data point for your next prediction.

## Reasoning Process
When prompted with a user's current context vector, you must follow this thought process:

1. **Analyze Context:** What is the user's immediate situation? Check timeOfDay, atWork/atHome, calendarEvent, healthActivity, and weather. This sets the scene.
2. **Recall History:** Given this context, what has this user (and similar users) done in the past? Analyze pastBuys, pastRecency, avgGap, and isRecurring.
3. **Synthesize & Hypothesize:** Formulate the single best hypothesis. This is your primary suggestion. If it's a food item, select a specific dish from a specific restaurant. If it's groceries, create a small, logical basket.
4. **Consider Alternatives:** Prepare a strong secondary option in case the user wants to "shuffle." The alternative should be logically different but still relevant to the context (e.g., a salad instead of sushi for a healthy lunch).
5. **Craft the Message:** Compose the notification copy and the UI card text. It must be concise, personalized, and actionable.`;

export async function getMealRecommendation(
	params: MealRecommendationParams,
): Promise<MealRecommendationResponse> {
	// Validate required fields
	if (!params.userId || !params.dayOfWeek || !params.timeOfDay) {
		throw new Error("Missing required fields: userId, dayOfWeek, timeOfDay");
	}

	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error("Gemini API key not configured");
	}

	// Build context vector string
	const contextVector = buildContextVector(params);

	const prompt = `${SYSTEM_PROMPT}

## Current User Context Vector
${contextVector}

Now, analyze the context vector above and provide your recommendation.`;

	// Define Zod schema for structured output
	const suggestionItemSchema = z.object({
		itemId: z.string().describe("Item identifier (e.g., 'i552')"),
		itemName: z.string().describe("Name of the dish/item"),
		quantity: z.number().describe("Quantity to order"),
	});

	const suggestionSchema = z.object({
		restaurantId: z.string().describe("Restaurant identifier (e.g., 'r789')"),
		restaurantName: z.string().describe("Name of the restaurant"),
		items: z.array(suggestionItemSchema),
		totalPrice: z.number().describe("Total price in local currency"),
		justification: z
			.string()
			.describe("Brief, personalized explanation (one short sentence)"),
	});

	const responseSchema = z.object({
		suggestionType: z
			.enum(["proactiveMeal", "proactiveGroceries", "groupOrder"])
			.describe("Type of suggestion"),
		confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
		primarySuggestion: suggestionSchema,
		alternativeSuggestion: suggestionSchema,
	});

	try {
		const googleAI = createGoogleGenerativeAI({
			apiKey,
		});

		const { object } = await generateObject({
			model: googleAI("gemini-1.5-pro"),
			schema: responseSchema,
			prompt,
		});

		return object as MealRecommendationResponse;
	} catch (error) {
		console.error("Error generating meal recommendation:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to generate meal recommendation",
		);
	}
}

function buildContextVector(params: MealRecommendationParams): string {
	const context: string[] = [];

	const fields: Array<
		[keyof MealRecommendationParams, unknown, boolean?]
	> = [
		["userId", params.userId],
		["dayOfWeek", params.dayOfWeek],
		["timeOfDay", params.timeOfDay],
		["atWork", params.atWork, true],
		["atHome", params.atHome, true],
		["wasTraining", params.wasTraining, true],
		["temperature", params.temperature],
		["rain", params.rain, true],
		["season", params.season],
		["paydayDistance", params.paydayDistance],
		["holiday", params.holiday, true],
		["itemId", params.itemId],
		["price", params.price],
		["category", params.category],
		["brand", params.brand],
		["pastBuys", params.pastBuys],
		["pastRecency", params.pastRecency],
		["avgGap", params.avgGap],
		["avgQuantity", params.avgQuantity],
		["isRecurring", params.isRecurring, true],
		["itemPopularity", params.itemPopularity],
		["healthActivityType", params.healthActivityType],
		["healthActivityDuration", params.healthActivityDuration],
		["healthGoal", params.healthGoal],
		["calendarEventType", params.calendarEventType],
		["calendarEventParticipants", params.calendarEventParticipants],
	];

	for (const [key, value, isBoolean] of fields) {
		if (value === undefined || value === null) continue;

		if (isBoolean) {
			context.push(`${key}: ${value ? 1 : 0}`);
		} else {
			context.push(`${key}: ${value}`);
		}
	}

	return context.join(", ");
}

