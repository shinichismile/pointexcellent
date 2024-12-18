import { StorageOptions } from '../types';

class StorageManager {
  private static instance: StorageManager;
  private prefix = 'pointmoney_';
  private persistentKeys = new Set([
    'auth-storage',
    'point-storage',
    'withdrawal-storage'
  ]);
  private initialized = false;

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
      // Test localStorage availability
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      
      // Initialize default data if needed
      this.persistentKeys.forEach(key => {
        const prefixedKey = this.getKey(key);
        const value = localStorage.getItem(prefixedKey);
        if (!value) {
          localStorage.setItem(prefixedKey, JSON.stringify({}));
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('Storage initialization failed:', error);
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get(key: string, defaultValue: any = null): any {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      const prefixedKey = this.getKey(key);
      const value = localStorage.getItem(prefixedKey);
      
      if (!value) return defaultValue;
      
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  set(key: string, value: any): boolean {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      if (!this.persistentKeys.has(key)) {
        console.warn(`Attempting to store non-persistent key: ${key}`);
        return false;
      }

      const prefixedKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serializedValue);

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

  remove(key: string): boolean {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      const prefixedKey = this.getKey(key);
      localStorage.removeItem(prefixedKey);
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
      this.persistentKeys.forEach(key => {
        this.remove(key);
      });
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  sync(): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }

    try {
      this.persistentKeys.forEach(key => {
        const prefixedKey = this.getKey(key);
        const value = localStorage.getItem(prefixedKey);
        if (value) {
          window.dispatchEvent(new CustomEvent('storageSync', {
            detail: { key, value: JSON.parse(value) }
          }));
        }
      });
    } catch (error) {
      console.error('Storage sync error:', error);
    }
  }
}

export const storage = StorageManager.getInstance();