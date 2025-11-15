import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import type {
  MealRecommendationParams,
  AISuggestion,
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
3. **Synthesize & Hypothesize:** Formulate multiple relevant recommendations (typically 2-5 items). These should form a cohesive order that makes sense together:
   - For meals: Suggest a main dish plus complementary items (e.g., sushi roll + miso soup + edamame, or burger + fries + drink)
   - For groceries: Create a logical shopping basket with related items
   - For group orders: Ensure variety that accommodates different tastes
   - Consider price range, dietary preferences, and user patterns
4. **Ensure Variety:** The items should complement each other while offering some variety. Don't repeat the same item unless it's a group order where multiple people want the same thing.
5. **Craft the Message:** Compose the notification copy and the UI card text. It must be concise, personalized, and actionable.`;

const $Response = z.object({
  background: z
    .string()
    .describe("Background color as hex code (e.g., '#FF6B6B') or color name (e.g., 'blue')"),
  group: z.object({
    friends: z
      .array(z.object({
        name: z.string().describe("Friend's name"),
        avatar: z.string().url().describe("URL to friend's avatar image"),
      }))
      .min(1)
      .describe("Array of friends participating in the group order"),
  })
    .optional()
    .describe("Optional group information - only include if this is a group order (calendarEventParticipants > 1)"),
  title: z
    .string()
    .describe("Short, personalized title explaining why this suggestion is relevant, e.g., 'Perfect post-workout refuel' or 'Based on your Tuesday usual'"),
  items: z
    .array(z.object({
      image: z.string().url().describe("URL to the food item image"),
      description: z.string().describe("Description of the food item, e.g., 'Chicken & Quinoa Protein Bowl with fresh vegetables'"),
      price: z.number().positive().describe("Price of the item in local currency, e.g., 16.20"),
    }))
    .min(2)
    .max(5)
    .describe("Array of 2-5 food items that form a cohesive order. Items should complement each other (e.g., main dish + sides + drink, or a logical grocery basket). Each item should have an image URL, description, and price"),
  icon: z
    .enum(["football&popcorn", "sushi", "burger", "salad", "dessert"])
    .describe("Icon type matching the food category: 'football&popcorn' for snacks/events, 'sushi' for Japanese, 'burger' for fast food, 'salad' for healthy options, 'dessert' for sweets"),
  time: z
    .number()
    .int()
    .positive()
    .describe("Estimated delivery time in seconds (typically 1200-3600, i.e., 20-60 minutes)"),
});

export async function getSuggestions(
  params: MealRecommendationParams,
): Promise<AISuggestion> {


  // Build context vector string
  const contextVector = buildContextVector(params);

  const prompt = `${SYSTEM_PROMPT}

## Current User Context Vector
${contextVector}

## Output Requirements
You MUST respond with ONLY a complete, valid JSON object. No markdown, no code blocks, no explanations.

EXACT JSON FORMAT REQUIRED (copy this structure exactly):
{
  "background": "#FF6B6B",
  "group": {
    "friends": [
      {
        "name": "Alex",
        "avatar": "https://example.com/avatar1.jpg"
      },
      {
        "name": "Sam",
        "avatar": "https://example.com/avatar2.jpg"
      }
    ]
  },
  "title": "Perfect post-workout refuel",
  "items": [
    {
      "image": "https://example.com/chicken-bowl.jpg",
      "description": "Chicken & Quinoa Protein Bowl with fresh vegetables",
      "price": 16.20
    },
    {
      "image": "https://example.com/protein-smoothie.jpg",
      "description": "Green Power Smoothie with whey protein",
      "price": 8.50
    },
    {
      "image": "https://example.com/greek-yogurt.jpg",
      "description": "Greek Yogurt Parfait with berries",
      "price": 6.90
    }
  ],
  "icon": "salad",
  "time": 1800
}

IMPORTANT NOTES - FOLLOW THESE STRICTLY:
- "background" must be a valid color string (hex code like "#FF6B6B" or color name like "blue")
- "group" is OPTIONAL - only include it if this is a group order (calendarEventParticipants > 1)
- "title" should be a short, personalized message explaining why this suggestion is relevant
- "items" is REQUIRED and MUST contain EXACTLY 2-5 food items (no more, no less). Each item must have an image URL, description, and price. Items should complement each other (e.g., main dish + sides + drink, or a logical grocery basket). THIS IS CRITICAL: You must generate between 2 and 5 items, never 1 item or 6+ items.
- "icon" must be one of: "football&popcorn", "sushi", "burger", "salad", or "dessert"
- "time" is the estimated delivery time in seconds (typically 1200-3600 seconds, i.e., 20-60 minutes)

CRITICAL: The "items" array must contain between 2 and 5 items. This is a hard requirement. Always generate at least 2 items and at most 5 items.

Your response must be valid JSON that can be parsed by JSON.parse(). Every opening brace { must have a closing brace }, every opening bracket [ must have a closing bracket ].

Now analyze the context vector and return ONLY the JSON object following this exact structure.`;

  const model = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    const { object } = await generateObject({
      model: model("gemini-2.5-flash") as any,
      schema: $Response,
      prompt,
      temperature: 0.1,
      maxTokens: 4000,
    });

    const validated = object as AISuggestion;

    // Ensure items array is within valid range (schema should enforce this, but double-check)
    if (!validated.items || validated.items.length < 2 || validated.items.length > 5) {
      throw new Error(
        `Invalid items count: expected 2-5 items, got ${validated.items?.length || 0}`,
      );
    }

    return validated;
  } catch (generateObjectError) {
    // Fallback: Use generateText and parse manually if generateObject fails
    console.warn("generateObject failed, falling back to generateText:", generateObjectError);
    
    try {
      const { text } = await generateText({
        model: model("gemini-2.5-flash"),
        prompt: `${prompt}\n\nCRITICAL: You MUST respond with ONLY valid JSON. The "items" array MUST contain EXACTLY 2-5 items (no more, no less). No markdown, no code blocks, no explanation.`,
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
        throw new Error(
          `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        );
      }

      // Validate with Zod schema
      const validated = $Response.parse(parsedResponse) as AISuggestion;
      
      // Ensure items array is within valid range
      if (!validated.items || validated.items.length < 2 || validated.items.length > 5) {
        throw new Error(
          `Invalid items count: expected 2-5 items, got ${validated.items?.length || 0}`,
        );
      }
      
      return validated;
    } catch (fallbackError) {
      // If fallback also fails, throw a helpful error
      if (fallbackError instanceof Error) {
        throw new Error(
          `Failed to generate suggestions: ${fallbackError.message}. Original error: ${generateObjectError instanceof Error ? generateObjectError.message : "Unknown error"}`,
        );
      }
      throw new Error(
        `Failed to generate suggestions. Original error: ${generateObjectError instanceof Error ? generateObjectError.message : "Unknown error"}`,
      );
    }
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