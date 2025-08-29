// File: utils/validation.ts
// This file contains the validation logic as per the workflow diagram.
// It checks for monthly limits and roster conflicts before a request is submitted.
import { SQLiteDatabase } from 'expo-sqlite';

// CORRECTED: Export the interface so it can be imported elsewhere
export interface ValidationResult {
  passed: boolean;
  message: string;
}

export const validateRequest = async (
  db: SQLiteDatabase,
  userId: number,
  requestDate: string,
  requestType: 'leave' | 'permission' | 'shift_swap' = 'leave'
): Promise<ValidationResult> => {
  try {
    const limitResult = await checkMonthlyLimit(db, userId, requestDate);
    if (!limitResult.passed) {
      return limitResult;
    }

    // For shift swaps, we expect employees to have duties scheduled (that's what they're swapping)
    // So we skip the roster conflict check for shift swaps
    if (requestType !== 'shift_swap') {
      const rosterResult = await checkRosterConflict(db, userId, requestDate);
      if (!rosterResult.passed) {
        return rosterResult;
      }
    }

    return { passed: true, message: 'Validation passed' };
  } catch (error) {
    console.error('Validation error:', error);
    return { passed: false, message: 'An unexpected error occurred during validation.' };
  }
};

const checkMonthlyLimit = async (
  db: SQLiteDatabase,
  userId: number,
  requestDate: string
): Promise<ValidationResult> => {
  const month = requestDate.substring(0, 7); // 'YYYY-MM'

  try {
    // 1. Get the monthly limit
    const limitRow = await db.getFirstAsync<{ value: number }>(
      'SELECT value FROM monthly_limits WHERE limit_type = ?;',
      'leave'
    );
    const limit = limitRow?.value;

    if (limit === null || limit === undefined) {
      return { passed: true, message: '' }; // No limit set
    }

    // 2. Count user's approved or pending leave requests for the month
    const countRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND (status = 'approved' OR status = 'pending') AND type = 'leave' AND strftime('%Y-%m', date) = ?;",
      userId,
      month
    );
    const currentCount = countRow?.count ?? 0;

    if (currentCount >= limit) {
      return {
        passed: false,
        message: `You have reached your monthly limit of ${limit} leave requests.`,
      };
    }
    
    return { passed: true, message: '' };
  } catch (error) {
    console.error('DB error in checkMonthlyLimit:', error);
    return { passed: false, message: 'Could not verify monthly limit.' };
  }
};

const checkRosterConflict = async (
  db: SQLiteDatabase,
  userId: number,
  requestDate: string
): Promise<ValidationResult> => {
  try {
    const rosterEntry = await db.getFirstAsync(
      'SELECT * FROM duty_roster WHERE user_id = ? AND date = ?;',
      userId,
      requestDate
    );

    if (rosterEntry) {
      return {
        passed: false,
        message: `You have a duty scheduled on ${requestDate}. Please request a shift adjustment instead.`,
      };
    }
    
    return { passed: true, message: '' };
  } catch (error) {
    console.error('DB error in checkRosterConflict:', error);
    return { passed: false, message: 'Could not verify duty roster.' };
  }
};
