import React, { useState } from 'react';
import { Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { loginAdmin, requestPasswordReset, resetPasswordWithToken } from '../lib/auth';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLoginSuccess, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await loginAdmin(email, password);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    const result = await requestPasswordReset(email);

    if (result.success) {
      setSuccessMessage(`Reset token generated: ${result.token}`);
      setResetStep('reset');
    } else {
      setError(result.error || 'Failed to request password reset');
    }

    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const result = await resetPasswordWithToken(resetToken, newPassword);

    if (result.success) {
      setSuccessMessage('Password reset successfully! You can now login.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStep('request');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMessage('');
      }, 2000);
    } else {
      setError(result.error || 'Failed to reset password');
    }

    setIsLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setResetStep('request');
              setError('');
              setSuccessMessage('');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {resetStep === 'request' ? 'Reset Password' : 'Enter New Password'}
            </h1>
            <p className="text-gray-600 text-center mb-6">
              {resetStep === 'request'
                ? 'Enter your email to receive a reset token'
                : 'Enter the reset token and your new password'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-mono break-all">{successMessage}</p>
              </div>
            )}

            {resetStep === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Generating Token...' : 'Generate Reset Token'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter the reset token"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Copy the reset token and keep it secure. It expires in 15 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Welcome
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Admin Login
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your credentials to access the admin panel
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              Forgot your password?
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Only authorized administrators can access this area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
