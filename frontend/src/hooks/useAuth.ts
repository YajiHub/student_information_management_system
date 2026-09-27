import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '../context/AuthContext';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {
        throw new Error('AuthProvider is not mounted above this component.');
      },
      logout: () => {},
    };
  }
  return context;
};
