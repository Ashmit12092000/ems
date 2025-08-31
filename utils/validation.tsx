// File: utils/validation.tsx
// Updated to use Supabase instead of SQLite

import { supabase } from '../lib/supabase';

export interface ValidationResult {
    passed: boolean;
    message: string;
}

export const validateRequest = async (
    userId: string, 
    requestDate: string
): Promise<ValidationResult> => {
    try {
        // Check if user already has a request for this date
        const { data: existingRequests, error } = await supabase
            .from('leave_requests')
            .select('id')
            .eq('user_id', userId)
            .eq('start_date', requestDate);

        if (error) {
            console.error('Validation error:', error);
            return {
                passed: false,
                message: 'Error validating request. Please try again.'
            };
        }

        if (existingRequests && existingRequests.length > 0) {
            return {
                passed: false,
                message: 'You already have a request for this date.'
            };
        }

        // Check permission requests too
        const { data: existingPermissions, error: permError } = await supabase
            .from('permission_requests')
            .select('id')
            .eq('user_id', userId)
            .eq('date', requestDate);

        if (permError) {
            console.error('Permission validation error:', permError);
            return {
                passed: false,
                message: 'Error validating request. Please try again.'
            };
        }

        if (existingPermissions && existingPermissions.length > 0) {
            return {
                passed: false,
                message: 'You already have a permission request for this date.'
            };
        }

        return {
            passed: true,
            message: 'Validation passed'
        };
    } catch (error) {
        console.error('Validation error:', error);
        return {
            passed: false,
            message: 'Validation failed. Please try again.'
        };
    }
};