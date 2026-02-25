import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaHome, FaCut, FaShoppingCart } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FaCut className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">BarberQ</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  <FaHome className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/shops"
                  className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  <FaShoppingCart className="h-5 w-5" />
                  <span>Shops</span>
                </Link>
               

                {/* User Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                    <FaUser className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">
                      {user?.fullName?.split(' ')[0]}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user?.role === 'barber' ? 'bg-purple-100 text-purple-800' :
                      user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.role}
                    </span>
                  </button>

                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    {user?.role === 'barber' && (
                      <Link
                        to="/my-shops"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        My Shops
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FaSignOutAlt className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;