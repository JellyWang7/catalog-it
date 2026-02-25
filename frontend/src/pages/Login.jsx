import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [mfaStep, setMfaStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const credentials = mfaStep
        ? { ...form, otp_code: otpCode }
        : form;

      const data = await login(credentials);

      if (data.mfa_required) {
        setMfaStep(true);
        toast('MFA code required. Check your authenticator app.', { icon: '🔐' });
      } else {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.join(', ') ||
        'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {mfaStep ? 'Enter your authenticator code' : 'Sign in to manage your catalogs'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!mfaStep ? (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Authenticator Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-all"
                placeholder="000000"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-400 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-deep-blue text-white font-semibold rounded-xl hover:bg-deep-blue-800 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : mfaStep ? 'Verify Code' : 'Sign In'}
          </button>
        </form>

        {mfaStep && (
          <button
            onClick={() => { setMfaStep(false); setOtpCode(''); }}
            className="mt-3 w-full text-center text-sm text-gray-500 hover:text-deep-blue transition-colors"
          >
            Back to login
          </button>
        )}

        {!mfaStep && (
          <>
            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 hover:text-deep-blue transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
            <p className="mt-4 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-deep-blue font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
