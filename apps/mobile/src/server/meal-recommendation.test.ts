import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import * as googleAI from "@ai-sdk/google";
import * as ai from "ai";
import type { MealRecommendationParams } from "@/types/meal-recommendation";
import { getMealRecommendation } from "./meal-recommendation";

describe("getMealRecommendation", () => {
  const originalEnv = process.env.GEMINI_API_KEY;
  const validParams: MealRecommendationParams = {
    userId: "user123",
    dayOfWeek: "Tuesday",
    timeOfDay: "afternoon",
    atWork: true,
    atHome: false,
    wasTraining: false,
    temperature: 22,
    rain: false,
    season: "spring",
    paydayDistance: 5,
    holiday: false,
  };

  let mockGenerateObject: ReturnType<typeof spyOn>;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-api-key";

    // Mock generateObject to return a valid response
    const mockResponse = {
      object: {
        suggestionType: "proactiveMeal",
        confidence: 0.92,
        primarySuggestion: {
          restaurantId: "r789",
          restaurantName: "Test Restaurant",
          items: [
            {
              itemId: "i552",
              itemName: "Test Meal",
              quantity: 1,
            },
          ],
          totalPrice: 15.99,
          justification: "Based on your Tuesday usual.",
        },
        alternativeSuggestion: {
          restaurantId: "r456",
          restaurantName: "Alternative Restaurant",
          items: [
            {
              itemId: "i901",
              itemName: "Alternative Meal",
              quantity: 1,
            },
          ],
          totalPrice: 18.5,
          justification: "Another great option.",
        },
      },
    };

    mockGenerateObject = spyOn(ai, "generateObject").mockResolvedValue(
      mockResponse as any,
    );
    spyOn(googleAI, "createGoogleGenerativeAI").mockReturnValue({
      "gemini-2.5-flash": {} as any,
    } as any);
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    mockGenerateObject.mockRestore();
  });

  it("should throw error when userId is missing", async () => {
    const params = { ...validParams, userId: "" };
    await expect(getMealRecommendation(params)).rejects.toThrow(
      "Missing required fields: userId, dayOfWeek, timeOfDay",
    );
  });

  it("should throw error when dayOfWeek is missing", async () => {
    const params = { ...validParams, dayOfWeek: "" as any };
    await expect(getMealRecommendation(params)).rejects.toThrow(
      "Missing required fields: userId, dayOfWeek, timeOfDay",
    );
  });

  it("should throw error when timeOfDay is missing", async () => {
    const params = { ...validParams, timeOfDay: "" as any };
    await expect(getMealRecommendation(params)).rejects.toThrow(
      "Missing required fields: userId, dayOfWeek, timeOfDay",
    );
  });

  it("should throw error when GEMINI_API_KEY is not configured", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(getMealRecommendation(validParams)).rejects.toThrow(
      "Gemini API key not configured",
    );
  });

  it("should successfully call Gemini API with valid parameters", async () => {
    const result = await getMealRecommendation(validParams);

    expect(result).toBeDefined();
    expect(result.suggestionType).toBe("proactiveMeal");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.primarySuggestion).toBeDefined();
    expect(result.primarySuggestion.restaurantId).toBe("r789");
    expect(result.primarySuggestion.restaurantName).toBe("Test Restaurant");
    expect(result.primarySuggestion.items).toHaveLength(1);
    expect(result.primarySuggestion.items[0].itemId).toBe("i552");
    expect(result.primarySuggestion.items[0].itemName).toBe("Test Meal");
    expect(result.primarySuggestion.items[0].quantity).toBe(1);
    expect(result.primarySuggestion.totalPrice).toBe(15.99);
    expect(result.primarySuggestion.justification).toBe(
      "Based on your Tuesday usual.",
    );
    expect(result.alternativeSuggestion).toBeDefined();
    expect(result.alternativeSuggestion.restaurantId).toBe("r456");
  });

  it("should handle optional parameters correctly", async () => {
    const paramsWithOptionals: MealRecommendationParams = {
      ...validParams,
      pastBuys: 10,
      pastRecency: 2,
      avgGap: 3,
      healthActivityType: "running",
      healthActivityDuration: 30,
      healthGoal: "weight_loss",
      calendarEventType: "team_meeting",
      calendarEventParticipants: 5,
    };

    const result = await getMealRecommendation(paramsWithOptionals);
    expect(result).toBeDefined();
    expect(mockGenerateObject).toHaveBeenCalled();
  });

  it("should handle error from Gemini API", async () => {
    mockGenerateObject.mockRejectedValueOnce(
      new Error("API Error: Rate limit exceeded"),
    );

    await expect(getMealRecommendation(validParams)).rejects.toThrow(
      "API Error: Rate limit exceeded",
    );
  });

  it("should handle context vector building with boolean values", async () => {
    const params: MealRecommendationParams = {
      ...validParams,
      atWork: true,
      atHome: false,
      wasTraining: true,
      rain: true,
      holiday: false,
      isRecurring: true,
    };

    const result = await getMealRecommendation(params);
    expect(result).toBeDefined();
    expect(mockGenerateObject).toHaveBeenCalled();
  });
});
