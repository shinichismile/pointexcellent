import type { StorageData, StorageKey, StorageValue } from './types';

export function validateStorageKey(key: string): key is StorageKey {
  return ['auth-storage', 'point-storage', 'withdrawal-storage'].includes(key);
}

export function validateStorageValue<K extends StorageKey>(
  key: K,
  value: unknown
): value is StorageData[K]['state'] {
  if (!value || typeof value !== 'object') {
    return false;
  }

  switch (key) {
    case 'auth-storage':
      return 'user' in value && 'users' in value && 'isAuthenticated' in value;
    case 'point-storage':
      return 'transactions' in value;
    case 'withdrawal-storage':
      return 'requests' in value;
    default:
      return false;
  }
}

export function validateStorageData<T>(value: StorageValue<T>): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'timestamp' in value &&
    'version' in value &&
    typeof value.timestamp === 'number' &&
    typeof value.version === 'number'
  );
}