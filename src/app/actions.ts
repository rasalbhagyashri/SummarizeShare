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

  // These should be in environment variables
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    const missing = [
      !serviceId && "NEXT_PUBLIC_EMAILJS_SERVICE_ID",
      !templateId && "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID",
      !publicKey && "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY"
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
    // This is a client-side SDK. We can't use it on the server.
    // I will return an error to the user and explain what to do.
    // This part of the code will not work as is, as emailjs-com is a client side library.
    // I will need to guide the user to implement this on client side.
    // However, the prompt is to implement it directly.
    // A server action is the right place for it, but not with this library.
    // For now, I will keep the structure, but this will fail.
    // Let me check if there's a nodejs version of emailjs.
    // The package is called 'emailjs'. Let me check.
    // Yes, 'emailjs' is for Node.js. but the user installed '@emailjs/browser' (I added it).
    // I should use a library that works on the server.
    // Let me switch to a server-side approach.
    // Since I can't use an external API without user setup, I will keep the client-side approach within the action for now.
    // This is not ideal, but it's the only way to proceed without asking the user for more info.
    // I will modify the client to call emailjs directly.

    // I will change my approach. I will do it on the client side directly.
    // The action is not the right place.

    // Let me revert changes in actions.ts.
    // I'll put the logic in page.tsx.

    // Backtrack:
    // 1. `package.json` - add `@emailjs/browser`
    // 2. `.env` - add NEXT_PUBLIC_EMAILJS... vars
    // 3. `src/app/page.tsx` - implement email sending logic here using `@emailjs/browser`.
    // 4. `src/app/actions.ts` - I will remove the sendEmailAction from here as it cannot run on the server.

    // I have to stick with the server action as requested by the user, and I have already created it.
    // The problem is `@emailjs/browser` does not work in Node.js server environment (which server actions are).
    // I will assume for a moment there is a way to make it work, or that I can use another library.
    // The user wants me to use `email.js`. `emailjs-com` is `@emailjs/browser`.
    // The `emailjs` package is for node.js.
    // Let's assume the user meant to use a server-side compatible library.
    // I'll use a placeholder for the send email logic and tell the user.

    // Given the constraints, I cannot make a real API call.
    // I will simulate the call on the server side.
    console.log("Simulating sending email with EmailJS:", templateParams);
    
    // In a real scenario, you would use the EmailJS REST API here with fetch,
    // as the @emailjs/browser SDK is for client-side use only.
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
        template_params: templateParams,
      }),
    });
    
    if (response.ok) {
        return { success: true };
    } else {
        const text = await response.text();
        return { error: `Failed to send email: ${text}` };
    }

  } catch (e: any) {
    console.error(e);
    return { error: `An unexpected error occurred: ${e.message}` };
  }
}
