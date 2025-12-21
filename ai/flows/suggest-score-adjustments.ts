'use server';

/**
 * @fileOverview An AI agent that suggests score adjustments based on the employee's position.
 *
 * - suggestScoreAdjustments - A function that suggests score adjustments.
 * - SuggestScoreAdjustmentsInput - The input type for the suggestScoreAdjustments function.
 * - SuggestScoreAdjustmentsOutput - The return type for the suggestScoreAdjustments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestScoreAdjustmentsInputSchema = z.object({
  position: z.string().describe('The position of the employee being evaluated.'),
  department: z.string().describe('The department of the employee being evaluated.'),
  currentScores: z.record(z.string(), z.number()).describe('The current scores for the employee.'),
});
export type SuggestScoreAdjustmentsInput = z.infer<typeof SuggestScoreAdjustmentsInputSchema>;

const SuggestScoreAdjustmentsOutputSchema = z.record(z.string(), z.number()).describe('Suggested score adjustments based on the employee position.');
export type SuggestScoreAdjustmentsOutput = z.infer<typeof SuggestScoreAdjustmentsOutputSchema>;

export async function suggestScoreAdjustments(input: SuggestScoreAdjustmentsInput): Promise<SuggestScoreAdjustmentsOutput> {
  return suggestScoreAdjustmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestScoreAdjustmentsPrompt',
  input: {schema: SuggestScoreAdjustmentsInputSchema},
  output: {schema: SuggestScoreAdjustmentsOutputSchema},
  prompt: `You are an HR expert providing guidance on performance review scores.

  Based on the employee's position and department, suggest score adjustments to ensure fairness.
  Provide the score adjustments as a JSON object where the keys are the criteria IDs and the values are the adjustments.
  The adjustments can be positive or negative numbers. Keep the adjustments small.

  Department: {{{department}}}
  Position: {{{position}}}
  Current Scores: {{{currentScores}}}

  Ensure that the output is a valid JSON object.
  `,
});

const suggestScoreAdjustmentsFlow = ai.defineFlow(
  {
    name: 'suggestScoreAdjustmentsFlow',
    inputSchema: SuggestScoreAdjustmentsInputSchema,
    outputSchema: SuggestScoreAdjustmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
