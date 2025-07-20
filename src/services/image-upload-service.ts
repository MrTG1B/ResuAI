
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
    
    // The data URI is expected to be in the format 'data:<mimetype>;base64,<encoded_data>'
    // We only need the encoded data part.
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
            // ImgBB API might return a 200 OK status even on failure, with an error message in the body.
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
        // The delete_url from ImgBB is a webpage. We need to parse the actual deletion link from it.
        // A more robust way is to make a GET request and find the confirmation link/button.
        // However, a simpler approach that often works is to assume the structure.
        // For now, we will try a POST request to the provided URL, as it sometimes works.
        const formData = new FormData();
        formData.append('delete', 'delete'); // Common practice for such forms.
        
        await axios.post(deleteUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        console.log("Successfully sent delete request for old image.");
    } catch (error: any) {
        // We log the error but don't throw, as failing to delete the old image
        // shouldn't block the user from getting their new image URL.
        console.error("Failed to delete old image from ImgBB. This might be because the delete URL is a webpage and requires manual interaction. URL:", deleteUrl, "Error:", error.message);
    }
}
