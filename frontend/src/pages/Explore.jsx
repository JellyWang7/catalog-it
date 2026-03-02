import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import listsService from '../services/lists';
import toast from 'react-hot-toast';
import ListCardSkeleton from '../components/ListCardSkeleton';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'most_items', label: 'Most Items' },
];

export default function Explore() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listsService.getAll({
          public_only: true,
          search: search.trim() || undefined,
          sort,
        });
        setLists(res.data);
      } catch {
        toast.error('Failed to load public lists');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [search, sort]);

  const results = lists;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-deep-blue mb-2">
          Explore Public Lists
        </h1>
        <p className="text-lg text-gray-600">
          Discover curated collections shared by the CatalogIt community.
        </p>

        {/* Search + Sort */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative w-full sm:w-80">
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

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm text-gray-700 focus:ring-2 focus:ring-teal focus:border-teal transition-all"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {!loading && (
            <span className="text-sm text-gray-400">
              {results.length} list{results.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </header>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ListCardSkeleton count={8} />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20">
          <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 text-lg">
            {search ? `No lists match "${search}"` : 'No public lists found.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-deep-blue font-semibold hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((list) => (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="bg-white rounded-2xl shadow-lg border-t-4 border-deep-blue hover:shadow-xl transition-all group overflow-hidden"
            >
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-1 truncate group-hover:text-deep-blue transition-colors">
                  {list.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {list.description || 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-deep-blue">
                    {list.items?.length || 0} items
                  </span>
                  {list.user && (
                    <span className="text-xs text-gray-400">
                      by {list.user.username || `User #${list.user_id}`}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
