
"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "@/app/actions/auth";
import { sendEmailVerification } from "@/app/actions/email-verification";
import { sendProjectUpdateNotification, sendEquipmentAlert } from "@/app/actions/email-notifications";

export function useEmailSystem() {
    const [isLoading, setIsLoading] = useState(false);

    const sendPasswordReset = async (email: string) => {
        setIsLoading(true);
        try {
            const result = await sendPasswordResetEmail(email);
            
            if (result.success) {
                toast.success({
                    title: "Password Reset Sent",
                    description: result.message,
                });
            } else {
                toast.error({
                    title: "Error",
                    description: result.error || "Failed to send password reset email",
                });
            }
            
            return result;
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error({
                title: "Error",
                description: "Failed to send password reset email",
            });
            return { success: false, error: "Failed to send password reset email" };
        } finally {
            setIsLoading(false);
        }
    };

    const sendVerificationEmail = async (userId: string) => {
        setIsLoading(true);
        try {
            const result = await sendEmailVerification(userId);
            
            if (result.success) {
                toast.success({
                    title: "Verification Email Sent",
                    description: result.message,
                });
            } else {
                toast.error({
                    title: "Error",
                    description: result.error || "Failed to send verification email",
                });
            }
            
            return result;
        } catch (error) {
            console.error("Email verification error:", error);
            toast.error({
                title: "Error",
                description: "Failed to send verification email",
            });
            return { success: false, error: "Failed to send verification email" };
        } finally {
            setIsLoading(false);
        }
    };

    const sendProjectNotification = async (
        projectId: string,
        updateType: "milestone_completed" | "status_change" | "task_assigned" | "deadline_approaching",
        updateDetails: string,
        updatedBy: string
    ) => {
        setIsLoading(true);
        try {
            const result = await sendProjectUpdateNotification(projectId, updateType, updateDetails, updatedBy);
            
            if (result.success) {
                toast.success({
                    title: "Notifications Sent",
                    description: result.message,
                });
            } else {
                toast.error({
                    title: "Error",
                    description: result.error || "Failed to send project notifications",
                });
            }
            
            return result;
        } catch (error) {
            console.error("Project notification error:", error);
            toast.error({
                title: "Error",
                description: "Failed to send project notifications",
            });
            return { success: false, error: "Failed to send project notifications" };
        } finally {
            setIsLoading(false);
        }
    };

    const sendEquipmentNotification = async (
        equipmentId: string,
        alertType: "maintenance_due" | "inspection_required" | "malfunction" | "assignment_change",
        description: string,
        priority: "low" | "medium" | "high" = "medium"
    ) => {
        setIsLoading(true);
        try {
            const result = await sendEquipmentAlert(equipmentId, alertType, description, priority);
            
            if (result.success) {
                toast.success({
                    title: "Equipment Alert Sent",
                    description: result.message,
                });
            } else {
                toast.error({
                    title: "Error",
                    description: result.error || "Failed to send equipment alert",
                });
            }
            
            return result;
        } catch (error) {
            console.error("Equipment alert error:", error);
            toast.error({
                title: "Error",
                description: "Failed to send equipment alert",
            });
            return { success: false, error: "Failed to send equipment alert" };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        sendPasswordReset,
        sendVerificationEmail,
        sendProjectNotification,
        sendEquipmentNotification,
    };
}
