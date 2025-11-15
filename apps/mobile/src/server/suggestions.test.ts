import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import * as googleAI from "@ai-sdk/google";
import * as ai from "ai";
import type { MealRecommendationParams } from "@/types/meal-recommendation";
import { getSuggestions } from "./suggestions";

describe("getSuggestions", () => {
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

    // Mock generateObject to return a valid AISuggestion response with 2-5 items
    const mockResponse = {
      object: {
        background: "#FF6B6B",
        title: "Perfect post-workout refuel",
        items: [
          {
            image: "https://example.com/chicken-bowl.jpg",
            description: "Chicken & Quinoa Protein Bowl with fresh vegetables",
            price: 16.2,
          },
          {
            image: "https://example.com/protein-smoothie.jpg",
            description: "Green Power Smoothie with whey protein",
            price: 8.5,
          },
        ],
        icon: "salad",
        time: 1800,
      },
    };

    mockGenerateObject = spyOn(ai, "generateObject").mockResolvedValue(
      mockResponse as any,
    );
    const mockModel = {} as any;
    spyOn(googleAI, "createGoogleGenerativeAI").mockReturnValue(
      ((modelName: string) => mockModel) as any,
    );
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    mockGenerateObject.mockRestore();
  });

  it("should throw error when GEMINI_API_KEY is not configured", async () => {
    delete process.env.GEMINI_API_KEY;
    const createGoogleAISpy = spyOn(googleAI, "createGoogleGenerativeAI");
    createGoogleAISpy.mockImplementationOnce(() => {
      throw new Error("API key is required");
    });
    
    await expect(getSuggestions(validParams)).rejects.toThrow();
  });

  it("should successfully call Gemini API with valid parameters", async () => {
    const result = await getSuggestions(validParams);

    expect(result).toBeDefined();
    expect(result.background).toBe("#FF6B6B");
    expect(result.title).toBe("Perfect post-workout refuel");
    expect(result.items).toBeDefined();
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.items[0].image).toBe("https://example.com/chicken-bowl.jpg");
    expect(result.items[0].description).toBe(
      "Chicken & Quinoa Protein Bowl with fresh vegetables",
    );
    expect(result.items[0].price).toBe(16.2);
    expect(result.icon).toBe("salad");
    expect(result.time).toBe(1800);
    expect(mockGenerateObject).toHaveBeenCalled();
  });

  it("should handle AISuggestion with group information", async () => {
    const mockResponseWithGroup = {
      object: {
        background: "#4ECDC4",
        group: {
          friends: [
            {
              name: "Alex",
              avatar: "https://example.com/avatar1.jpg",
            },
            {
              name: "Sam",
              avatar: "https://example.com/avatar2.jpg",
            },
          ],
        },
        title: "Team lunch time!",
        items: [
          {
            image: "https://example.com/pizza.jpg",
            description: "Margherita Pizza",
            price: 12.5,
          },
          {
            image: "https://example.com/fries.jpg",
            description: "French Fries",
            price: 5.0,
          },
        ],
        icon: "burger",
        time: 2400,
      },
    };

    mockGenerateObject.mockResolvedValueOnce(mockResponseWithGroup as any);

    const paramsWithGroup: MealRecommendationParams = {
      ...validParams,
      calendarEventParticipants: 3,
    };

    const result = await getSuggestions(paramsWithGroup);

    expect(result).toBeDefined();
    expect(result.group).toBeDefined();
    expect(result.group?.friends).toHaveLength(2);
    expect(result.group?.friends[0].name).toBe("Alex");
    expect(result.group?.friends[0].avatar).toBe(
      "https://example.com/avatar1.jpg",
    );
    expect(result.group?.friends[1].name).toBe("Sam");
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.length).toBeLessThanOrEqual(5);
  });

  it("should handle all icon types", async () => {
    const iconTypes = [
      "football&popcorn",
      "sushi",
      "burger",
      "salad",
      "dessert",
    ] as const;

    for (const iconType of iconTypes) {
      const mockResponse = {
        object: {
          background: "#FF6B6B",
          title: `Test with ${iconType}`,
          items: [
            {
              image: "https://example.com/item1.jpg",
              description: "Test item 1",
              price: 10.0,
            },
            {
              image: "https://example.com/item2.jpg",
              description: "Test item 2",
              price: 8.0,
            },
          ],
          icon: iconType,
          time: 1800,
        },
      };

      mockGenerateObject.mockResolvedValueOnce(mockResponse as any);

      const result = await getSuggestions(validParams);
      expect(result.icon).toBe(iconType);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.items.length).toBeLessThanOrEqual(5);
    }
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

    const result = await getSuggestions(paramsWithOptionals);
    expect(result).toBeDefined();
    expect(mockGenerateObject).toHaveBeenCalled();
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.length).toBeLessThanOrEqual(5);
  });

  it("should handle error from Gemini API", async () => {
    mockGenerateObject.mockRejectedValueOnce(
      new Error("API Error: Rate limit exceeded"),
    );

    await expect(getSuggestions(validParams)).rejects.toThrow(
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

    const result = await getSuggestions(params);
    expect(result).toBeDefined();
    expect(mockGenerateObject).toHaveBeenCalled();
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.length).toBeLessThanOrEqual(5);
  });

  it("should handle multiple items in the response (2-5 items)", async () => {
    const mockResponseMultipleItems = {
      object: {
        background: "#9B59B6",
        title: "Complete meal set",
        items: [
          {
            image: "https://example.com/main.jpg",
            description: "Main course",
            price: 20.0,
          },
          {
            image: "https://example.com/dessert.jpg",
            description: "Dessert",
            price: 8.5,
          },
          {
            image: "https://example.com/drink.jpg",
            description: "Drink",
            price: 3.0,
          },
        ],
        icon: "dessert",
        time: 3000,
      },
    };

    mockGenerateObject.mockResolvedValueOnce(mockResponseMultipleItems as any);

    const result = await getSuggestions(validParams);

    expect(result).toBeDefined();
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].price).toBe(20.0);
    expect(result.items[1].price).toBe(8.5);
    expect(result.items[2].price).toBe(3.0);
  });

  it("should handle 5 items (maximum)", async () => {
    const mockResponseFiveItems = {
      object: {
        background: "#9B59B6",
        title: "Complete meal set",
        items: [
          { image: "https://example.com/item1.jpg", description: "Item 1", price: 10.0 },
          { image: "https://example.com/item2.jpg", description: "Item 2", price: 10.0 },
          { image: "https://example.com/item3.jpg", description: "Item 3", price: 10.0 },
          { image: "https://example.com/item4.jpg", description: "Item 4", price: 10.0 },
          { image: "https://example.com/item5.jpg", description: "Item 5", price: 10.0 },
        ],
        icon: "dessert",
        time: 3000,
      },
    };

    mockGenerateObject.mockResolvedValueOnce(mockResponseFiveItems as any);

    const result = await getSuggestions(validParams);

    expect(result).toBeDefined();
    expect(result.items).toHaveLength(5);
  });

  it("should handle 2 items (minimum)", async () => {
    const mockResponseTwoItems = {
      object: {
        background: "#9B59B6",
        title: "Minimal meal set",
        items: [
          { image: "https://example.com/item1.jpg", description: "Item 1", price: 10.0 },
          { image: "https://example.com/item2.jpg", description: "Item 2", price: 10.0 },
        ],
        icon: "dessert",
        time: 3000,
      },
    };

    mockGenerateObject.mockResolvedValueOnce(mockResponseTwoItems as any);

    const result = await getSuggestions(validParams);

    expect(result).toBeDefined();
    expect(result.items).toHaveLength(2);
  });
});

