#!/usr/bin/env bun

/**
 * Batch processing script for dummy CSV data using getSuggestions
 * Run with: bun apps/mobile/src/server/process-dummy-data.ts
 * Requires GEMINI_API_KEY environment variable
 * 
 * Reads dummy-data.csv and processes each row through getSuggestions
 */

// Load .env file from project root
import { readFileSync, existsSync, writeFileSync } from "fs";
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
import { batchGetSuggestions } from "./suggestions";

// ============================================================================
// CONFIGURATION
// ============================================================================
const CSV_FILE = join(process.cwd(), "dummy-data.csv");
const OUTPUT_FILE = join(process.cwd(), "suggestions-results.json");
const BATCH_SIZE = 10; // Process this many rows at a time (to avoid rate limits)
const DELAY_BETWEEN_BATCHES_MS = 2000; // Delay between batches in milliseconds
const MAX_ROWS_TO_PROCESS = 1000; // Limit how many rows to process (set to Infinity for all)
// ============================================================================

interface CSVRow {
  userId: string;
  dayOfWeek: string;
  timeOfDay: string;
  atWork: string;
  atHome: string;
  wasTraining: string;
  temperature: string;
  rain: string;
  season: string;
  paydayDistance: string;
  holiday: string;
  itemId: string;
  price: string;
  category: string;
  brand: string;
  pastBuys: string;
  pastRecency: string;
  avgGap: string;
  avgQuantity: string;
  isRecurring: string;
  itemPopularity: string;
  healthActivityType: string;
  healthActivityDuration: string;
  healthGoal: string;
  calendarEventType: string;
  calendarEventParticipants: string;
}

interface ProcessedResult {
  rowIndex: number;
  params: MealRecommendationParams;
  result?: unknown;
  error?: string;
  success: boolean;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV file must have at least a header and one data row");
  }

  const firstLine = lines[0];
  if (!firstLine) {
    throw new Error("CSV file has empty header row");
  }

  const headers = firstLine.split(",").map((h) => h.trim()).filter((h) => h.length > 0);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Simple CSV parsing (handles quoted values)
    const values: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add last value

    if (values.length !== headers.length) {
      console.warn(`Row ${i}: Expected ${headers.length} columns, got ${values.length}. Skipping.`);
      continue;
    }

    const row: Partial<CSVRow> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) {
        (row as Record<string, string>)[header] = values[j] || "";
      }
    }
    rows.push(row as CSVRow);
  }

  return rows;
}

function csvRowToParams(row: CSVRow, index: number): MealRecommendationParams | null {
  try {
    const params: MealRecommendationParams = {
      userId: row.userId || `user${index}`,
      dayOfWeek: row.dayOfWeek as MealRecommendationParams["dayOfWeek"],
      timeOfDay: row.timeOfDay as MealRecommendationParams["timeOfDay"],
      atWork: row.atWork === "1",
      atHome: row.atHome === "1",
      wasTraining: row.wasTraining === "1",
      temperature: Number.parseFloat(row.temperature || "20"),
      rain: row.rain === "1",
      season: row.season as MealRecommendationParams["season"],
      paydayDistance: Number.parseInt(row.paydayDistance || "0", 10),
      holiday: row.holiday === "1",
    };

    // Optional fields
    if (row.itemId) params.itemId = row.itemId;
    if (row.price) params.price = Number.parseFloat(row.price);
    if (row.category) params.category = row.category;
    if (row.brand) params.brand = row.brand;
    if (row.pastBuys) params.pastBuys = Number.parseInt(row.pastBuys, 10);
    if (row.pastRecency) params.pastRecency = Number.parseInt(row.pastRecency, 10);
    if (row.avgGap) params.avgGap = Number.parseInt(row.avgGap, 10);
    if (row.avgQuantity) params.avgQuantity = Number.parseInt(row.avgQuantity, 10);
    if (row.isRecurring !== "") params.isRecurring = row.isRecurring === "1";
    if (row.itemPopularity) params.itemPopularity = Number.parseFloat(row.itemPopularity);
    if (row.healthActivityType) params.healthActivityType = row.healthActivityType;
    if (row.healthActivityDuration) {
      params.healthActivityDuration = Number.parseInt(row.healthActivityDuration, 10);
    }
    if (row.healthGoal) params.healthGoal = row.healthGoal;
    if (row.calendarEventType) params.calendarEventType = row.calendarEventType;
    if (row.calendarEventParticipants) {
      params.calendarEventParticipants = Number.parseInt(row.calendarEventParticipants, 10);
    }

    return params;
  } catch (error) {
    console.error(`Error parsing row ${index}:`, error);
    return null;
  }
}


async function main() {
  console.log("📊 Dummy Data CSV Processor");
  console.log("=" .repeat(60));

  // Check for API key
  if (!process.env["GEMINI_API_KEY"]) {
    console.error("❌ Error: GEMINI_API_KEY environment variable is not set");
    console.error("   Set it in .env file or export it before running this script");
    process.exit(1);
  }

  // Read CSV file
  if (!existsSync(CSV_FILE)) {
    console.error(`❌ Error: CSV file not found at ${CSV_FILE}`);
    console.error("   Run generate-dummy-data.ts first to create the CSV file");
    process.exit(1);
  }

  console.log(`\n📁 Reading CSV file: ${CSV_FILE}`);
  const csvContent = readFileSync(CSV_FILE, "utf-8");
  const rows = parseCSV(csvContent);
  console.log(`   Found ${rows.length} rows in CSV`);

  const rowsToProcess = rows.slice(0, MAX_ROWS_TO_PROCESS);
  console.log(`   Processing first ${rowsToProcess.length} rows\n`);

  // Parse all rows into params
  const paramsArray: MealRecommendationParams[] = [];
  const invalidRows: ProcessedResult[] = [];

  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i];
    if (!row) {
      invalidRows.push({
        rowIndex: i,
        params: {} as MealRecommendationParams,
        success: false,
        error: "Row is undefined",
      });
      continue;
    }
    const params = csvRowToParams(row, i);
    if (!params) {
      invalidRows.push({
        rowIndex: i,
        params: {} as MealRecommendationParams,
        success: false,
        error: "Failed to parse row",
      });
      continue;
    }
    paramsArray.push(params);
  }

  console.log(`   Parsed ${paramsArray.length} valid rows (${invalidRows.length} invalid skipped)\n`);

  // Process using batchGetSuggestions
  const batchResults = await batchGetSuggestions(paramsArray, {
    batchSize: BATCH_SIZE,
    delayBetweenRequests: 500,
    delayBetweenBatches: DELAY_BETWEEN_BATCHES_MS,
    onSuccess: (params, result, index) => {
      console.log(`  [${index + 1}] ✅ ${params.userId}: ${result.title} (${result.items.length} items)`);
    },
    onError: (params, error, index) => {
      console.log(`  [${index + 1}] ❌ ${params.userId}: ${error.message}`);
    },
    onBatchComplete: (batchNumber, successful, failed) => {
      console.log(`\n   Batch ${batchNumber} complete: ✅ ${successful} successful, ❌ ${failed} failed`);
    },
  });

  // Combine invalid rows with batch results
  const allResults: ProcessedResult[] = [...invalidRows];
  
  // Map batch results to ProcessedResult format
  for (const batchResult of batchResults) {
    allResults.push({
      rowIndex: batchResult.index,
      params: batchResult.params,
      result: batchResult.result,
      error: batchResult.error?.message,
      success: batchResult.success,
    });
  }

  // Sort by rowIndex to maintain order
  allResults.sort((a, b) => a.rowIndex - b.rowIndex);

  // Save results
  console.log(`\n💾 Saving results to ${OUTPUT_FILE}...`);
  const output = {
    summary: {
      totalRows: rowsToProcess.length,
      processed: allResults.length,
      successful: allResults.filter((r) => r.success).length,
      failed: allResults.filter((r) => !r.success).length,
      timestamp: new Date().toISOString(),
    },
    results: allResults,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📈 Processing Summary");
  console.log("=".repeat(60));
  console.log(`   Total rows processed: ${output.summary.processed}`);
  console.log(`   ✅ Successful: ${output.summary.successful}`);
  console.log(`   ❌ Failed: ${output.summary.failed}`);
  console.log(`   Success rate: ${((output.summary.successful / output.summary.processed) * 100).toFixed(1)}%`);
  console.log(`\n   Results saved to: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

