import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/auth';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState(null); // dev-only convenience

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authService.forgotPassword({ email });
      setSent(true);
      toast.success('Reset instructions sent!');
      // In development, the API returns the token for demo convenience
      if (res.data.reset_token) {
        setResetToken(res.data.reset_token);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
          Forgot Password
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Enter your email and we&apos;ll send you a reset link
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-all"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-deep-blue text-white font-semibold rounded-xl hover:bg-deep-blue-800 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Check your email!</p>
            <p className="text-sm text-gray-500">
              If an account exists for <strong>{email}</strong>, you&apos;ll
              receive a password reset link shortly.
            </p>

            {/* Dev-only: direct link for demo */}
            {resetToken && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                <p className="text-xs font-semibold text-amber-700 mb-2">
                  Demo Mode — Reset Link:
                </p>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="text-sm text-deep-blue font-medium hover:underline break-all"
                >
                  Click here to reset your password
                </Link>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link
            to="/login"
            className="text-deep-blue font-semibold hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
