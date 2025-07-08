/**
 * Standardized Client Action Response Types
 * 
 * This file defines consistent response interfaces for all client actions
 * to ensure maintainability and predictable error handling across the application.
 */

// Base response interface for all client actions
export interface ClientActionResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
}

// Specific response types for different operations
export interface CreateResponse<T = unknown> extends ClientActionResponse<T> {
    data?: T;
}

export interface UpdateResponse<T = unknown> extends ClientActionResponse<T> {
    data?: T;
}

export interface DeleteResponse extends ClientActionResponse<void> {
    // No data returned for delete operations
}

export interface GetResponse<T = unknown> extends ClientActionResponse<T> {
    data?: T;
}

export interface ListResponse<T = unknown> extends ClientActionResponse<T[]> {
    data?: T[];
    totalCount?: number;
    hasMore?: boolean;
    errorDetails?: ClientActionError;
}

// Error types for better error handling
export enum ClientActionErrorType {
    AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
    ACCESS_DENIED = 'ACCESS_DENIED',
    NOT_FOUND = 'NOT_FOUND',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    SYNC_ERROR = 'SYNC_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ClientActionError {
    type: ClientActionErrorType;
    message: string;
    details?: any;
}

// Enhanced response with error details
export interface EnhancedClientActionResponse<T = unknown> extends ClientActionResponse<T> {
    error?: string;
    errorDetails?: ClientActionError;
}

// Utility functions for creating standardized responses
export const createSuccessResponse = <T>(data?: T): ClientActionResponse<T> => ({
    success: true,
    data
});

export const createErrorResponse = <T = unknown>(
    error: string,
    errorType?: ClientActionErrorType,
    details?: any
): EnhancedClientActionResponse<T> => ({
    success: false,
    error,
    errorDetails: errorType ? {
        type: errorType,
        message: error,
        details
    } : undefined
});

export const createListSuccessResponse = <T>(
    data: T[],
    totalCount?: number,
    hasMore?: boolean
): ListResponse<T> => ({
    success: true,
    data,
    totalCount,
    hasMore
});

export const createListErrorResponse = <T = unknown>(
    error: string,
    errorType?: ClientActionErrorType
): ListResponse<T> => ({
    success: false,
    error,
    data: [],
    errorDetails: errorType ? {
        type: errorType,
        message: error
    } : undefined
});
