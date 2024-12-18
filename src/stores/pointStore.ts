import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PointTransaction } from '../types';

interface PointState {
  transactions: PointTransaction[];
  addTransaction: (transaction: Omit<PointTransaction, 'id' | 'timestamp'>) => void;
  clearTransactions: () => void;
}

export const usePointStore = create<PointState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              ...transaction,
            },
            ...state.transactions,
          ],
        })),
      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: 'point-storage',
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