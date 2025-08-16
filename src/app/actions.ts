'use server';

import { generateSummary } from '@/ai/flows/generate-summary';
import { z } from 'zod';
import emailjs from '@emailjs/browser';

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

const EmailActionInputSchema = z.object({
  to_email: z.string().email(),
  summary: z.string(),
});

type EmailActionState = {
  success?: boolean;
  error?: string;
}

export async function sendEmailAction(
  input: z.infer<typeof EmailActionInputSchema>
): Promise<EmailActionState> {
  const parsed = EmailActionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const { to_email, summary } = parsed.data;

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;


  if (!serviceId || !templateId || !publicKey || !privateKey) {
    const missing = [
      !serviceId && "EMAILJS_SERVICE_ID",
      !templateId && "EMAILJS_TEMPLATE_ID",
      !publicKey && "EMAILJS_PUBLIC_KEY",
      !privateKey && "EMAILJS_PRIVATE_KEY"
    ].filter(Boolean).join(", ");
    return { error: `EmailJS configuration is missing: ${missing}. Please set environment variables.` };
  }

  const templateParams = {
    to_email: to_email,
    summary: summary,
    from_name: 'SummarizeShare',
    subject: 'Your Meeting Summary'
  };

  try {
    const emailJsApiEndpoint = 'https://api.emailjs.com/api/v1.0/email/send';
    const response = await fetch(emailJsApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: templateParams,
      }),
    });
    
    if (response.ok) {
        return { success: true };
    } else {
        const text = await response.text();
        return { error: `Failed to send email. Status: ${response.status}. Body: ${text}` };
    }

  } catch (e: any) {
    console.error(e);
    return { error: `An unexpected error occurred: ${e.message}` };
  }
}
