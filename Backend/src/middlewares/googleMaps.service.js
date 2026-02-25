import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 });

class GoogleMapsService {
    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.baseURL = 'https://maps.googleapis.com/maps/api';
    }

    async geocodeAddress(address) {
        const cacheKey = `geocode:${address}`;
        const cached = cache.get(cacheKey);
        
        if (cached) return cached;

        try {
            const response = await axios.get(`${this.baseURL}/geocode/json`, {
                params: {
                    address: address,
                    key: this.apiKey
                }
            });

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                const result = {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: response.data.results[0].formatted_address,
                    addressComponents: response.data.results[0].address_components
                };
                
                cache.set(cacheKey, result);
                return result;
            } else {
                throw new Error(`Geocoding failed: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Geocoding error:', error.message);
            throw error;
        }
    }

    // Add other Google Maps methods as needed
    async calculateDistance(origin, destination) {
        try {
            const response = await axios.get(`${this.baseURL}/distancematrix/json`, {
                params: {
                    origins: `${origin.lat},${origin.lng}`,
                    destinations: `${destination.lat},${destination.lng}`,
                    key: this.apiKey,
                    units: 'imperial'
                }
            });

            if (response.data.status === 'OK') {
                const element = response.data.rows[0].elements[0];
                return {
                    distance: element.distance,
                    duration: element.duration,
                    status: element.status
                };
            } else {
                throw new Error(`Distance calculation failed: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Distance calculation error:', error.message);
            // Fallback to Haversine formula
            return this.calculateHaversineDistance(origin, destination);
        }
    }

    calculateHaversineDistance(origin, destination) {
        const toRad = (x) => (x * Math.PI) / 180;
        
        const R = 6371; // Earth's radius in km
        const dLat = toRad(destination.lat - origin.lat);
        const dLon = toRad(destination.lng - origin.lng);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;
        const distanceMiles = distanceKm * 0.621371;
        
        return {
            distance: {
                text: `${distanceMiles.toFixed(1)} mi`,
                value: distanceMiles * 1609.34
            },
            duration: {
                text: `${Math.round(distanceMiles * 2.5)} min`,
                value: Math.round(distanceMiles * 2.5) * 60
            },
            status: 'ESTIMATED'
        };
    }

    async findNearbyPlaces(lat, lng, radius = 1000, type = 'cafe') {
        const cacheKey = `nearby:${lat},${lng},${radius},${type}`;
        const cached = cache.get(cacheKey);
        
        if (cached) return cached;

        try {
            const response = await axios.get(`${this.baseURL}/place/nearbysearch/json`, {
                params: {
                    location: `${lat},${lng}`,
                    radius: radius,
                    type: type,
                    key: this.apiKey
                }
            });

            if (response.data.status === 'OK') {
                cache.set(cacheKey, response.data.results);
                return response.data.results;
            } else {
                throw new Error(`Nearby search failed: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Nearby search error:', error.message);
            return [];
        }
    }
}

export default new GoogleMapsService();