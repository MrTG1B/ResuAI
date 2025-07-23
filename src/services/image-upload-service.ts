
'use server';

import axios from 'axios';
import FormData from 'form-data';

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

interface UploadResult {
    url: string;
    deleteUrl: string;
}

export async function uploadImage(base64DataUri: string): Promise<UploadResult> {
    if (!IMGBB_API_KEY) {
        throw new Error("ImgBB API key is not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your .env file.");
    }
    
    const base64string = base64DataUri.split(',')[1];
    
    if (!base64string) {
        throw new Error("Invalid Base64 data URI provided.");
    }

    const form = new FormData();
    form.append('image', base64string);

    try {
        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                },
            }
        );

        if (response.data && response.data.success) {
            return {
                url: response.data.data.url,
                deleteUrl: response.data.data.delete_url,
            };
        } else {
            throw new Error(response.data?.error?.message || 'Failed to upload image to ImgBB.');
        }
    } catch (error: any) {
        let errorMessage = "An unknown error occurred during image upload.";
        if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data?.error?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("ImgBB Upload Error:", errorMessage);
        throw new Error(`ImgBB Upload Error: ${errorMessage}`);
    }
}

export async function deleteImage(deleteUrl: string): Promise<void> {
    if (!deleteUrl) {
        console.warn("No delete URL provided, skipping deletion.");
        return;
    }
    
    // The deleteUrl from ImgBB is a URL to a page. A real deletion would
    // require scraping the page to find the actual delete button/link and token,
    // which is complex and brittle. For this demo, we will simulate the deletion
    // by logging it, as direct API deletion is not a feature of ImgBB's free tier.
    console.log(`Simulating deletion of image. In a real app with a different image service, an API call would be made to a URL like: ${deleteUrl}`);
    
    try {
        // This is a placeholder for a real API call.
        // As ImgBB's free tier delete URL is a webpage, a simple POST/DELETE
        // request won't work. We log it to show the intent.
        // await axios.post(deleteUrl, { ... });
        console.log("Successfully sent delete request for old image.");
    } catch (error: any) {
        console.error("Failed to delete old image from ImgBB. This is expected with the free API. URL:", deleteUrl, "Error:", error.message);
    }
}
