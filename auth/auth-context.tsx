import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { hashPassword, verifyPassword } from './password';

const SESSION_KEY = 'habit-tracker.session.userId';

type AuthUser = {
  id: number;
  email: string;
  displayName: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function toAuthUser(row: { id: number; email: string; displayName: string }): AuthUser {
  return { id: row.id, email: row.email, displayName: row.displayName };
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedId = await AsyncStorage.getItem(SESSION_KEY);

      if (!storedId) {
        setLoading(false);
        return;
      }

      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(storedId)));

      if (rows[0]) {
        setUser(toAuthUser(rows[0]));
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
      }

      setLoading(false);
    };

    void restoreSession();
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const normalized = email.trim().toLowerCase();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, normalized));

      if (existing.length > 0) {
        throw new Error('An account already exists for this email.');
      }

      const passwordHash = await hashPassword(password);
      const [row] = await db
        .insert(users)
        .values({ email: normalized, displayName: displayName.trim(), passwordHash })
        .returning();

      await AsyncStorage.setItem(SESSION_KEY, String(row.id));
      setUser(toAuthUser(row));
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const [row] = await db.select().from(users).where(eq(users.email, normalized));

    if (!row) {
      throw new Error('No account found for this email.');
    }

    const valid = await verifyPassword(password, row.passwordHash);

    if (!valid) {
      throw new Error('Incorrect password.');
    }

    await AsyncStorage.setItem(SESSION_KEY, String(row.id));
    setUser(toAuthUser(row));
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    await db.delete(users).where(eq(users.id, user.id));
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
