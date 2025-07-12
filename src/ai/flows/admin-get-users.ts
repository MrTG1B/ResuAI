'use server';
/**
 * @fileOverview A secure, server-side flow to fetch all user data for the admin dashboard.
 *
 * - getUsers - A function that handles fetching and aggregating user data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { User } from '@/types/user';
import { db, collection, getDocs, doc, getDoc } from "@/lib/firebase";

// This flow doesn't need an input schema as it takes no arguments.
const GetUsersOutputSchema = z.array(z.custom<User>());

export async function getUsers(): Promise<User[]> {
  return getUsersFlow();
}

const getUsersFlow = ai.defineFlow(
  {
    name: 'getUsersFlow',
    inputSchema: z.void(),
    outputSchema: GetUsersOutputSchema,
  },
  async () => {
    if (!db) {
      throw new Error("Firestore is not initialized.");
    }
    const usersCollectionRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);

    const usersList: User[] = await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
      const user: User = {
        id: userDoc.id,
        name: 'N/A',
        email: 'N/A',
        resumes: 0,
        portfolios: 0,
      };

      try {
        // Fetch profile data
        const profileDocRef = doc(db, 'users', user.id, 'profile', 'data');
        const profileSnap = await getDoc(profileDocRef);
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          user.name = profileData.name || 'N/A';
          user.email = profileData.email || 'N/A';
        }

        // Fetch portfolio count
        const portfoliosCollectionRef = collection(db, 'users', user.id, 'portfolios');
        const portfoliosSnapshot = await getDocs(portfoliosCollectionRef);
        user.portfolios = portfoliosSnapshot.size;

        // Fetch resume count
        const resumesCollectionRef = collection(db, 'users', user.id, 'resumes');
        const resumesSnapshot = await getDocs(resumesCollectionRef);
        user.resumes = resumesSnapshot.size;
      } catch (error) {
          console.error(`Failed to fetch details for user ${user.id}`, error);
          // Keep default 'N/A' values if subcollection fetching fails for any reason
      }

      return user;
    }));

    return usersList;
  }
);
