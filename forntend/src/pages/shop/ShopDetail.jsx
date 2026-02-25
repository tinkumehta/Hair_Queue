// pages/shops/ShopDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { shopService } from './shop.service';
import { queueService } from '../../services/queue.service';
import { useAuth } from '../../context/AuthContext';
import { 
  FaMapMarkerAlt, FaPhone, FaClock, FaCut, FaUsers, FaStar, 
  FaArrowLeft, FaUserCheck, FaDirections, FaMap, FaEdit, FaTrash,
  FaRegClock, FaRegStar, FaImage
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const ShopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [shop, setShop] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shopImages, setShopImages] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchShopDetails();
    fetchShopQueue();
    // fetchShopImages();
    // fetchShopReviews();
  }, [id]);

  const fetchShopDetails = async () => {
    try {
      setLoading(true);
      const response = await shopService.getShopById(id);
      if (response.success) {
        setShop(response.data);
      } else {
        throw new Error('Shop not found');
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      toast.error('Failed to load shop details');
      navigate('/shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchShopQueue = async () => {
    try {
      const response = await queueService.getShopQueue(id);
      if (response.success) {
        setQueue(response.data?.queue || [])
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  // const fetchShopImages = async () => {
  //   try {
  //     const response = await shopService.getShopImages(id);
  //     if (response.success) {
  //       setShopImages(response.data.images || []);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching images:', error);
  //   }
  // };

  // const fetchShopReviews = async () => {
  //   try {
  //     const response = await shopService.getShopReviews(id);
  //     if (response.success) {
  //       setReviews(response.data.reviews || []);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching reviews:', error);
  //   }
  // };

  const handleJoinQueue = async () => {
    if (!selectedService) {
      toast.error('Please select a service');
      return;
    }

    if (!user) {
      toast.error('Please login to join queue');
      navigate('/login');
      return;
    }

    try {
      setJoining(true);
     const response = await queueService.joinQueue(id, selectedService);
     if (response.success) {
      toast.success('Successfully joined the queue ');
      setShowServiceModal(false);
      fetchShopQueue();   // Refresh queue
     }
    } catch (error) {
      console.error('Error joining queue:', error);
      toast.error(error.response?.data?.message || 'Failed to join queue');
    } finally {
      setJoining(false);
    }
  };


  const handleNextCustomer = async () => {
    if (!window.confirm('Move to next customer?')) return;

    try {
     const res = await queueService.nextCustomer(id);
     if (res.success) {
      toast.success('Next customer called');
      fetchShopQueue(); 
     }
    } catch (error) {
      console.error('Error calling next customer:', error);
      toast.error('Failed to call next customer');
    }
  };

  const toggleShopStatus = async () => {
    const newStatus = !shop.isActive;
    const confirmMessage = newStatus 
      ? 'Are you sure you want to open the shop?'
      : 'Are you sure you want to close the shop?';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await shopService.toggleShopStatus(id);
      if (response.success) {
        setShop(prev => ({ 
          ...prev, 
          isActive: response.data?.isActive ?? newStatus 
        }));
        toast.success(`Shop ${newStatus ? 'opened' : 'closed'} successfully!`);
      }
    } catch (error) {
      console.error('Toggle shop status failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update shop status');
    }
  };

  const handleDeleteShop = async () => {
    try {
      const response = await shopService.deleteShop(id);
      if (response.success) {
        toast.success('Shop deleted successfully!');
        navigate('/shops');
      }
    } catch (error) {
      console.error('Delete shop error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete shop');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const getDirections = () => {
    if (shop?.location?.coordinates) {
      const [lng, lat] = shop.location.coordinates;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      toast.error('Location not available for this shop');
    }
  };

  const getCurrentDayHours = () => {
    if (!shop?.operatingHours) return 'Not specified';
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayHours = shop.operatingHours[today];
    
    if (!todayHours || !todayHours.open || !todayHours.close) {
      return 'Closed today';
    }
    
    return `${todayHours.open} - ${todayHours.close}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop not found</h2>
          <Link to="/shops" className="text-blue-600 hover:text-blue-800">
            ← Back to shops
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?._id === shop.owner?._id;
  
  const currentPosition = queue.find(q => q.customer?._id === user?._id && q.status !== 'completed')?.position;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/shops"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="h-4 w-4 mr-2" />
            Back to shops
          </Link>
        </div>
      </div>

      {/* Shop Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold">{shop.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {shop.isActive ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="h-5 w-5 mr-2" />
                  <span>
                    {shop.address?.street ? `${shop.address.street}, ` : ''}
                    {shop.address?.city}, {shop.address?.state}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <FaPhone className="h-5 w-5 mr-2" />
                  <span>{shop.phone}</span>
                </div>
                
                <div className="flex items-center">
                  <FaClock className="h-5 w-5 mr-2" />
                  <span>{shop.averageWaitTime || 15} min wait</span>
                </div>

                {shop.email && (
                  <div className="flex items-center">
                    <FaUserCheck className="h-5 w-5 mr-2" />
                    <span>{shop.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {isOwner ? (
                <>
                  <button
                    onClick={toggleShopStatus}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      shop.isActive 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {shop.isActive ? 'Close Shop' : 'Open Shop'}
                  </button>
                  
                  <Link
                    to={`/shops/edit/${shop._id}`}
                    className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 text-center flex items-center justify-center gap-2"
                  >
                    <FaEdit className="h-4 w-4" />
                    Edit Shop
                  </Link>
                </>
              ) : (
                <>
                  {currentPosition ? (
                    <div className="bg-white text-blue-600 px-6 py-3 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm">Your position</p>
                        <p className="text-2xl font-bold">{currentPosition}</p>
                        <p className="text-xs">in queue</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowServiceModal(true)}
                      disabled={!shop.isActive}
                      className={`px-6 py-3 rounded-lg font-medium ${
                        shop.isActive 
                          ? 'bg-white text-blue-600 hover:bg-gray-100' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {shop.isActive ? 'Join Queue' : 'Shop Closed'}
                    </button>
                  )}
                  
                  <button
                    onClick={getDirections}
                    className="px-6 py-3 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 flex items-center justify-center gap-2"
                  >
                    <FaDirections className="h-4 w-4" />
                    Directions
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shop Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shop Images */}
            {shopImages.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {shopImages.map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Shop ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <FaPhone className="h-5 w-5 mr-3 text-blue-600" />
                      <span>{shop.phone}</span>
                    </div>
                    {shop.email && (
                      <div className="flex items-center text-gray-600">
                        <FaUserCheck className="h-5 w-5 mr-3 text-blue-600" />
                        <span>{shop.email}</span>
                      </div>
                    )}
                    <div className="flex items-start text-gray-600">
                      <FaMapMarkerAlt className="h-5 w-5 mr-3 text-blue-600 mt-1" />
                      <div>
                        <p>{shop.address?.street}</p>
                        <p>{shop.address?.city}, {shop.address?.state} {shop.address?.country}</p>
                        {shop.address?.zipCode && <p>{shop.address.zipCode}</p>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Operating Hours</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <FaRegClock className="h-5 w-5 mr-3 text-blue-600" />
                      <span className="font-medium">Today: {getCurrentDayHours()}</span>
                    </div>
                    {Object.entries(shop.operatingHours || {}).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="capitalize">{day}:</span>
                        <span>
                          {hours.open && hours.close ? `${hours.open} - ${hours.close}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {shop.description && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{shop.description}</p>
                </div>
              )}
            </div>

            {/* Services Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Services & Pricing</h2>
                <div className="flex items-center text-gray-600">
                  <FaCut className="h-5 w-5 mr-2" />
                  <span>{shop.services?.length || 0} services</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {shop.services?.map((service, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 hover:border-blue-300 transition cursor-pointer ${
                      selectedService?.name === service.name ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Duration: {service.duration || 30} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">${service.price}</p>
                        {selectedService?.name === service.name && (
                          <p className="text-sm text-blue-600 mt-1">Selected</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {shop.services?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No services available
                  </div>
                )}
              </div>
              
              {!isOwner && shop.isActive && (
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700"
                >
                  Join Queue with Selected Service
                </button>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                <div className="flex items-center">
                  <FaRegStar className="h-5 w-5 mr-1 text-yellow-500" />
                  <span className="font-bold text-gray-900">{shop.rating?.toFixed(1) || '4.5'}</span>
                  <span className="text-gray-600 ml-1">({shop.totalRatings || 0} reviews)</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {review.user?.avatar ? (
                          <img 
                            src={review.user.avatar} 
                            alt={review.user.fullName}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <FaUserCheck className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{review.user?.fullName}</p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              className={`h-3 w-3 ${
                                i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
                
                {reviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No reviews yet. Be the first to review!
                  </div>
                )}
              </div>
              
              {reviews.length > 3 && (
                <button className="w-full mt-4 text-blue-600 hover:text-blue-800 font-medium">
                  View all {reviews.length} reviews →
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Queue & Stats */}
          <div className="space-y-8">
            {/* Queue Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Live Queue</h2>
                <div className="flex items-center text-gray-600">
                  <FaUsers className="h-5 w-5 mr-2" />
                  <span>{queue.filter(q => q.status === 'waiting').length} waiting</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {queue.slice(0, 5).map((item, index) => (
                  <div 
                    key={item._id || index} 
                    className={`p-4 rounded-lg ${
                      item.status === 'in_progress' ? 'bg-blue-50 border border-blue-200' :
                      item.customer?._id === user?._id ? 'bg-green-50 border border-green-200' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.customer?._id === user?._id ? 'You' : `Customer ${index + 1}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.service?.name} - ${item.service?.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">#{item.position || index + 1}</p>
                        <p className={`text-sm ${
                          item.status === 'in_progress' ? 'text-blue-600' :
                          item.status === 'completed' ? 'text-green-600' :
                          'text-gray-500'
                        }`}>
                          {item.status === 'in_progress' ? 'In Progress' :
                           item.status === 'completed' ? 'Completed' :
                           'Waiting'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {queue.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No customers in queue
                  </div>
                )}
                
                {queue.length > 5 && (
                  <div className="text-center pt-4">
                    <button className="text-blue-600 hover:text-blue-800">
                      View all {queue.length} customers →
                    </button>
                  </div>
                )}
              </div>
              
              {isOwner && queue.length > 0 && (
                <button
                  onClick={handleNextCustomer}
                  className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Call Next Customer
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop Stats</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <FaClock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Wait</p>
                      <p className="font-bold text-gray-900">{shop.averageWaitTime || 15} min</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <FaCut className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Services</p>
                      <p className="font-bold text-gray-900">{shop.services?.length || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                      <FaStar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < Math.floor(shop.rating || 4.5) ? 'text-yellow-400' : 'text-gray-300'
                            }`} 
                          />
                        ))}
                        <span className="ml-2 font-bold text-gray-900">{shop.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop Management</h2>
                
                <div className="space-y-3">
                  <Link
                    to={`/shops/edit/${shop._id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    <FaEdit className="h-4 w-4" />
                    Edit Shop Details
                  </Link>
                  
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
                  >
                    <FaTrash className="h-4 w-4" />
                    Delete Shop
                  </button>
                </div>
              </div>
            )}

            {/* Map Preview */}
            {shop.location?.coordinates && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
                <div className="h-48 rounded-lg overflow-hidden bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-center">
                    <FaMap className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">Shop Location</p>
                    <p className="text-sm text-gray-600">
                      Coordinates: {shop.location.coordinates[1]}, {shop.location.coordinates[0]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={getDirections}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  <FaDirections className="h-4 w-4" />
                  Get Directions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Join Queue</h3>
              <p className="text-gray-600 mb-6">Select a service to join the queue</p>
              
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {shop.services?.map((service, index) => (
                  <div 
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedService?.name === service.name 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600">
                          {service.duration || 30} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${service.price}</p>
                        {selectedService?.name === service.name && (
                          <p className="text-sm text-blue-600">Selected</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinQueue}
                  disabled={!selectedService || joining}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? 'Joining...' : 'Join Queue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Shop</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{shop.name}"? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteShop}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDetail;