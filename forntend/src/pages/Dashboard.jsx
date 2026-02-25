// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shopService } from './shop/shop.service';
import { FaCut, FaUsers, FaClock, 
    FaHistory, FaPlus, FaMapMarkerAlt, 
    FaPhone, FaStar, FaUser, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [myShops, setMyShops] = useState([]);
  const [recentShops, setRecentShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // If user is barber, fetch their shops
      if (user?.role === 'barber') {
        try {
          const myShopsResponse = await shopService.getMyShops();
        //  console.log('My shops response:', myShopsResponse); // Debug log
          
          // Handle response structure
          if (myShopsResponse.success) {
            // Ensure we have an array
            const shopsData = myShopsResponse.data?.shops || myShopsResponse.data || myShopsResponse.shops || [];
            setMyShops(Array.isArray(shopsData) ? shopsData : []);
          } else {
            // Handle different response structures
            const shopsData = myShopsResponse?.data || myShopsResponse?.shops || [];
            setMyShops(Array.isArray(shopsData) ? shopsData : []);
          }
        } catch (shopError) {
          console.error('Error fetching my shops:', shopError);
          setMyShops([]);
          toast.error('Failed to load your shops');
        }
      }
      
      // Fetch recent shops for all users
      try {
        const shopsResponse = await shopService.getAllShops({ limit: 3 });
       // console.log('Recent shops response:', shopsResponse); // Debug log
        
        if (shopsResponse.success) {
          const recentShopsData = shopsResponse.data?.shops || shopsResponse.shops || [];
          setRecentShops(Array.isArray(recentShopsData) ? recentShopsData : []);
        } else {
          // Handle different response structures
          const recentShopsData = shopsResponse?.data || shopsResponse?.shops || [];
          setRecentShops(Array.isArray(recentShopsData) ? recentShopsData : []);
        }
      } catch (recentError) {
        console.error('Error fetching recent shops:', recentError);
        setRecentShops([]);
        toast.error('Failed to load recent shops');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
              <p className="text-xl opacity-90">
                {user?.role === 'barber' 
                  ? 'Manage your barbershop and customers'
                  : 'Book your next haircut with ease'}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm opacity-80">Account Type</p>
                  <p className="text-lg font-semibold capitalize">{user?.role}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FaUser className="h-6 w-6" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-[1.02] transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-900">24</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaCalendarAlt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-[1.02] transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Wait Time</p>
                <p className="text-3xl font-bold text-gray-900">15 min</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaClock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-[1.02] transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Price</p>
                <p className="text-3xl font-bold text-gray-900">$25</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaDollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2">
            {user?.role === 'barber' && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Shops</h2>
                  <Link
                    to="/shops/create"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <FaPlus className="h-4 w-4" />
                    <span>Create Shop</span>
                  </Link>
                </div>
                
                {!Array.isArray(myShops) || myShops.length === 0 ? (
                  <div className="text-center py-8">
                    <FaCut className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">You don't have any shops yet</p>
                    <Link
                      to="/shops/create"
                      className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Create Your First Shop
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myShops.slice(0, 4).map((shop) => (
                        <div key={shop._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-gray-900 truncate">{shop.name}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {shop.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                              <span className="truncate">{shop.address?.city}, {shop.address?.state}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FaPhone className="h-4 w-4 mr-2" />
                              <span>{shop.phone}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FaUsers className="h-4 w-4 mr-2" />
                              <span>{shop.services?.length || 0} services</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Link
                              to={`/shops/${shop._id}`}
                              className="flex-1 text-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
                            >
                              View
                            </Link>
                            <Link
                              to={`/shops/edit/${shop._id}`}
                              className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {myShops.length > 4 && (
                      <div className="mt-4 text-center">
                        <Link
                          to="/my-shops"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View all {myShops.length} shops →
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Recent Shops */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Barbershops</h2>
              
              {!Array.isArray(recentShops) || recentShops.length === 0 ? (
                <div className="text-center py-8">
                  <FaCut className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No shops available</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {recentShops.map((shop) => (
                      <div key={shop._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-bold text-gray-900">{shop.name}</h3>
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {shop.averageWaitTime || 15} min wait
                              </span>
                            </div>
                            
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                                <span>{shop.address?.city}, {shop.address?.state}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <FaPhone className="h-4 w-4 mr-2" />
                                <span>{shop.phone}</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center space-x-4">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar key={i} className={`h-4 w-4 ${
                                    i < 4 ? 'text-yellow-400' : 'text-gray-300'
                                  }`} />
                                ))}
                                <span className="ml-2 text-sm text-gray-600">4.5</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {shop.services?.length || 0} services
                              </span>
                            </div>
                          </div>
                          
                          <Link
                            to={`/shops/${shop._id}`}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 text-center">
                    <Link
                      to="/shops"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <span>Browse all shops</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Profile & Quick Links */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
              
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 mb-4">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FaUser className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{user?.fullName}</h3>
                <p className="text-gray-600">{user?.email}</p>
                <span className={`mt-2 px-3 py-1 text-sm font-medium rounded-full ${
                  user?.role === 'barber' ? 'bg-purple-100 text-purple-800' :
                  user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role}
                </span>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                <Link
                  to="/shops"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaCut className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Find Shops</p>
                      <p className="text-sm text-gray-500">Browse barbershops</p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                {/* {user?.role === 'user' && (
                  <Link
                    to="/my-appointments"
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FaCalendarAlt className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">My Appointments</p>
                        <p className="text-sm text-gray-500">View bookings</p>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )} */}

                {user?.role === 'barber' && (
                  <Link
                    to="/queue/manage"
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FaUsers className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Manage Queue</p>
                        <p className="text-sm text-gray-500">View customers</p>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}

                {/* <Link
                  to="/profile"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FaUser className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Edit Profile</p>
                      <p className="text-sm text-gray-500">Update information</p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;