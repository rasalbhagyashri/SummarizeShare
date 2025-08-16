'use server';

import { generateSummary } from '@/ai/flows/generate-summary';
import { z } from 'zod';

const ActionInputSchema = z.object({
  transcript: z.string().min(50, 'Transcript must be at least 50 characters.'),
  customPrompt: z.string().min(10, 'Prompt must be at least 10 characters.'),
});

type ActionState = {
  summary?: string;
  error?: string;
};

export async function generateSummaryAction(
  input: z.infer<typeof ActionInputSchema>
): Promise<ActionState> {
  const parsed = ActionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  try {
    const result = await generateSummary(parsed.data);
    if (!result.summary) {
        return { error: 'The AI returned an empty summary. Please try a different prompt or transcript.' };
    }
    return { summary: result.summary };
  } catch (e) {
    console.error(e);
    // This could be a more user-friendly error.
    // For now, we'll return a generic message.
    return { error: 'An unexpected error occurred while generating the summary. Please check the server logs.' };
  }
}
