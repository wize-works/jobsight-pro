
'use client';

import { useOfflineSync } from '@/hooks/use-offline-sync';
import { withOfflineCache } from './actions';
import { v4 as uuidv4 } from 'uuid';

export function useOfflineActions() {
  const { queueOperation, isOnline } = useOfflineSync();

  const createDailyLog = async (data: any, businessId: string, userId?: string) => {
    if (!isOnline) {
      // Generate temporary ID for offline creation
      const tempData = {
        ...data,
        id: data.id || uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        business_id: businessId,
        created_by: userId,
        updated_by: userId,
      };
      
      await queueOperation('daily_logs', 'insert', tempData, businessId, userId);
      return { data: tempData, error: null };
    }
    
    // Call server action when online
    const { createDailyLog: serverAction } = await import('@/app/actions/daily-logs');
    return await serverAction(data, businessId, userId);
  };

  const updateDailyLog = async (id: string, data: any, businessId: string, userId?: string) => {
    if (!isOnline) {
      const tempData = {
        ...data,
        id,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      };
      
      await queueOperation('daily_logs', 'update', tempData, businessId, userId);
      return { data: tempData, error: null };
    }
    
    const { updateDailyLog: serverAction } = await import('@/app/actions/daily-logs');
    return await serverAction(id, data, businessId, userId);
  };

  const deleteDailyLog = async (id: string, businessId: string) => {
    if (!isOnline) {
      await queueOperation('daily_logs', 'delete', { id }, businessId);
      return { data: null, error: null };
    }
    
    const { deleteDailyLog: serverAction } = await import('@/app/actions/daily-logs');
    return await serverAction(id, businessId);
  };

  return {
    createDailyLog,
    updateDailyLog,
    deleteDailyLog,
  };
}
