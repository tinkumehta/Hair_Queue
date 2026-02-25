// pages/shops/ShopList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shopService } from './shop.service';
import { useAuth } from '../../context/AuthContext';
import { 
  FaSearch, FaMapMarkerAlt, FaFilter, FaStar, FaClock, 
  FaPhone, FaCut, FaMap, FaDirections, FaRegStar 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const ShopList = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    minWaitTime: '',
    maxWaitTime: '',
    minRating: '',
    featured: '',
    sort: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  const { user } = useAuth();

  useEffect(() => {
    fetchShops();
    fetchFeaturedShops();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  };

  const fetchShops = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await shopService.getAllShops(params);
      
      if (response.success) {
        setShops(response.data.shops || []);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedShops = async () => {
    try {
      const response = await shopService.getFeaturedShops();
      if (response.success) {
        setFeaturedShops(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching featured shops:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchShops(1);
  };

  const handlePageChange = (page) => {
    fetchShops(page);
  };

  const handleNearbyShops = async () => {
    if (!userLocation) {
      toast.error('Please enable location services to find nearby shops');
      return;
    }

    try {
      setLoading(true);
      const response = await shopService.getNearbyShops(
        userLocation.lat,
        userLocation.lng,
        10000 // 10km radius
      );
      
      if (response.success) {
        setShops(response.data || []);
        setPagination({
          page: 1,
          limit: 20,
          total: response.data.length,
          pages: 1
        });
        toast.success(`Found ${response.data.length} shops nearby`);
      }
    } catch (error) {
      toast.error('Failed to load nearby shops');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      minWaitTime: '',
      maxWaitTime: '',
      minRating: '',
      featured: '',
      sort: 'newest'
    });
    fetchShops(1);
  };

  const getDirections = (shop) => {
    if (userLocation && shop.location?.coordinates) {
      const [lng, lat] = shop.location.coordinates;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&origin=${userLocation.lat},${userLocation.lng}`;
      window.open(googleMapsUrl, '_blank');
    } else if (shop.location?.coordinates) {
      const [lng, lat] = shop.location.coordinates;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      toast.error('Location not available for this shop');
    }
  };

  const calculateDistance = (shop) => {
    if (!userLocation || !shop.location?.coordinates) return null;
    
    const [shopLng, shopLat] = shop.location.coordinates;
    const R = 6371; // Earth's radius in km
    
    const dLat = (shopLat - userLocation.lat) * Math.PI / 180;
    const dLon = (shopLng - userLocation.lng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(shopLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  };

  if (loading && shops.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Barber</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Book appointments, check real-time wait times, and get the best haircuts in town
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by shop name, location, or service..."
                  className="w-full pl-12 pr-32 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <button
                onClick={handleNearbyShops}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <FaMapMarkerAlt className="h-4 w-4" />
                Nearby Shops
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <FaFilter className="h-4 w-4" />
                Filters
              </button>
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <FaMap className="h-4 w-4" />
                {viewMode === 'grid' ? 'Map View' : 'Grid View'}
              </button>
              
              {user?.role === 'barber' && (
                <Link
                  to="/shops/create"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-full transition"
                >
                  <FaCut className="h-4 w-4" />
                  Create Shop
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Shops Section */}
      {featuredShops.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Shops</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {featuredShops.map((shop) => (
              <div key={shop._id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-yellow-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{shop.name}</h3>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      Featured
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-3">
                    <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                    <span className="text-sm truncate">
                      {shop.address?.city}, {shop.address?.state}
                    </span>
                  </div>
                  <Link
                    to={`/shops/${shop._id}`}
                    className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Enter city..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filters.city}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Wait Time (min)</label>
                <input
                  type="number"
                  name="minWaitTime"
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filters.minWaitTime}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Wait Time (min)</label>
                <input
                  type="number"
                  name="maxWaitTime"
                  placeholder="60"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filters.maxWaitTime}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                <select
                  name="minRating"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filters.minRating}
                  onChange={handleFilterChange}
                >
                  <option value="">Any rating</option>
                  <option value="4">4+ stars</option>
                  <option value="3">3+ stars</option>
                  <option value="2">2+ stars</option>
                  <option value="1">1+ star</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
                <select
                  name="featured"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filters.featured}
                  onChange={handleFilterChange}
                >
                  <option value="">All shops</option>
                  <option value="true">Featured only</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  name="sort"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filters.sort}
                  onChange={handleFilterChange}
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rating</option>
                  <option value="waitTime">Lowest Wait Time</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
              
              <div className="md:col-span-4 flex gap-4">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {shops.length} {shops.length === 1 ? 'Shop' : 'Shops'} Found
            </h2>
            <p className="text-gray-600 mt-1">
              {pagination.total ? `Showing ${shops.length} of ${pagination.total} shops` : ''}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={pagination.limit}
              onChange={(e) => {
                setPagination(prev => ({ ...prev, limit: parseInt(e.target.value) }));
                fetchShops(1);
              }}
            >
              <option value="9">9 per page</option>
              <option value="18">18 per page</option>
              <option value="27">27 per page</option>
            </select>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="h-96 rounded-lg overflow-hidden bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-center">
                <FaMap className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Map View</h3>
                <p className="text-gray-600 mb-4">
                  {userLocation 
                    ? 'Map shows shops near your location' 
                    : 'Enable location services to see shops on map'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {shops.slice(0, 3).map(shop => (
                    <div key={shop._id} className="bg-white p-4 rounded-lg shadow">
                      <h4 className="font-bold text-gray-900 truncate">{shop.name}</h4>
                      <p className="text-sm text-gray-600 truncate">{shop.address?.city}</p>
                      {userLocation && (
                        <p className="text-xs text-gray-500">
                          {calculateDistance(shop)} away
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shops Grid */}
        {viewMode === 'grid' && (
          <>
            {shops.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow">
                <FaCut className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No shops found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search filters</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shops.map((shop) => (
                    <div key={shop._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                      {/* Shop Image/Status */}
                      <div className="relative h-48 bg-gradient-to-r from-blue-400 to-purple-500">
                        <div className="absolute top-4 right-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {shop.isActive ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                        
                        {/* Owner Badge */}
                        {user?._id === shop.owner?._id && (
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                              Your Shop
                            </span>
                          </div>
                        )}
                        
                        {/* Distance Badge */}
                        {userLocation && calculateDistance(shop) && (
                          <div className="absolute bottom-4 left-4">
                            <span className="px-3 py-1 bg-black/70 text-white rounded-full text-sm font-medium">
                              {calculateDistance(shop)} away
                            </span>
                          </div>
                        )}
                        
                        {/* Featured Badge */}
                        {shop.featured && (
                          <div className="absolute bottom-4 right-4">
                            <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">
                              Featured
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Shop Details */}
                      <div className="p-6">
                        {/* Shop Header */}
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{shop.name}</h3>
                          <div className="flex items-center text-gray-600 mb-3">
                            <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                            <span className="text-sm line-clamp-1">
                              {shop.address?.street ? `${shop.address.street}, ` : ''}
                              {shop.address?.city}, {shop.address?.state}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <FaClock className="h-4 w-4 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600">Wait Time</p>
                            <p className="font-bold text-gray-900">{shop.averageWaitTime || 15}m</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <FaCut className="h-4 w-4 text-purple-600" />
                            </div>
                            <p className="text-sm text-gray-600">Services</p>
                            <p className="font-bold text-gray-900">{shop.services?.length || 0}</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <FaRegStar className="h-4 w-4 text-yellow-500" />
                            </div>
                            <p className="text-sm text-gray-600">Rating</p>
                            <p className="font-bold text-gray-900">{shop.rating?.toFixed(1) || '4.5'}</p>
                          </div>
                        </div>

                        {/* Services Preview */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Popular Services</h4>
                          <div className="space-y-2">
                            {shop.services?.slice(0, 2).map((service, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 truncate">{service.name}</span>
                                <span className="font-semibold text-gray-900">${service.price}</span>
                              </div>
                            ))}
                            {shop.services?.length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{shop.services.length - 2} more services
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Contact & Action */}
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-600">
                            <FaPhone className="h-4 w-4 mr-2" />
                            <span className="text-sm truncate">{shop.phone}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Link
                              to={`/shops/${shop._id}`}
                              className="flex-1 text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
                            >
                              View Details
                            </Link>
                            
                            {userLocation && shop.location?.coordinates && (
                              <button
                                onClick={() => getDirections(shop)}
                                className="px-3 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                                title="Get Directions"
                              >
                                <FaDirections className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </button>
                      
                      {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 border rounded-lg ${
                              pagination.page === pageNum 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        Next
                        <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShopList;