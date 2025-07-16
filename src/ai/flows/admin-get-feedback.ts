'use server';
/**
 * @fileOverview A secure, server-side flow to fetch all user feedback for the admin dashboard.
 *
 * - getFeedback - A function that handles fetching feedback data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Feedback } from '@/types/feedback';
import { db, collection, getDocs, query, orderBy } from "@/lib/firebase";

// This flow doesn't need an input schema as it takes no arguments.
const GetFeedbackOutputSchema = z.array(z.custom<Feedback>());

export async function getFeedback(): Promise<Feedback[]> {
  return getFeedbackFlow();
}

const getFeedbackFlow = ai.defineFlow(
  {
    name: 'getFeedbackFlow',
    inputSchema: z.void(),
    outputSchema: GetFeedbackOutputSchema,
  },
  async () => {
    if (!db) {
      throw new Error("Firestore is not initialized.");
    }
    const feedbackCollectionRef = collection(db, 'feedback');
    const feedbackQuery = query(feedbackCollectionRef, orderBy('createdAt', 'desc'));
    const feedbackSnapshot = await getDocs(feedbackQuery);

    const feedbackList: Feedback[] = feedbackSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            feedback: data.feedback,
            userId: data.userId,
            userName: data.userName || 'N/A',
            userEmail: data.userEmail || 'N/A',
            createdAt: data.createdAt.toDate().toISOString(),
        }
    });

    return feedbackList;
  }
);
