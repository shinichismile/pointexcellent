import type { StorageData, StorageKey, StorageOptions, StorageValue } from './types';
import { validateStorageKey, validateStorageValue, validateStorageData } from './validation';

class StorageManager {
  private static instance: StorageManager;
  private prefix = 'pointmoney_';
  private initialized = false;
  private cache = new Map<StorageKey, StorageValue>();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private initialize(): void {
    if (this.initialized) return;
    
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      
      // Initialize default data
      Object.keys(StorageData).forEach(key => {
        if (validateStorageKey(key)) {
          const prefixedKey = this.getKey(key);
          const value = localStorage.getItem(prefixedKey);
          if (!value) {
            this.set(key, {});
          }
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('Storage initialization failed:', error);
    }
  }

  private getKey(key: StorageKey): string {
    return `${this.prefix}${key}`;
  }

  get<K extends StorageKey>(key: K, defaultValue: StorageData[K]['state']): StorageData[K]['state'] {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        return cached.data as StorageData[K]['state'];
      }

      const prefixedKey = this.getKey(key);
      const value = localStorage.getItem(prefixedKey);
      
      if (!value) return defaultValue;
      
      const parsed = JSON.parse(value) as StorageValue;
      
      if (!validateStorageData(parsed) || this.isExpired(parsed)) {
        return defaultValue;
      }

      // Update cache
      this.cache.set(key, parsed);
      
      return parsed.data as StorageData[K]['state'];
    } catch {
      return defaultValue;
    }
  }

  set<K extends StorageKey>(
    key: K,
    value: StorageData[K]['state'],
    options: StorageOptions = {}
  ): boolean {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      if (!validateStorageValue(key, value)) {
        throw new Error('Invalid storage value');
      }

      const storageValue: StorageValue = {
        data: value,
        timestamp: Date.now(),
        version: options.version || 1,
        expires: options.expires,
      };

      const prefixedKey = this.getKey(key);
      const serializedValue = JSON.stringify(storageValue);
      localStorage.setItem(prefixedKey, serializedValue);

      // Update cache
      this.cache.set(key, storageValue);

      // Dispatch custom event for cross-tab synchronization
      window.dispatchEvent(new CustomEvent('storageSync', {
        detail: { key, value }
      }));

      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  remove(key: StorageKey): boolean {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      const prefixedKey = this.getKey(key);
      localStorage.removeItem(prefixedKey);
      this.cache.delete(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      Object.keys(StorageData).forEach(key => {
        if (validateStorageKey(key)) {
          this.remove(key);
        }
      });
      this.cache.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  sync(): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      Object.keys(StorageData).forEach(key => {
        if (validateStorageKey(key)) {
          const prefixedKey = this.getKey(key);
          const value = localStorage.getItem(prefixedKey);
          if (value) {
            const parsed = JSON.parse(value);
            if (validateStorageData(parsed) && !this.isExpired(parsed)) {
              this.cache.set(key as StorageKey, parsed);
              window.dispatchEvent(new CustomEvent('storageSync', {
                detail: { key, value: parsed.data }
              }));
            }
          }
        }
      });
    } catch (error) {
      console.error('Storage sync error:', error);
    }
  }

  private isExpired(value: StorageValue): boolean {
    if (!value.expires) return false;
    return Date.now() > value.timestamp + value.expires;
  }
}

export const storage = StorageManager.getInstance();