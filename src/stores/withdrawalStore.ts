import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WithdrawalRequest } from '../types';

interface WithdrawalState {
  requests: WithdrawalRequest[];
  addRequest: (request: Omit<WithdrawalRequest, 'id' | 'timestamp' | 'status'>) => void;
  updateStatus: (
    id: string,
    status: WithdrawalRequest['status'],
    adminId: string,
    adminName: string,
    comment?: string
  ) => void;
  getRequestsByWorkerId: (workerId: string) => WithdrawalRequest[];
  getPendingRequests: () => WithdrawalRequest[];
  clearRequests: () => void;
}

export const useWithdrawalStore = create<WithdrawalState>()(
  persist(
    (set, get) => ({
      requests: [],
      
      addRequest: (request) =>
        set((state) => ({
          requests: [
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              status: 'pending',
              ...request,
            },
            ...state.requests,
          ],
        })),
      
      updateStatus: (id, status, adminId, adminName, comment) =>
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status,
                  adminComment: comment,
                  processedAt: new Date().toISOString(),
                  processedBy: {
                    id: adminId,
                    name: adminName,
                  },
                }
              : request
          ),
        })),
      
      getRequestsByWorkerId: (workerId) =>
        get().requests.filter((request) => request.workerId === workerId),
      
      getPendingRequests: () =>
        get().requests.filter((request) => request.status === 'pending'),
      
      clearRequests: () => set({ requests: [] }),
    }),
    {
      name: 'withdrawal-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = localStorage.getItem(name);
          if (!value) return null;
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
            window.dispatchEvent(new StorageEvent('storage', {
              key: name,
              newValue: JSON.stringify(value)
            }));
          } catch (error) {
            console.error('Failed to save to localStorage:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Failed to remove from localStorage:', error);
          }
        },
      })),
      version: 1,
    }
  )
);