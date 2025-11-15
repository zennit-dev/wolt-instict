#!/usr/bin/env bun

/**
 * Test script for getSuggestions with CSV data
 * Run with: bun apps/mobile/src/server/test-suggestions-with-csv.ts
 * Requires GEMINI_API_KEY environment variable
 * 
 * Demonstrates how to use getSuggestions with CSV data included in the prompt
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
import { getSuggestions } from "./suggestions";

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

async function testSuggestionsWithCSV() {
  console.log("🧪 Testing getSuggestions with CSV data...\n");

  // Try to load CSV file from project root
  const csvPath = join(process.cwd(), "dummy-data.csv");
  let csvFilePath: string | undefined;
  
  if (existsSync(csvPath)) {
    console.log(`📁 Found CSV file at: ${csvPath}`);
    csvFilePath = csvPath;
  } else {
    console.log(`⚠️  CSV file not found at ${csvPath}`);
    console.log("   Run generate-dummy-data.ts first to create the CSV file");
    console.log("   Continuing without CSV data...\n");
  }

  try {
    console.log("   Calling getSuggestions with CSV data...\n");
    const result = await getSuggestions(validParams, {
      csvFilePath: csvFilePath,
    });

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

    console.log("\n✅ Response structure is valid");
  } catch (error) {
    console.log("❌ API call failed:", error);
    if (error instanceof Error) {
      console.log(`   Error message: ${error.message}`);
    }
  }
}

testSuggestionsWithCSV().catch(console.error);

