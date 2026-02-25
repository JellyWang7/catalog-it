import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  GlobeAltIcon,
  Squares2X2Icon,
  ArrowRightStartOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
  UserPlusIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const navLinks = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/explore', label: 'Explore', icon: GlobeAltIcon },
];

const authNavLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: Squares2X2Icon },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon },
];

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const closeMobile = () => setMobileOpen(false);

  const allLinks = [
    ...navLinks,
    ...(isAuthenticated ? authNavLinks : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-extrabold text-deep-blue">
              CatalogIt
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              {allLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'bg-deep-blue-50 text-deep-blue'
                      : 'text-gray-600 hover:text-deep-blue hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-1.5" />
                  {label}
                </Link>
              ))}

              {/* Auth buttons */}
              <div className="flex items-center ml-4 space-x-2">
                {isAuthenticated ? (
                  <>
                    <span className="text-sm text-gray-500">
                      Hi, <span className="font-semibold text-gray-700">{user?.username}</span>
                    </span>
                    <button
                      onClick={logout}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-1" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-deep-blue rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ArrowRightEndOnRectangleIcon className="w-5 h-5 mr-1" />
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-deep-blue rounded-xl hover:bg-deep-blue-800 transition-colors shadow-md"
                    >
                      <UserPlusIcon className="w-5 h-5 mr-1" />
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white pb-4">
            <div className="px-4 pt-3 space-y-1">
              {allLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMobile}
                  className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive(to)
                      ? 'bg-deep-blue-50 text-deep-blue'
                      : 'text-gray-600 hover:text-deep-blue hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {label}
                </Link>
              ))}
            </div>

            <div className="px-4 pt-3 border-t border-gray-200 mt-2 space-y-1">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Signed in as <span className="font-semibold text-gray-700">{user?.username}</span>
                  </div>
                  <button
                    onClick={() => { logout(); closeMobile(); }}
                    className="flex items-center w-full px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="flex items-center px-3 py-3 text-base font-medium text-gray-600 hover:text-deep-blue hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowRightEndOnRectangleIcon className="w-5 h-5 mr-3" />
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobile}
                    className="flex items-center px-3 py-3 text-base font-semibold text-white bg-deep-blue rounded-xl hover:bg-deep-blue-800 transition-colors"
                  >
                    <UserPlusIcon className="w-5 h-5 mr-3" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-deep-blue py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <p>&copy; {new Date().getFullYear()} CatalogIt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
