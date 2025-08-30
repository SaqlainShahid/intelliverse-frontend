// src/contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case actionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          dispatch({ type: actionTypes.SET_USER, payload: storedUser });
          return;
        }

        // Verify token with backend
        const result = await authService.getCurrentUser();
        if (result.success) {
          dispatch({ type: actionTypes.SET_USER, payload: result.data.user });
        } else {
          dispatch({ type: actionTypes.LOGOUT });
        }
      } else {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    } catch (error) {
      dispatch({ type: actionTypes.LOGOUT });
    }
  };

  const login = async (otpData) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    const result = await authService.verifyLoginOTP(otpData);
    
    if (result.success) {
      dispatch({ type: actionTypes.SET_USER, payload: result.data.user });
      return { success: true };
    } else {
      dispatch({ type: actionTypes.SET_ERROR, payload: result.message });
      return { success: false, message: result.message };
    }
  };

  const signup = async (otpData) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    const result = await authService.verifySignupOTP(otpData);
    
    if (result.success) {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return { success: true };
    } else {
      dispatch({ type: actionTypes.SET_ERROR, payload: result.message });
      return { success: false, message: result.message };
    }
  };

  const logout = async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    await authService.logout();
    dispatch({ type: actionTypes.LOGOUT });
  };

  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    signup,
    logout,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 