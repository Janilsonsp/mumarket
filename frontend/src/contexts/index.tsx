import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Filter, MarketItem, FilterMatch, MonitoringStatus } from '../shared/types';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  monitoringStatus: MonitoringStatus | null;
  monitoringError: string | null;
  latestMatches: FilterMatch[];
  latestItems: MarketItem[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const [latestMatches, setLatestMatches] = useState<FilterMatch[]>([]);
  const [latestItems, setLatestItems] = useState<MarketItem[]>([]);

  useEffect(() => {
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const newSocket = io(apiUrl, {
      auth: { token },
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('monitoring:status', (status: any) => {
      setMonitoringStatus(status);
      if (status.error) {
        setMonitoringError(status.error);
      } else if (status.queryCaptured) {
        setMonitoringError(null);
      } else {
        setMonitoringError(null);
      }
    });

    newSocket.on('monitoring:error', (errorMessage: string) => {
      setMonitoringError(errorMessage);
    });

    newSocket.on('item:match', (matches: any[]) => {
      const matchArray = Array.isArray(matches) ? matches : [matches];
      setLatestMatches(prev => [...matchArray, ...prev].slice(0, 100));
      if (matchArray.length > 0) {
        showNotification(matchArray[0]);
      }
    });

    newSocket.on('market:update', (items: MarketItem[]) => {
      setLatestItems(items);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const showNotification = (match: FilterMatch) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MuDream Market Alert!', {
        body: `${match.filterName}: ${match.itemName} - ${match.priceZen} Zen`,
        icon: '/alert-icon.png',
      });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, monitoringStatus, monitoringError, latestMatches, latestItems }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}

interface FilterContextType {
  filters: Filter[];
  loading: boolean;
  fetchFilters: () => Promise<void>;
  createFilter: (filter: Partial<Filter>) => Promise<Filter>;
  updateFilter: (id: string, filter: Partial<Filter>) => Promise<Filter>;
  deleteFilter: (id: string) => Promise<void>;
  toggleFilter: (id: string) => Promise<void>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const notifyFiltersChanged = () => {};

  const fetchFilters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/filters`, { headers });
      if (response.ok) {
        const data = await response.json();
        setFilters(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const createFilter = async (filter: Partial<Filter>): Promise<Filter> => {
    const response = await fetch(`${API_URL}/api/filters`, {
      method: 'POST',
      headers,
      body: JSON.stringify(filter),
    });
    if (!response.ok) throw new Error('Failed to create filter');
    const newFilter = await response.json();
    setFilters(prev => [newFilter, ...prev]);
    notifyFiltersChanged();
    return newFilter;
  };

  const updateFilter = async (id: string, filter: Partial<Filter>): Promise<Filter> => {
    const response = await fetch(`${API_URL}/api/filters/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(filter),
    });
    if (!response.ok) throw new Error('Failed to update filter');
    const updated = await response.json();
    setFilters(prev => prev.map(f => f.id === id ? updated : f));
    notifyFiltersChanged();
    return updated;
  };

  const deleteFilter = async (id: string) => {
    const response = await fetch(`${API_URL}/api/filters/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete filter');
    setFilters(prev => prev.filter(f => f.id !== id));
    notifyFiltersChanged();
  };

  const toggleFilter = async (id: string) => {
    const response = await fetch(`${API_URL}/api/filters/${id}/toggle`, {
      method: 'PATCH',
      headers,
    });
    if (!response.ok) throw new Error('Failed to toggle filter');
    const updated = await response.json();
    setFilters(prev => prev.map(f => f.id === id ? updated : f));
    notifyFiltersChanged();
  };

  useEffect(() => {
    if (token) fetchFilters();
  }, [token]);

  return (
    <FilterContext.Provider value={{ filters, loading, fetchFilters, createFilter, updateFilter, deleteFilter, toggleFilter }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
}
