import type { Day, Season } from "./date";

/**
 * Search for relevant events happening today/soon
 */

export const queryRelevant = async (day: Day, season: Season) => {
  try {
    const query = encodeURIComponent(`events ${day} today ${season} 2025`);

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.EXPO_PUBLIC_GOOGLE_SEARCH_API_KEY}&cx=${process.env.EXPO_PUBLIC_GOOGLE_SEARCH_ENGINE_ID}&q=${query}&num=5`
    );

    if (!response.ok) return "";

    const data = await response.json();
    const results = data.items || [];

    const events = results
      .map(
        (event: { title: string; snippet: string }) =>
          `- ${event.title}: ${event.snippet}`
      )
      .join("\n");

    return `## Relevant Events Today/Soon:\n${events}`;
  } catch {
    return "";
  }
};
