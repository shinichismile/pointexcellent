import type { User, PointTransaction, WithdrawalRequest } from '../../types';

export interface StorageData {
  'auth-storage': {
    state: {
      user: User | null;
      users: Record<string, User>;
      isAuthenticated: boolean;
      customIcon?: string;
    };
    version: number;
  };
  'point-storage': {
    state: {
      transactions: PointTransaction[];
    };
    version: number;
  };
  'withdrawal-storage': {
    state: {
      requests: WithdrawalRequest[];
    };
    version: number;
  };
}

export type StorageKey = keyof StorageData;

export interface StorageOptions {
  expires?: number;
  version?: number;
}

export interface StorageValue<T = unknown> {
  data: T;
  timestamp: number;
  version: number;
  expires?: number;
}

export interface StorageEvent {
  key: StorageKey;
  value: unknown;
}