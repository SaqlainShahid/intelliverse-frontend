// src/services/authService.js
import api, { setTokens, clearTokens } from './api';

class AuthService {
  // Send signup OTP
  async sendSignupOTP(userData) {
    try {
      const response = await api.post('/auth/signup/send-otp', userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP'
      };
    }
  }

  // Verify signup OTP and create account
  async verifySignupOTP(otpData) {
    try {
      const response = await api.post('/auth/signup/verify-otp', otpData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed'
      };
    }
  }

  // Send login OTP
  async sendLoginOTP(credentials) {
    try {
      const response = await api.post('/auth/login/send-otp', credentials);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send login OTP'
      };
    }
  }

  // Verify login OTP
  async verifyLoginOTP(otpData) {
    try {
      const response = await api.post('/auth/login/verify-otp', otpData);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Store tokens and user data
        setTokens(tokens.accessToken, tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        return {
          success: true,
          data: response.data.data
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login verification failed'
      };
    }
  }

  // Send forgot password OTP
  async sendForgotPasswordOTP(email) {
    try {
      const response = await api.post('/auth/forgot-password/send-otp', { email });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send reset code'
      };
    }
  }

  // Verify forgot password OTP
  async verifyForgotPasswordOTP(email, otpCode) {
    try {
      const response = await api.post('/auth/forgot-password/verify-otp', {
        email,
        otpCode
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid reset code'
      };
    }
  }

  // Reset password
  async resetPassword(email, otpCode, newPassword) {
    try {
      const response = await api.post('/auth/forgot-password/reset', {
        email,
        otpCode,
        newPassword
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed'
      };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user data'
      };
    }
  }

  // Logout
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get stored user data
  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }
}

export default new AuthService();