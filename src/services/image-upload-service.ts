
'use server';

import { env } from 'process';

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

export async function uploadImage(base64DataUri: string): Promise<string> {
    if (!IMGBB_API_KEY) {
        throw new Error("ImgBB API key is not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your .env file.");
    }
    
    // The data URI is expected to be in the format 'data:<mimetype>;base64,<encoded_data>'
    // We only need the encoded data part.
    const base64string = base64DataUri.split(',')[1];
    
    if (!base64string) {
        throw new Error("Invalid Base64 data URI provided.");
    }

    const formData = new FormData();
    formData.append('image', base64string);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            return result.data.url;
        } else {
            // ImgBB API might return a 200 OK status even on failure, with an error message in the body.
            throw new Error(result.error?.message || 'Failed to upload image to ImgBB.');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image upload.";
        console.error("ImgBB Upload Error:", errorMessage);
        throw new Error(errorMessage);
    }
}
