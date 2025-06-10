
"use server";

import { withBusinessServer } from "@/lib/auth/with-business-server";
import { getUserById, updateUser } from "./users";
import { generateUploadUrl, createMedia } from "./media";
import { MediaInsert } from "@/types/media";
import { UserUpdate } from "@/types/users";
import { applyUpdated } from "@/utils/apply-updated";

export const uploadUserAvatar = async (file: File): Promise<{ success: boolean; error?: string; avatarUrl?: string }> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Get current user from database
        const currentUser = await getUserById(userId);
        if (!currentUser) {
            return { success: false, error: "User not found" };
        }

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            return { success: false, error: "Please select an image file" };
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return { success: false, error: "File size must be less than 5MB" };
        }

        // Generate upload URL for images container
        const uploadData = await generateUploadUrl("images", file.name);
        if (!uploadData) {
            return { success: false, error: "Failed to generate upload URL" };
        }

        // Upload file to Azure Blob Storage
        const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'x-ms-blob-type': 'BlockBlob',
                'Content-Type': file.type,
            },
        });

        if (!uploadResponse.ok) {
            return { success: false, error: `Upload failed: ${uploadResponse.statusText}` };
        }

        // Create media record
        const mediaData: MediaInsert = {
            name: `Avatar - ${currentUser.first_name} ${currentUser.last_name}`,
            description: `Profile picture for ${currentUser.first_name} ${currentUser.last_name}`,
            type: "image",
            url: uploadData.fileUrl,
            size: file.size,
            id: "",
            business_id: business.id,
            project_id: null,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };

        const media = await createMedia(mediaData);
        if (!media) {
            return { success: false, error: "Failed to create media record" };
        }

        // Update user record with new avatar URL
        let userUpdate: UserUpdate = {
            avatar_url: uploadData.fileUrl,
        };
        userUpdate = await applyUpdated<UserUpdate>(userUpdate);

        const updatedUser = await updateUser(currentUser.id, userUpdate);
        if (!updatedUser) {
            return { success: false, error: "Failed to update user profile" };
        }

        return { 
            success: true, 
            avatarUrl: uploadData.fileUrl 
        };

    } catch (error) {
        console.error("Error uploading user avatar:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
};
