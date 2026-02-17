import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import listsService from '../services/lists';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ lists: 0, publicLists: 0, items: 0 });
  const [loading, setLoading] = useState(true);

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

  if (!user) return null;

  const initials = (user.username || 'U').slice(0, 2).toUpperCase();
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : 'N/A';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-deep-blue to-teal" />

        {/* Avatar + Info */}
        <div className="px-6 sm:px-10 pb-8">
          <div className="-mt-14 flex items-end gap-5 mb-6">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-extrabold text-deep-blue">
              {initials}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {user.username}
              </h1>
              <p className="text-gray-500">{user.email}</p>
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
                <p className="text-3xl font-extrabold text-deep-blue">
                  {stats.lists}
                </p>
                <p className="text-xs font-medium text-gray-500 mt-1">Lists</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-teal">
                  {stats.publicLists}
                </p>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  Public
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-blue-600">
                  {stats.items}
                </p>
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
