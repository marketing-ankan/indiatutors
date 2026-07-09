import { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, loginUser, registerUser, logoutUser, TOKEN_KEY } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  // Token lives in React state (seeded from localStorage) so sign-in/out is reactive.
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const setToken = (t) => {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
    setTokenState(t || null);
  };

  const login = useCallback(async (creds) => {
    const { token } = await loginUser(creds);
    setToken(token);
    await qc.invalidateQueries({ queryKey: ['me'] });
  }, [qc]);

  const register = useCallback(async (payload) => {
    const { token } = await registerUser(payload);
    setToken(token);
    await qc.invalidateQueries({ queryKey: ['me'] });
  }, [qc]);

  const logout = useCallback(async () => {
    try { await logoutUser(); } catch { /* token may already be gone */ }
    setToken(null);
    qc.setQueryData(['me'], null);
    qc.removeQueries({ queryKey: ['me'] });
  }, [qc]);

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isAuthed: !!user,
      isLoading: !!token && isLoading,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
