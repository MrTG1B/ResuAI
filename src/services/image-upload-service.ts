
'use server';

import axios from 'axios';
import FormData from 'form-data';

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

interface UploadResult {
    url: string;
    deleteUrl: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
            // Wait for 5 seconds to allow the image to propagate on the CDN.
            await delay(5000);
            
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
    try {
        const formData = new FormData();
        formData.append('delete', 'delete');
        formData.append('auth_token', deleteUrl.split('/').pop() || ''); // Extract token from URL
        
        // The delete URL from the API response is actually a viewer URL. 
        // We need to construct the actual deletion endpoint. It seems to be a POST to the same URL.
        await axios.post(deleteUrl, formData, {
            headers: {
                ...formData.getHeaders(),
                'Referer': 'https://imgbb.com/'
            },
        });
        console.log("Successfully sent delete request for old image.");
    } catch (error: any) {
        console.error("Failed to delete old image from ImgBB. This might be because the delete URL is a webpage and requires manual interaction. URL:", deleteUrl, "Error:", error.message);
    }
}
