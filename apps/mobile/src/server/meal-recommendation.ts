import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
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

  // Build context vector string
  const contextVector = buildContextVector(params);

  const prompt = `${SYSTEM_PROMPT}

## Current User Context Vector
${contextVector}

## Output Requirements
You MUST respond with ONLY a complete, valid JSON object. No markdown, no code blocks, no explanations.

EXACT JSON FORMAT REQUIRED (copy this structure exactly):
{
  "suggestionType": "proactiveMeal",
  "confidence": 0.92,
  "primarySuggestion": {
    "restaurantId": "r789",
    "restaurantName": "The Health Hub",
    "items": [
      {
        "itemId": "i552",
        "itemName": "Chicken & Quinoa Protein Bowl",
        "quantity": 1
      }
    ],
    "totalPrice": 16.20,
    "justification": "Perfect to refuel after your workout."
  },
  "alternativeSuggestion": {
    "restaurantId": "r456",
    "restaurantName": "Sushi Place",
    "items": [
      {
        "itemId": "i901",
        "itemName": "Salmon Sashimi Platter",
        "quantity": 1
      }
    ],
    "totalPrice": 18.50,
    "justification": "Another great high-protein option."
  }
}

IMPORTANT: Notice that primarySuggestion and alternativeSuggestion are OBJECTS (surrounded by curly braces {}) containing multiple key-value pairs. They are NOT strings or arrays.

Your response must be valid JSON that can be parsed by JSON.parse(). Every opening brace { must have a closing brace }, every opening bracket [ must have a closing bracket ].

Now analyze the context vector and return ONLY the JSON object following this exact structure.`;

  // Define Zod schema for structured output
  const suggestionItemSchema = z.object({
    itemId: z.string().describe("A unique identifier for the item, like 'i552' or 'i123'"),
    itemName: z.string().describe("The full name of the dish or item, like 'Chicken & Quinoa Protein Bowl'"),
    quantity: z.number().int().positive().describe("The number of items to order, typically 1"),
  });

  const suggestionSchema = z.object({
    restaurantId: z.string().describe("A unique identifier for the restaurant, like 'r789' or 'r123'"),
    restaurantName: z.string().describe("The full name of the restaurant, like 'The Health Hub' or 'Sushi Place'"),
    items: z
      .array(suggestionItemSchema)
      .min(1)
      .describe("An array of items to order from this restaurant. Must contain at least one item object with itemId, itemName, and quantity fields."),
    totalPrice: z
      .number()
      .positive()
      .describe("The total price for all items in local currency, as a number like 16.20 or 18.50"),
    justification: z
      .string()
      .describe("A brief, personalized explanation for why this suggestion is relevant, like 'Perfect to refuel after your workout' or 'Based on your Tuesday usual'"),
  });

  const responseSchema = z.object({
    suggestionType: z
      .enum(["proactiveMeal", "proactiveGroceries", "groupOrder"])
      .describe("The type of suggestion: 'proactiveMeal' for restaurant meals, 'proactiveGroceries' for grocery orders, or 'groupOrder' for group events"),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("Confidence score between 0 and 1, typically 0.85 to 0.95 for high confidence suggestions"),
    primarySuggestion: suggestionSchema.describe(
      "The primary recommendation as a complete object with restaurantId, restaurantName, items array, totalPrice, and justification",
    ),
    alternativeSuggestion: suggestionSchema.describe(
      "An alternative recommendation as a complete object with restaurantId, restaurantName, items array, totalPrice, and justification",
    ),
  });

  try {
    // Sync API keys - AI SDK checks GOOGLE_GENERATIVE_AI_API_KEY but we use GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable.");
    }
    
    const googleAI = createGoogleGenerativeAI({
      apiKey,
    });

    try {
      const { object } = await generateObject({
        model: googleAI("gemini-2.5-flash") as any,
        schema: responseSchema,
        prompt,
        temperature: 0.1,
        maxTokens: 4000,
      });

      // Validate that nested objects are not null
      const validated = object as MealRecommendationResponse;
      if (!validated.primarySuggestion || !validated.alternativeSuggestion) {
        throw new Error("Generated object has null nested suggestions");
      }

      return validated;
    } catch (generateObjectError) {
      // Fallback: Use generateText and parse manually if generateObject fails
      console.warn("generateObject failed, falling back to generateText:", generateObjectError);
      
      const { text } = await generateText({
        model: googleAI("gemini-2.5-flash"),
        prompt: `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON matching the schema. No markdown, no code blocks, no explanation.`,
        temperature: 0.1,
        maxTokens: 4000,
      });

      // Parse the JSON response
      let parsedResponse: unknown;
      try {
        // Try to extract JSON from markdown code blocks if present
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/^```json\s*/i, "");
        cleanedText = cleanedText.replace(/^```\s*/i, "");
        cleanedText = cleanedText.replace(/\s*```$/i, "");
        cleanedText = cleanedText.trim();
        
        // Try to find JSON object
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
      }

      // Validate with Zod schema
      const validated = responseSchema.parse(parsedResponse);
      return validated;
    }
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

  const fields: Array<[keyof MealRecommendationParams, unknown, boolean?]> = [
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
