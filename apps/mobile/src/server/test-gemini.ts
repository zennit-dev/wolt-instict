#!/usr/bin/env bun

/**
 * Integration test script for Gemini meal recommendation and suggestions
 * Run with: bun apps/mobile/src/server/test-gemini.ts
 * Requires GEMINI_API_KEY environment variable
 * 
 * Tests both:
 * - getMealRecommendation: Returns MealRecommendationResponse format
 * - getSuggestions: Returns AISuggestion format
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
import { getMealRecommendation, getSuggestions } from "@/server";


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

async function testMealRecommendation() {
  console.log("🧪 Testing Gemini meal recommendation...\n");

  // Test 1: Missing API key
  console.log("Test 1: Missing API key");
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    await getMealRecommendation(validParams);
    console.log("❌ Should have thrown error for missing API key");
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Gemini API key not configured") ||
        error.message.includes("Google Generative AI API key is missing"))
    ) {
      console.log("✅ Correctly throws error for missing API key");
    } else {
      console.log("❌ Unexpected error:", error);
    }
  } finally {
    if (originalGeminiKey) {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }
    if (originalGoogleKey) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogleKey;
    }
  }

  // Test 2: Missing required fields
  console.log("\nTest 2: Missing required fields");
  try {
    const paramsWithoutUserId = { ...validParams, userId: "" };
    await getMealRecommendation(paramsWithoutUserId);
    console.log("❌ Should have thrown error for missing userId");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Missing required fields")
    ) {
      console.log("✅ Correctly throws error for missing required fields");
    } else {
      console.log("❌ Unexpected error:", error);
    }
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
    const result = await getMealRecommendation(validParams);

    console.log("✅ API call successful!");
    console.log("\nResponse:");
    console.log(`   Type: ${result.suggestionType}`);
    console.log(`   Confidence: ${result.confidence}`);
    console.log(
      `   Primary Restaurant: ${result.primarySuggestion.restaurantName}`,
    );
    console.log(
      `   Primary Items: ${result.primarySuggestion.items.map((i) => i.itemName).join(", ")}`,
    );
    console.log(`   Primary Price: $${result.primarySuggestion.totalPrice}`);
    console.log(
      `   Primary Justification: ${result.primarySuggestion.justification}`,
    );
    console.log(
      `   Alternative Restaurant: ${result.alternativeSuggestion.restaurantName}`,
    );
    console.log(
      `   Alternative Items: ${result.alternativeSuggestion.items.map((i) => i.itemName).join(", ")}`,
    );
    console.log(
      `   Alternative Price: $${result.alternativeSuggestion.totalPrice}`,
    );

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

async function testSuggestions() {
  console.log("🧪 Testing Gemini suggestions (AISuggestion format)...\n");

  // Test 1: Missing API key
  console.log("Test 1: Missing API key");
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    await getSuggestions(validParams);
    console.log("❌ Should have thrown error for missing API key");
  } catch (error) {
    if (error instanceof Error) {
      console.log("✅ Correctly throws error for missing API key");
    } else {
      console.log("❌ Unexpected error:", error);
    }
  } finally {
    if (originalGeminiKey) {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }
  }

  // Test 2: Missing required fields
  console.log("\nTest 2: Missing required fields");
  try {
    const paramsWithoutUserId = { ...validParams, userId: "" };
    await getSuggestions(paramsWithoutUserId);
    console.log("❌ Should have thrown error for missing userId");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Missing required fields")
    ) {
      console.log("✅ Correctly throws error for missing required fields");
    } else {
      console.log("❌ Unexpected error:", error);
    }
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
    const result = await getSuggestions(validParams);

    console.log("✅ API call successful!");
    console.log("\nResponse:");
    console.log(`   Background: ${result.background}`);
    console.log(`   Title: ${result.title}`);
    console.log(`   Icon: ${result.icon}`);
    console.log(`   Time: ${result.time} seconds (${Math.round(result.time / 60)} minutes)`);
    console.log(`   Items: ${result.items.length}`);
    result.items.forEach((item, index) => {
      console.log(`     ${index + 1}. ${item.description} - $${item.price}`);
    });
    if (result.group) {
      console.log(`   Group: ${result.group.friends.length} friends`);
      result.group.friends.forEach((friend, index) => {
        console.log(`     ${index + 1}. ${friend.name}`);
      });
    }

    // Validate response structure
    const errors: string[] = [];
    if (!result.background) errors.push("Missing background");
    if (!result.title) errors.push("Missing title");
    if (!result.icon) errors.push("Missing icon");
    if (!["football&popcorn", "sushi", "burger", "salad", "dessert"].includes(result.icon)) {
      errors.push(`Invalid icon: ${result.icon}`);
    }
    if (!Array.isArray(result.items) || result.items.length < 2 || result.items.length > 5) {
      errors.push(`Invalid items array: expected 2-5 items, got ${result.items.length || 0}`);
    } else {
      result.items.forEach((item, index) => {
        if (!item.image) errors.push(`Item ${index + 1}: Missing image`);
        if (!item.description) errors.push(`Item ${index + 1}: Missing description`);
        if (typeof item.price !== "number" || item.price <= 0) {
          errors.push(`Item ${index + 1}: Invalid price`);
        }
      });
    }
    if (typeof result.time !== "number" || result.time <= 0) {
      errors.push("Invalid time value");
    }
    if (result.group) {
      if (!Array.isArray(result.group.friends) || result.group.friends.length === 0) {
        errors.push("Invalid or empty friends array in group");
      } else {
        result.group.friends.forEach((friend, index) => {
          if (!friend.name) errors.push(`Friend ${index + 1}: Missing name`);
          if (!friend.avatar) errors.push(`Friend ${index + 1}: Missing avatar`);
        });
      }
    }

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

async function runAllTests() {
  await testMealRecommendation();
  console.log("\n" + "=".repeat(60) + "\n");
  await testSuggestions();
}

runAllTests().catch(console.error);
