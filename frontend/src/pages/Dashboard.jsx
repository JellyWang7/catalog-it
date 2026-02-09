import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-deep-blue mb-2">
          My Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Welcome back, <span className="font-semibold">{user?.username}</span>!
          Manage your catalogs here.
        </p>
      </header>

      {/* Placeholder — will be built out in subsequent days */}
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
        <p className="text-gray-400 text-lg">
          Your lists and dashboard features are coming soon.
        </p>
      </div>
    </div>
  );
}
