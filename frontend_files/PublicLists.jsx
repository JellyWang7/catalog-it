import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listsAPI } from '../services/api';

const PublicLists = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'movies', label: 'Movies' },
    { id: 'books', label: 'Books' },
    { id: 'music', label: 'Music' },
    { id: 'games', label: 'Games' },
    { id: 'collectibles', label: 'Collectibles' },
  ];

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await listsAPI.getAll();
      setLists(response.data);
    } catch (err) {
      setError('Failed to load lists. Please try again.');
      console.error('Error fetching lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLists = lists.filter((list) => {
    const matchesSearch = list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || list.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchLists}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Public Lists</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover curated collections from our community. Find inspiration for your next watch, read, or collection.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-gray-600 mb-6">
          Showing {filteredLists.length} {filteredLists.length === 1 ? 'list' : 'lists'}
        </p>

        {/* Lists Grid */}
        {filteredLists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No lists found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLists.map((list) => (
              <Link
                key={list.id}
                to={`/lists/${list.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-900 to-teal-700 p-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-teal-200 transition-colors">
                    {list.title}
                  </h3>
                  {list.user && (
                    <p className="text-teal-200 text-sm mt-1">by {list.user.username}</p>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <p className="text-gray-600 line-clamp-2 mb-4">
                    {list.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {list.items?.length || 0} items
                    </span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs">
                      {list.category || 'General'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicLists;
