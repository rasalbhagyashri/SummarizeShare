'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles, Mail, Clipboard } from 'lucide-react';
import React, { useState, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import emailjs from '@emailjs/browser';

import { generateSummaryAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  transcript: z.string().min(50, 'Transcript must be at least 50 characters.'),
  customPrompt: z.string().min(10, 'Prompt must be at least 10 characters.'),
});

export default function SummarizeSharePage() {
  const [summary, setSummary] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transcript: '',
      customPrompt: 'Summarize in bullet points for executives.',
    },
  });
  
  const emailFormRef = useRef<HTMLFormElement>(null);


  function onSubmit(values: z.infer<typeof formSchema>) {
    setApiError(null);
    setSummary('');
    startTransition(async () => {
      const result = await generateSummaryAction(values);
      if (result.error) {
        setApiError(result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else if (result.summary) {
        setSummary(result.summary);
      }
    });
  }
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(summary).then(() => {
      toast({
        title: "Copied!",
        description: "Summary copied to clipboard.",
      })
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard.",
      })
    });
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !recipientEmail || !emailFormRef.current) return;

    setIsSendingEmail(true);

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
        toast({
            variant: 'destructive',
            title: 'EmailJS Configuration Error',
            description: 'One or more EmailJS environment variables are missing.',
        });
        setIsSendingEmail(false);
        return;
    }

    emailjs.sendForm(serviceId, templateId, emailFormRef.current, publicKey)
      .then((result) => {
          toast({
            title: "Email Sent!",
            description: "The summary has been sent successfully.",
          });
      }, (error) => {
          toast({
            variant: "destructive",
            title: "Error sending email",
            description: error.text || "An unexpected error occurred.",
          });
      })
      .finally(() => {
        setIsSendingEmail(false);
      });
  };


  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">SummarizeShare</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Paste your transcript, provide a prompt, and let AI do the heavy lifting.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="transcript"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Transcript</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your meeting notes or call transcript here..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Custom Prompt</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Extract action items' or 'Create a 3-point summary'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Summary
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Form>
        
        {(isPending || summary) && (
          <CardFooter className="flex flex-col gap-6 pt-6 border-t">
              {isPending && !summary && (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  </div>
                   <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                  </div>
                </div>
              )}
              {summary && !isPending && (
              <div className="w-full space-y-4">
                <Label htmlFor="summary" className="text-lg font-semibold">Generated Summary</Label>
                <div className="relative">
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-[200px] resize-y bg-secondary/30"
                  />
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground" onClick={handleCopyToClipboard}>
                    <Clipboard className="h-5 w-5" />
                    <span className="sr-only">Copy to clipboard</span>
                  </Button>
                </div>

                <form ref={emailFormRef} onSubmit={handleSendEmail} className="space-y-2">
                    <Label htmlFor="email" className="text-lg font-semibold">Share via Email</Label>
                    {/* Hidden fields for the email content */}
                    <input type="hidden" name="to_email" value={recipientEmail} />
                    <input type="hidden" name="summary" value={summary} />
                    <input type="hidden" name="from_name" value="SummarizeShare" />
                    <input type="hidden" name="subject" value="Your Meeting Summary" />

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            id="email"
                            type="email"
                            placeholder="Recipient's email address"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="flex-grow"
                            name="to_email_visible" /* This is just for display, the real value is hidden */
                        />
                        <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90" disabled={!summary || !recipientEmail || isSendingEmail}>
                        {isSendingEmail ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Sending...
                            </>
                            ) : (
                            <>
                                <Mail className="mr-2 h-5 w-5" />
                                Share
                            </>
                            )}
                        </Button>
                    </div>
                </form>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
