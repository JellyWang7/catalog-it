import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import listsService from '../services/lists';
import authService from '../services/auth';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ lists: 0, publicLists: 0, items: 0 });
  const [loading, setLoading] = useState(true);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled || false);
  const [mfaSetup, setMfaSetup] = useState(null); // { otp_secret, provisioning_uri }
  const [otpCode, setOtpCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await listsService.getAll();
        const myLists = res.data.filter((l) => l.user_id === user?.id);
        const totalItems = myLists.reduce(
          (sum, l) => sum + (l.items?.length || 0),
          0
        );
        setStats({
          lists: myLists.length,
          publicLists: myLists.filter((l) => l.visibility === 'public').length,
          items: totalItems,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  useEffect(() => {
    setMfaEnabled(user?.mfa_enabled || false);
  }, [user?.mfa_enabled]);

  const handleMfaSetup = async () => {
    setMfaLoading(true);
    try {
      const res = await authService.mfaSetup();
      setMfaSetup(res.data);
    } catch {
      toast.error('Failed to start MFA setup');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setMfaLoading(true);
    try {
      await authService.mfaVerify(otpCode);
      setMfaEnabled(true);
      setMfaSetup(null);
      setOtpCode('');
      toast.success('MFA enabled! You will need your authenticator on next login.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaDisable = async () => {
    setMfaLoading(true);
    try {
      await authService.mfaDisable();
      setMfaEnabled(false);
      toast.success('MFA disabled');
    } catch {
      toast.error('Failed to disable MFA');
    } finally {
      setMfaLoading(false);
    }
  };

  if (!user) return null;

  const initials = (user.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Decorative top bar only — avatar + text sit fully on white below (no overlap / half-on-gradient) */}
        <div className="h-16 sm:h-20 bg-gradient-to-r from-deep-blue to-teal" />

        <div className="px-6 sm:px-10 pb-8 pt-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8">
            <div
              className="w-24 h-24 rounded-full bg-gray-50 border-4 border-white shadow-lg ring-2 ring-gray-100 flex items-center justify-center text-3xl font-extrabold text-deep-blue flex-shrink-0"
              aria-hidden
            >
              {initials}
            </div>
            <div className="text-center sm:text-left min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {user.username}
              </h1>
              <p className="text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Role
              </p>
              <p className="text-lg font-semibold text-gray-800 capitalize">
                {user.role || 'user'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Status
              </p>
              <span
                className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : user.status === 'suspended'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {user.status || 'active'}
              </span>
            </div>
          </div>

          {/* MFA Section */}
          <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500">
                  {mfaEnabled
                    ? 'MFA is active. Your account has extra protection.'
                    : 'Add an extra layer of security to your account.'}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  mfaEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {!mfaEnabled && !mfaSetup && (
              <button
                onClick={handleMfaSetup}
                disabled={mfaLoading}
                className="px-5 py-2 bg-deep-blue text-white font-semibold rounded-xl hover:bg-deep-blue-800 transition-colors text-sm disabled:opacity-50"
              >
                {mfaLoading ? 'Setting up...' : 'Enable MFA'}
              </button>
            )}

            {mfaSetup && (
              <div className="mt-3 space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    1. Add this secret to your authenticator app (Google Authenticator, Authy, etc.):
                  </p>
                  <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded-lg font-mono text-sm break-all select-all">
                    {mfaSetup.otp_secret}
                  </code>
                  <p className="text-xs text-gray-400 mt-2">
                    Or use this URI: <span className="break-all">{mfaSetup.provisioning_uri}</span>
                  </p>
                </div>
                <form onSubmit={handleMfaVerify} className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-mono text-center text-lg tracking-widest focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-all"
                  />
                  <button
                    type="submit"
                    disabled={mfaLoading || otpCode.length < 6}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </form>
                <button
                  onClick={() => { setMfaSetup(null); setOtpCode(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {mfaEnabled && (
              <button
                onClick={handleMfaDisable}
                disabled={mfaLoading}
                className="px-5 py-2 text-red-600 border border-red-300 font-semibold rounded-xl hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
              >
                {mfaLoading ? 'Disabling...' : 'Disable MFA'}
              </button>
            )}
          </div>

          {/* Stats */}
          <h2 className="text-lg font-bold text-gray-800 mb-3">Your Stats</h2>
          {loading ? (
            <div className="animate-pulse flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl flex-1" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-deep-blue-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-deep-blue">{stats.lists}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Lists</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-teal">{stats.publicLists}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Public</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-blue-600">{stats.items}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Items</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-deep-blue text-white font-semibold rounded-xl hover:bg-deep-blue-800 transition-colors shadow-md"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/explore"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Explore Lists
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
