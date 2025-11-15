#!/usr/bin/env bun

/**
 * Integration test script for Gemini meal recommendation API route
 * Run with: bun apps/web/src/app/api/meal-recommendation/test-route.ts
 * Requires GEMINI_API_KEY environment variable for full API test
 */

// Load .env file from project root
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";

function loadEnvFile() {
  // Try to find .env in project root (go up from current file location)
  let currentDir = __dirname;
  for (let i = 0; i < 5; i++) {
    const envPath = join(currentDir, ".env");
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            const value = valueParts.join("=").trim();
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      }
      return;
    }
    currentDir = dirname(currentDir);
  }
}

loadEnvFile();

import type { MealRecommendationParams } from "@/types/meal-recommendation";
import { POST } from "./route";

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
  pastBuys: 10,
  pastRecency: 2,
  avgGap: 3,
  healthActivityType: "running",
  healthActivityDuration: 30,
  healthGoal: "weight_loss",
};

function createRequest(body: MealRecommendationParams): {
  json: () => Promise<MealRecommendationParams>;
} {
  return {
    json: async () => body,
  };
}

async function testRoute() {
  console.log("🧪 Testing Gemini meal recommendation API route...\n");

  // Test 1: Missing required fields
  console.log("Test 1: Missing required fields");
  try {
    const paramsWithoutUserId = { ...validParams, userId: "" };
    const request = createRequest(paramsWithoutUserId);
    const response = await POST(request);
    const data = await response.json();

    if (
      response.status === 400 &&
      data.error?.includes("Missing required fields")
    ) {
      console.log("✅ Correctly returns 400 for missing required fields");
    } else {
      console.log("❌ Unexpected response:", { status: response.status, data });
    }
  } catch (error) {
    console.log("❌ Unexpected error:", error);
  }

  // Test 2: Missing API key
  console.log("\nTest 2: Missing API key");
  try {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const request = createRequest(validParams);
    const response = await POST(request);
    const data = await response.json();

    if (
      response.status === 500 &&
      data.error === "Gemini API key not configured"
    ) {
      console.log("✅ Correctly returns 500 for missing API key");
    } else {
      console.log("❌ Unexpected response:", { status: response.status, data });
    }

    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }
  } catch (error) {
    console.log("❌ Unexpected error:", error);
  }

  // Test 3: Valid request (if API key is available)
  if (!process.env.GEMINI_API_KEY) {
    console.log("\n⚠️  Skipping API test - GEMINI_API_KEY not set");
    console.log(
      "   Set GEMINI_API_KEY environment variable to test actual API call",
    );
    return;
  }

  console.log("\nTest 3: Valid API request");
  try {
    console.log("   Calling Gemini API...");
    const request = createRequest(validParams);
    const response = await POST(request);

    if (response.status !== 200) {
      const errorData = await response.json();
      console.log(`❌ API call returned status ${response.status}:`, errorData);
      return;
    }

    const result = await response.json();

    console.log("✅ API call successful!");
    console.log("\nResponse:");
    console.log(`   Type: ${result.suggestionType}`);
    console.log(`   Confidence: ${result.confidence}`);
    console.log(
      `   Primary Restaurant: ${result.primarySuggestion?.restaurantName}`,
    );
    const primaryItems = result.primarySuggestion?.items
      ?.map((i) => i.itemName)
      .join(", ");
    const alternativeItems = result.alternativeSuggestion?.items
      ?.map((i) => i.itemName)
      .join(", ");
    console.log(`   Primary Items: ${primaryItems}`);
    console.log(`   Primary Price: $${result.primarySuggestion?.totalPrice}`);
    console.log(
      `   Primary Justification: ${result.primarySuggestion?.justification}`,
    );
    console.log(
      `   Alternative Restaurant: ${result.alternativeSuggestion?.restaurantName}`,
    );
    console.log(`   Alternative Items: ${alternativeItems}`);

    // Validate response structure
    const errors: string[] = [];
    if (!result.suggestionType) errors.push("Missing suggestionType");
    if (
      typeof result.confidence !== "number" ||
      result.confidence < 0 ||
      result.confidence > 1
    ) {
      errors.push("Invalid confidence value");
    }
    if (!result.primarySuggestion?.restaurantId)
      errors.push("Missing primarySuggestion.restaurantId");
    if (!result.primarySuggestion?.restaurantName)
      errors.push("Missing primarySuggestion.restaurantName");
    if (
      !Array.isArray(result.primarySuggestion?.items) ||
      result.primarySuggestion.items.length === 0
    ) {
      errors.push("Invalid primarySuggestion.items");
    }
    if (!result.alternativeSuggestion?.restaurantId)
      errors.push("Missing alternativeSuggestion.restaurantId");

    if (errors.length > 0) {
      console.log("\n⚠️  Response validation issues:");
      for (const err of errors) {
        console.log(`   - ${err}`);
      }
    } else {
      console.log("\n✅ Response structure is valid");
    }
  } catch (error) {
    console.log("❌ API call failed:", error);
    if (error instanceof Error) {
      console.log(`   Error message: ${error.message}`);
    }
  }
}

testRoute().catch(console.error);
