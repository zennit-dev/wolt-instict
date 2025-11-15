import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";
import type { MealRecommendationParams } from "@/types/meal-recommendation";
import { POST } from "./route";

// Mock fetch
const mockFetch = mock(async (url: string, options?: RequestInit) => {
  if (url.includes("generativelanguage.googleapis.com")) {
    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
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
                  }),
                },
              ],
            },
          },
        ],
      }),
      text: async () => "",
    };
  }
  throw new Error("Unexpected fetch call");
});

global.fetch = mockFetch as any;

describe("POST /api/meal-recommendation", () => {
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

  function createRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as NextRequest;
  }

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-api-key";
    mockFetch.mockClear();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it("should return 400 when userId is missing", async () => {
    const params = { ...validParams, userId: "" };
    const request = createRequest(params);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("should return 400 when dayOfWeek is missing", async () => {
    const params = { ...validParams, dayOfWeek: undefined };
    const request = createRequest(params);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("should return 400 when timeOfDay is missing", async () => {
    const params = { ...validParams, timeOfDay: undefined };
    const request = createRequest(params);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("should return 500 when GEMINI_API_KEY is not configured", async () => {
    delete process.env.GEMINI_API_KEY;
    const request = createRequest(validParams);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Gemini API key not configured");
  });

  it("should successfully return recommendation with valid parameters", async () => {
    const request = createRequest(validParams);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestionType).toBe("proactiveMeal");
    expect(data.confidence).toBe(0.92);
    expect(data.primarySuggestion).toBeDefined();
    expect(data.primarySuggestion.restaurantId).toBe("r789");
    expect(data.primarySuggestion.restaurantName).toBe("Test Restaurant");
    expect(data.primarySuggestion.items).toHaveLength(1);
    expect(data.primarySuggestion.items[0].itemId).toBe("i552");
    expect(data.primarySuggestion.items[0].itemName).toBe("Test Meal");
    expect(data.primarySuggestion.items[0].quantity).toBe(1);
    expect(data.primarySuggestion.totalPrice).toBe(15.99);
    expect(data.primarySuggestion.justification).toBe(
      "Based on your Tuesday usual.",
    );
    expect(data.alternativeSuggestion).toBeDefined();
    expect(data.alternativeSuggestion.restaurantId).toBe("r456");
  });

  it("should return 500 when Gemini API returns error", async () => {
    mockFetch.mockImplementationOnce(async () => ({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    }));

    const request = createRequest(validParams);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to get recommendation from Gemini API");
  });

  it("should return 500 when Gemini API returns no recommendation text", async () => {
    mockFetch.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({
        candidates: [{}],
      }),
      text: async () => "",
    }));

    const request = createRequest(validParams);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("No recommendation received from Gemini");
  });

  it("should handle JSON response with markdown code blocks", async () => {
    mockFetch.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text:
                    "```json\n" +
                    JSON.stringify({
                      suggestionType: "proactiveMeal",
                      confidence: 0.9,
                      primarySuggestion: {
                        restaurantId: "r123",
                        restaurantName: "Markdown Restaurant",
                        items: [
                          {
                            itemId: "i456",
                            itemName: "Markdown Meal",
                            quantity: 1,
                          },
                        ],
                        totalPrice: 12.99,
                        justification: "Test justification",
                      },
                      alternativeSuggestion: {
                        restaurantId: "r789",
                        restaurantName: "Alt Restaurant",
                        items: [
                          { itemId: "i999", itemName: "Alt Meal", quantity: 1 },
                        ],
                        totalPrice: 14.99,
                        justification: "Alt justification",
                      },
                    }) +
                    "\n```",
                },
              ],
            },
          },
        ],
      }),
      text: async () => "",
    }));

    const request = createRequest(validParams);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestionType).toBe("proactiveMeal");
    expect(data.primarySuggestion.restaurantId).toBe("r123");
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

    const request = createRequest(paramsWithOptionals);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should return 500 when response parsing fails", async () => {
    mockFetch.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "Invalid JSON response that cannot be parsed",
                },
              ],
            },
          },
        ],
      }),
      text: async () => "",
    }));

    const request = createRequest(validParams);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to parse AI response");
  });
});
