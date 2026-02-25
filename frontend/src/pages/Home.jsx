import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Hero Section */}
      <header className="py-20 lg:py-32 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-semibold tracking-wider uppercase mb-3 text-teal">
            Your World. Organized.
          </p>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 leading-tight mb-8">
            The Cataloging{' '}
            <span className="text-deep-blue">Productivity</span> Platform
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-10">
            From rare collectibles to critical business assets, CatalogIt gives
            you the control to list, enrich, rate, and share every item that
            matters.
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/signup'}
            className="inline-block px-10 py-4 bg-deep-blue text-white font-extrabold text-lg rounded-xl hover:bg-deep-blue-800 transition-colors shadow-xl shadow-blue-500/50"
          >
            Start Cataloging Now &rarr;
          </Link>
        </div>
      </header>

      {/* Features Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
              <div className="w-14 h-14 bg-deep-blue-50 text-deep-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Organize Anything</h3>
              <p className="text-gray-600">Create custom lists for any collection — books, coins, recipes, or business assets.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
              <div className="w-14 h-14 bg-teal-50 text-teal rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rate &amp; Review</h3>
              <p className="text-gray-600">Add ratings (1-5) and detailed notes to each item in your collection.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Share Publicly</h3>
              <p className="text-gray-600">Make your lists public for the community to discover and explore.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
