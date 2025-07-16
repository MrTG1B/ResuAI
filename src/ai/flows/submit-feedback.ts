'use server';
/**
 * @fileOverview Saves user feedback to Firestore.
 *
 * - submitFeedback - A function that handles saving feedback.
 * - SubmitFeedbackInput - The input type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db, addDoc, collection, serverTimestamp } from "@/lib/firebase";
import { Auth } from 'firebase/auth';

const SubmitFeedbackInputSchema = z.object({
  feedback: z.string().min(10, "Feedback must be at least 10 characters long."),
  userId: z.string(),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
});
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;

export async function submitFeedback(input: SubmitFeedbackInput): Promise<{success: boolean}> {
  return submitFeedbackFlow(input);
}

const submitFeedbackFlow = ai.defineFlow(
  {
    name: 'submitFeedbackFlow',
    inputSchema: SubmitFeedbackInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    if (!db) {
      throw new Error("Firestore is not initialized.");
    }
    
    const feedbackCollectionRef = collection(db, 'feedback');
    
    await addDoc(feedbackCollectionRef, {
      ...input,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  }
);
