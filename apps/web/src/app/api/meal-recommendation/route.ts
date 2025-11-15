import { type NextRequest, NextResponse } from "next/server";
import type {
  MealRecommendationParams,
  MealRecommendationResponse,
} from "@/types/meal-recommendation";

export async function POST(request: NextRequest) {
  try {
    const params: MealRecommendationParams = await request.json();

    // Validate required fields
    if (!params.userId || !params.dayOfWeek || !params.timeOfDay) {
      return NextResponse.json(
        { error: "Missing required fields: userId, dayOfWeek, timeOfDay" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    // Build the prompt for Gemini
    const prompt = buildRecommendationPrompt(params);

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get recommendation from Gemini API" },
        { status: 500 },
      );
    }

    const data = await geminiResponse.json();
    const recommendationText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!recommendationText) {
      return NextResponse.json(
        { error: "No recommendation received from Gemini" },
        { status: 500 },
      );
    }

    // Parse the response (Gemini returns text, so we'll parse it)
    try {
      const recommendation = parseGeminiResponse(recommendationText);
      return NextResponse.json<MealRecommendationResponse>(recommendation);
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in meal recommendation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function buildRecommendationPrompt(params: MealRecommendationParams): string {
  const context = [];

  // Core context
  context.push(`userId: ${params.userId}`);
  context.push(`dayOfWeek: ${params.dayOfWeek}`);
  context.push(`timeOfDay: ${params.timeOfDay}`);
  context.push(`atWork: ${params.atWork ? 1 : 0}`);
  context.push(`atHome: ${params.atHome ? 1 : 0}`);
  context.push(`wasTraining: ${params.wasTraining ? 1 : 0}`);
  context.push(`temperature: ${params.temperature}`);
  context.push(`rain: ${params.rain ? 1 : 0}`);
  context.push(`season: ${params.season}`);
  context.push(`paydayDistance: ${params.paydayDistance}`);
  context.push(`holiday: ${params.holiday ? 1 : 0}`);

  // Optional fields
  if (params.itemId) context.push(`itemId: ${params.itemId}`);
  if (params.price !== undefined) context.push(`price: ${params.price}`);
  if (params.category) context.push(`category: ${params.category}`);
  if (params.brand) context.push(`brand: ${params.brand}`);
  if (params.pastBuys !== undefined)
    context.push(`pastBuys: ${params.pastBuys}`);
  if (params.pastRecency !== undefined)
    context.push(`pastRecency: ${params.pastRecency}`);
  if (params.avgGap !== undefined) context.push(`avgGap: ${params.avgGap}`);
  if (params.avgQuantity !== undefined)
    context.push(`avgQuantity: ${params.avgQuantity}`);
  if (params.isRecurring) context.push("isRecurring: 1");
  if (params.itemPopularity !== undefined)
    context.push(`itemPopularity: ${params.itemPopularity}`);
  if (params.healthActivityType)
    context.push(`healthActivityType: ${params.healthActivityType}`);
  if (params.healthActivityDuration !== undefined)
    context.push(`healthActivityDuration: ${params.healthActivityDuration}`);
  if (params.healthGoal) context.push(`healthGoal: ${params.healthGoal}`);
  if (params.calendarEventType)
    context.push(`calendarEventType: ${params.calendarEventType}`);
  if (params.calendarEventParticipants !== undefined)
    context.push(
      `calendarEventParticipants: ${params.calendarEventParticipants}`,
    );

  return `You are "Wolt Instinct," a hyper-intelligent, proactive AI assistant integrated into the Wolt app.

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

1. **Analyze Context:** What is the user's immediate situation? Check \`time_of_day\`, \`at_work\`/\`at_home\`, \`calendar_event_...\`, \`health_activity_...\`, and weather. This sets the scene.
2. **Recall History:** Given this context, what has this user (and similar users) done in the past? Analyze \`past_buys\`, \`past_recency\`, \`avg_gap\`, and \`is_recurring\`.
3. **Synthesize & Hypothesize:** Formulate the single best hypothesis. This is your primary suggestion. If it's a food item, select a specific dish from a specific restaurant. If it's groceries, create a small, logical basket.
4. **Consider Alternatives:** Prepare a strong secondary option in case the user wants to "shuffle." The alternative should be logically different but still relevant to the context (e.g., a salad instead of sushi for a healthy lunch).
5. **Craft the Message:** Compose the notification copy and the UI card text. It must be concise, personalized, and actionable.

## Current User Context Vector
${context.join(", ")}

## Output Format
You must provide your final output in a structured JSON format. Do not include any other text or explanation outside of the JSON block.

The JSON must follow this exact structure (use camelCase for all property names):
{
  "suggestionType": "proactiveMeal" | "proactiveGroceries" | "groupOrder",
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
    "justification": "To refuel after your workout."
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

## Important Notes
- Only suggest if confidence is >0.85. If confidence would be lower, still provide a response but note the lower confidence.
- The justification should be brief (one short sentence) and personalized.
- Restaurant IDs and item IDs should be realistic (e.g., "r123", "i456").
- Restaurant names should be realistic restaurant names.
- Item names should be specific dish names.
- Prices should be in the local currency (use reasonable values).
- The alternative suggestion should be meaningfully different but still contextually relevant.

Now, analyze the context vector above and provide your recommendation. Respond ONLY with valid JSON, no additional text or markdown formatting.`;
}

function parseGeminiResponse(text: string): MealRecommendationResponse {
  try {
    // Try to extract JSON from the response (Gemini sometimes adds markdown formatting)
    // Remove markdown code blocks if present
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, "");
    cleanedText = cleanedText.replace(/^```\s*/i, "");
    cleanedText = cleanedText.replace(/\s*```$/i, "");
    cleanedText = cleanedText.trim();

    // Try to find JSON object
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Convert snake_case to camelCase if needed (for backward compatibility)
      const normalized = normalizeResponse(parsed);

      // Validate the response structure
      if (
        normalized.suggestionType &&
        typeof normalized.confidence === "number" &&
        normalized.primarySuggestion &&
        normalized.alternativeSuggestion
      ) {
        return normalized as MealRecommendationResponse;
      }
    }

    throw new Error("Invalid response structure");
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    console.error("Response text:", text);

    // Fallback: return a structured error response
    throw new Error("Failed to parse recommendation response from AI");
  }
}

function normalizeResponse(parsed: any): MealRecommendationResponse {
  // Convert snake_case to camelCase if needed
  return {
    suggestionType:
      parsed.suggestionType || parsed.suggestion_type || "proactiveMeal",
    confidence: parsed.confidence || 0.85,
    primarySuggestion: normalizeSuggestion(
      parsed.primarySuggestion || parsed.primary_suggestion,
    ),
    alternativeSuggestion: normalizeSuggestion(
      parsed.alternativeSuggestion || parsed.alternative_suggestion,
    ),
  };
}

function normalizeSuggestion(suggestion: any) {
  if (!suggestion) throw new Error("Missing suggestion");
  return {
    restaurantId: suggestion.restaurantId || suggestion.restaurant_id || "",
    restaurantName:
      suggestion.restaurantName || suggestion.restaurant_name || "",
    items: (suggestion.items || []).map((item: any) => ({
      itemId: item.itemId || item.item_id || "",
      itemName: item.itemName || item.item_name || "",
      quantity: item.quantity || 1,
    })),
    totalPrice: suggestion.totalPrice || suggestion.total_price || 0,
    justification: suggestion.justification || "",
  };
}
