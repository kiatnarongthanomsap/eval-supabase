"use server";
import { suggestScoreAdjustments } from "@/ai/flows/suggest-score-adjustments";
import type { SuggestScoreAdjustmentsInput, SuggestScoreAdjustmentsOutput } from "@/ai/flows/suggest-score-adjustments";

export async function getAiSuggestions(
  input: SuggestScoreAdjustmentsInput
): Promise<{ success: true; data: SuggestScoreAdjustmentsOutput } | { success: false; error: string }> {
  try {
    const suggestions = await suggestScoreAdjustments(input);
    return { success: true, data: suggestions };
  } catch (error) {
    console.error("AI suggestion error:", error);
    // It's better to return a generic error message to the client
    if (error instanceof Error) {
        return { success: false, error: `Failed to get AI suggestions: ${error.message}` };
    }
    return { success: false, error: "An unknown error occurred while getting AI suggestions." };
  }
}
