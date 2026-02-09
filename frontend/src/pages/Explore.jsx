import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import listsService from '../services/lists';
import toast from 'react-hot-toast';

export default function Explore() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await listsService.getAll();
        setLists(res.data);
      } catch {
        toast.error('Failed to load public lists');
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, []);

  const filtered = lists.filter(
    (list) =>
      list.title?.toLowerCase().includes(search.toLowerCase()) ||
      list.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Search */}
      <header className="mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-4xl font-extrabold text-deep-blue mb-2">
          Explore Public Lists
        </h1>
        <p className="text-lg text-gray-600">
          Discover curated collections shared by the CatalogIt community.
        </p>
        <div className="mt-6 relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search public lists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal focus:border-teal transition-all"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>

      {/* List Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No public lists found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((list) => (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="bg-white p-5 rounded-2xl shadow-lg border-t-4 border-deep-blue hover:shadow-xl transition-all"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                {list.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {list.description || 'No description'}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-deep-blue">
                  {list.items?.length || 0} items
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
