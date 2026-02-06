import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listsAPI } from '../services/api';

const ListDetails = () => {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchList();
  }, [id]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await listsAPI.getById(id);
      setList(response.data);
    } catch (err) {
      setError('Failed to load list details. Please try again.');
      console.error('Error fetching list:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderRating = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-500 ml-1">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'List not found.'}</p>
          <Link
            to="/explore"
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/explore" className="hover:text-teal-500">Explore</Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-gray-900 font-medium">{list.title}</li>
          </ol>
        </nav>

        {/* List Header */}
        <div className="bg-gradient-to-r from-blue-900 to-teal-700 rounded-t-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">{list.title}</h1>
          {list.user && (
            <p className="text-teal-200 mb-4">Created by {list.user.username}</p>
          )}
          <p className="text-gray-200">{list.description}</p>
          
          <div className="flex items-center gap-4 mt-6">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
              {list.items?.length || 0} items
            </span>
            <span className="px-3 py-1 bg-teal-500 rounded-full text-sm">
              {list.visibility}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-b-xl shadow-lg">
          {list.items && list.items.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {list.items.map((item, index) => (
                <li key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {item.category}
                          </span>
                        )}
                        {item.notes && (
                          <p className="mt-2 text-gray-600 text-sm">{item.notes}</p>
                        )}
                      </div>
                    </div>
                    {renderRating(item.rating)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">This list doesn't have any items yet.</p>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Explore
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListDetails;
