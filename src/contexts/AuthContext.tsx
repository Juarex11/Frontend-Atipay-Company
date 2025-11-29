import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback
} from "react";
import type { ReactNode } from "react";
import { loginUser, registerUser } from "@/services/api";

// Types
type UserRole = 'admin' | 'partner';

export interface UserProfile {
  totalInvested: number;
  totalEarnings: number;
  availableBalance: number;
  points: number;
  referralCode: string;
  phone: string;
  country: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  balance: number;
  points: number;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  referralCode?: string;
}

interface TokenPayload {
  sub?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  referral_code?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUserBalance: (balance: number, availableBalance?: number) => void;
  updateUser: (userData: Partial<User>) => void;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const parseTokenPayload = useCallback((token: string | null): TokenPayload => {
    if (!token) return {};
    const payload = token.split('.')[1];
    if (!payload) return {};
    try {
      return JSON.parse(atob(payload)) as TokenPayload;
    } catch (e) {
      console.warn('[AuthContext] Invalid token payload', e);
      return {};
    }
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const createUserFromData = useCallback((parsedUser: Partial<User>, tokenPayload: TokenPayload): User => {
    const email = parsedUser.email || tokenPayload.email || '';
    return {
      id: parsedUser.id || tokenPayload.sub || `user-${Date.now()}`,
      username: parsedUser.username || email.split('@')[0] || `user${Date.now()}`,
      email,
      firstName: parsedUser.firstName || tokenPayload.first_name || email.split('@')[0] || 'User',
      lastName: parsedUser.lastName || tokenPayload.last_name || '',
      role: (parsedUser.role || tokenPayload.role) === 'admin' ? 'admin' : 'partner',
      status: 'active',
      balance: typeof parsedUser.balance === 'number' ? parsedUser.balance : 0,
      points: typeof parsedUser.points === 'number' ? parsedUser.points : 0,
      createdAt: parsedUser.createdAt || new Date().toISOString(),
      updatedAt: parsedUser.updatedAt || new Date().toISOString(),
      profile: {
        totalInvested: parsedUser.profile?.totalInvested || 0,
        totalEarnings: parsedUser.profile?.totalEarnings || 0,
        availableBalance: parsedUser.profile?.availableBalance || 0,
        points: parsedUser.profile?.points || 0,
        referralCode: parsedUser.profile?.referralCode || tokenPayload.referral_code || '',
        phone: parsedUser.profile?.phone || '',
        country: parsedUser.profile?.country || ''
      }
    };
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!savedUser || !token) {
        clearAuthData();
        return;
      }

      const parsedUser = JSON.parse(savedUser);
      if (!parsedUser || typeof parsedUser !== 'object') {
        throw new Error("Invalid user format");
      }

      const tokenPayload = parseTokenPayload(token);
      // Asegurarse de que el rol se mantenga del usuario guardado si existe
      const userData = createUserFromData({
        ...parsedUser,
        // Si el rol no está en el token, mantener el rol existente
        role: tokenPayload.role || parsedUser.role
      }, tokenPayload);

      setUser(userData);
    } catch (error) {
      console.error('[AuthContext] Error checking auth status:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData, parseTokenPayload, createUserFromData, setUser, setIsLoading]);

  const login = useCallback(async (usernameOrEmail: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await loginUser(usernameOrEmail, password);
      if (!response.token) {
        throw new Error("No token received in server response");
      }

      const tokenPayload = parseTokenPayload(response.token);
      const userId = tokenPayload.sub || `user-${Date.now()}`;
      const userEmail = tokenPayload.email || (usernameOrEmail.includes('@') ? usernameOrEmail : '');
      const username = tokenPayload.email?.split('@')[0] ||
        (usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail);
      // Usar el rol directamente de la respuesta de la API
      const role = response.role === 'admin' ? 'admin' as const : 'partner' as const;

      const userData: User = {
        id: userId,
        username,
        email: userEmail,
        firstName: tokenPayload.first_name || 'User',
        lastName: tokenPayload.last_name || '',
        role,
        status: 'active',
        balance: 0,
        points: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          totalInvested: 0,
          totalEarnings: 0,
          availableBalance: 0,
          points: 0,
          referralCode: tokenPayload.referral_code || '',
          phone: '',
          country: ''
        }
      };

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // Redirect after state update
      setTimeout(() => {
        window.location.href = role === 'admin' ? '/admin/dashboard' : '/dashboard';
      }, 100);

    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      clearAuthData();
      throw error instanceof Error ? error : new Error('Unknown login error');
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData, parseTokenPayload]);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        referralCode: data.referralCode
      });

      if (!response.token) {
        throw new Error("No token received in server response");
      }

      const tokenPayload = parseTokenPayload(response.token);
      const userId = tokenPayload.sub || `user-${Date.now()}`;

      const userData: User = {
        id: userId,
        username: data.email.split('@')[0] || `user${Date.now()}`,
        email: data.email,
        firstName: data.firstName || 'User',
        lastName: data.lastName || '',
        role: tokenPayload.role === 'admin' ? 'admin' : 'partner',
        status: 'active',
        balance: 0,
        points: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          totalInvested: 0,
          totalEarnings: 0,
          availableBalance: 0,
          points: 0,
          referralCode: data.referralCode || '',
          phone: '',
          country: ''
        }
      };

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // Redirect after state update
      setTimeout(() => {
        window.location.href = userData.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      }, 100);

    } catch (error) {
      console.error('[AuthContext] Registration error:', error);
      clearAuthData();
      throw error instanceof Error ? error : new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData, parseTokenPayload]);

  const logout = useCallback(() => {
    clearAuthData();
  }, [clearAuthData]);

  const updateUserBalance = useCallback((balance: number, availableBalance?: number) => {
    if (!user) return;

    const validBalance = isNaN(balance) ? 0 : balance;
    const validAvailableBalance = isNaN(availableBalance ?? 0) ? validBalance : (availableBalance ?? validBalance);

    const defaultProfile = {
      totalInvested: 0,
      totalEarnings: 0,
      availableBalance: 0,
      points: 0,
      referralCode: '',
      phone: '',
      country: ''
    };

    const updatedUser: User = {
      ...user,
      balance: validBalance,
      profile: {
        ...(user.profile || defaultProfile),
        availableBalance: validAvailableBalance
      } as UserProfile
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, [user]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prevUser: User | null) => {
      if (!prevUser) return prevUser;

      const updatedProfile = {
        ...(userData.profile || {}),
        ...(prevUser.profile || {})
      };

      return {
        ...prevUser,
        ...userData,
        profile: updatedProfile
      };
    });
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUserBalance,
    updateUser,
  }), [user, isLoading, login, register, logout, updateUserBalance, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

export type { AuthContextType };
