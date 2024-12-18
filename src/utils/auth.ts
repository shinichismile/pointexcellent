import { storage } from './storage';
import type { User, AuthCredentials } from '../types';

const AUTH_KEY = 'auth_credentials';
const USERS_KEY = 'users';

// Initial admin credentials and user
const ADMIN_ID = 'admin';
const ADMIN_LOGIN_ID = 'admin';
const ADMIN_PASSWORD = 'admin123';

const INITIAL_ADMIN: User = {
  id: ADMIN_ID,
  loginId: ADMIN_LOGIN_ID,
  name: '管理者',
  email: 'admin@example.com',
  role: 'admin',
  points: 0,
  status: 'active',
  joinedAt: new Date().toISOString(),
  totalEarned: 0,
};

export const AUTH_CREDENTIALS: AuthCredentials = {
  [ADMIN_LOGIN_ID]: ADMIN_PASSWORD,
};

class AuthManager {
  private static instance: AuthManager;
  private credentials: AuthCredentials;
  private initialized: boolean = false;

  private constructor() {
    this.credentials = { ...AUTH_CREDENTIALS };
    this.initialize();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private initialize(): void {
    if (this.initialized) return;
    
    this.loadCredentials();
    this.ensureAdminExists();
    this.initialized = true;
  }

  private loadCredentials(): void {
    const saved = storage.get(AUTH_KEY);
    if (saved) {
      this.credentials = { ...AUTH_CREDENTIALS, ...saved };
    }
    this.saveCredentials();
  }

  private saveCredentials(): void {
    storage.set(AUTH_KEY, this.credentials);
  }

  private ensureAdminExists(): void {
    const users = this.getUsers();
    if (!users[ADMIN_ID]) {
      users[ADMIN_ID] = INITIAL_ADMIN;
      storage.set(USERS_KEY, users);
    }
  }

  verifyCredential(loginId: string, password: string): boolean {
    return this.credentials[loginId] === password;
  }

  addCredential(loginId: string, password: string): void {
    this.credentials[loginId] = password;
    this.saveCredentials();
  }

  removeCredential(loginId: string): void {
    delete this.credentials[loginId];
    this.saveCredentials();
  }

  getUsers(): Record<string, User> {
    const users = storage.get(USERS_KEY, {});
    if (!users[ADMIN_ID]) {
      users[ADMIN_ID] = INITIAL_ADMIN;
      storage.set(USERS_KEY, users);
    }
    return users;
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    users[user.id] = user;
    storage.set(USERS_KEY, users);
  }

  removeUser(userId: string): void {
    if (userId === ADMIN_ID) return; // Prevent admin removal
    const users = this.getUsers();
    delete users[userId];
    storage.set(USERS_KEY, users);
  }

  getCredentials(): AuthCredentials {
    return { ...this.credentials };
  }

  reset(): void {
    // Only reset non-admin data
    const users = this.getUsers();
    const adminUser = users[ADMIN_ID];
    storage.set(USERS_KEY, { [ADMIN_ID]: adminUser });
    
    this.credentials = { ...AUTH_CREDENTIALS };
    this.saveCredentials();
    this.initialized = false;
    this.initialize();
  }
}

export const authManager = AuthManager.getInstance();