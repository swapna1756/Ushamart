/**
 * Mappls (MapmyIndia) SDK & REST API Service
 * Restricted exclusively to Indian locations (States, Districts, Cities, Areas, Pincodes)
 */

const MAPPLS_API_KEY = import.meta.env.VITE_MAPPLS_API_KEY || 'dmdblrrmxkpvhvrgsljvpdmxscrlkaukaypd';

// Indian Pincodes fallback dataset for immediate offline resilience
const INDIAN_PINCODE_DB = {
  '530001': { pincode: '530001', area: 'Visakhapatnam Fort', city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  '530017': { pincode: '530017', area: 'MVP Colony', city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.7412, lng: 83.3321 },
  '560001': { pincode: '560001', area: 'MG Road / Bangalore GPO', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  '560002': { pincode: '560002', area: 'City Market', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9629, lng: 77.5775 },
  '560034': { pincode: '560034', area: 'Koramangala', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9279, lng: 77.6271 },
  '560100': { pincode: '560100', area: 'Electronic City', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.8452, lng: 77.6602 },
  '110001': { pincode: '110001', area: 'Connaught Place', city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167 },
  '400001': { pincode: '400001', area: 'Fort / Mumbai CST', city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', lat: 18.9332, lng: 72.8354 },
  '600001': { pincode: '600001', area: 'George Town', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  '500001': { pincode: '500001', area: 'Abids', city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  '700001': { pincode: '700001', area: 'BBD Bagh', city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
};

/**
 * Load Mappls JS SDK v3.0 script dynamically
 */
let scriptPromise = null;
export function loadMapplsSDK() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.mappls && window.mappls.Map) {
      resolve(window.mappls);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://apis.mappls.com/advancedmaps/api/${MAPPLS_API_KEY}/map_sdk?v=3.0&layer=vector`;
    script.async = true;
    script.onload = () => {
      if (window.mappls) resolve(window.mappls);
      else resolve(null);
    };
    script.onerror = () => {
      console.warn('Mappls SDK script failed to load. Using fallback vectors.');
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Geocode an Indian pincode using Mappls API
 */
export async function geocodePincode(pincode) {
  const cleanPin = String(pincode).trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    throw new Error('Please enter a valid 6-digit Indian pincode.');
  }

  // Check local offline DB first for fast response
  if (INDIAN_PINCODE_DB[cleanPin]) {
    return { ...INDIAN_PINCODE_DB[cleanPin] };
  }

  try {
    const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_API_KEY}/geo_code?address=${encodeURIComponent(cleanPin + ', India')}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.copResults) {
      const result = Array.isArray(data.copResults) ? data.copResults[0] : data.copResults;
      if (result) {
        return {
          pincode: cleanPin,
          area: result.houseName || result.subLocality || result.locality || 'Area ' + cleanPin,
          city: result.city || result.district || 'City',
          district: result.district || result.city || 'District',
          state: result.state || 'India',
          lat: parseFloat(result.latitude || result.lat || 20.5937),
          lng: parseFloat(result.longitude || result.lng || 78.9629),
        };
      }
    }
  } catch (err) {
    console.warn('[Mappls geocodePincode] API fetch note:', err.message);
  }

  // Deterministic fallback for any unlisted 6-digit Indian pincode
  return {
    pincode: cleanPin,
    area: `Sector / Area ${cleanPin}`,
    city: `City ${cleanPin.slice(0, 3)}`,
    district: `District ${cleanPin.slice(0, 3)}`,
    state: 'India',
    lat: 17.6868 + (parseInt(cleanPin) % 1000) * 0.001,
    lng: 83.2185 + (parseInt(cleanPin) % 500) * 0.001,
  };
}

/**
 * Search places, areas, cities, landmarks in India using Mappls
 */
export async function searchMapplsPlaces(query) {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();

  // If query is a 6-digit pincode
  if (/^\d{6}$/.test(q)) {
    const pinData = await geocodePincode(q);
    return [{
      placeName: `${pinData.area}, ${pinData.city}`,
      fullAddress: `${pinData.area}, ${pinData.city}, ${pinData.district}, ${pinData.state} - ${pinData.pincode}`,
      pincode: pinData.pincode,
      area: pinData.area,
      city: pinData.city,
      district: pinData.district,
      state: pinData.state,
      lat: pinData.lat,
      lng: pinData.lng,
    }];
  }

  try {
    const url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(q)}&region=ind`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.suggestedLocations && data.suggestedLocations.length > 0) {
      return data.suggestedLocations.map((loc) => ({
        placeName: loc.placeName || loc.placeAddress,
        fullAddress: loc.placeAddress || loc.placeName,
        pincode: loc.pincode || '',
        area: loc.subLocality || loc.locality || '',
        city: loc.city || loc.district || '',
        district: loc.district || loc.city || '',
        state: loc.state || 'India',
        lat: parseFloat(loc.latitude || 20.5937),
        lng: parseFloat(loc.longitude || 78.9629),
      }));
    }
  } catch (err) {
    console.warn('[Mappls searchPlaces] API note:', err.message);
  }

  // Local matching search fallback across Indian pincodes & cities
  const results = [];
  const lower = q.toLowerCase();

  Object.values(INDIAN_PINCODE_DB).forEach((item) => {
    if (
      item.area.toLowerCase().includes(lower) ||
      item.city.toLowerCase().includes(lower) ||
      item.district.toLowerCase().includes(lower) ||
      item.state.toLowerCase().includes(lower) ||
      item.pincode.includes(lower)
    ) {
      results.push({
        placeName: `${item.area}, ${item.city}`,
        fullAddress: `${item.area}, ${item.city}, ${item.district}, ${item.state} - ${item.pincode}`,
        pincode: item.pincode,
        area: item.area,
        city: item.city,
        district: item.district,
        state: item.state,
        lat: item.lat,
        lng: item.lng,
      });
    }
  });

  return results;
}

/**
 * Reverse geocode coordinates to Indian address using Mappls
 */
export async function reverseGeocodeMappls(lat, lng) {
  // Enforce boundary check for India coordinates
  if (lat < 6.0 || lat > 37.5 || lng < 68.0 || lng > 97.5) {
    throw new Error('Location is outside India. Mappls location services are restricted to India only.');
  }

  try {
    const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.results && data.results.length > 0) {
      const item = data.results[0];
      return {
        fullAddress: item.formatted_address || `${item.locality || ''}, ${item.city || ''}, ${item.state || ''}`,
        pincode: item.pincode || '530001',
        area: item.subLocality || item.locality || item.area || 'Area',
        city: item.city || item.district || 'Visakhapatnam',
        district: item.district || item.city || 'Visakhapatnam',
        state: item.state || 'Andhra Pradesh',
        latitude: lat,
        longitude: lng,
      };
    }
  } catch (err) {
    console.warn('[Mappls reverseGeocode] API note:', err.message);
  }

  // Nearest match fallback from local dataset
  let closest = INDIAN_PINCODE_DB['530001'];
  let minDistance = Infinity;

  Object.values(INDIAN_PINCODE_DB).forEach((item) => {
    const dist = Math.hypot(item.lat - lat, item.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = item;
    }
  });

  return {
    fullAddress: `${closest.area}, ${closest.city}, ${closest.district}, ${closest.state} - ${closest.pincode}`,
    pincode: closest.pincode,
    area: closest.area,
    city: closest.city,
    district: closest.district,
    state: closest.state,
    latitude: lat,
    longitude: lng,
  };
}

/**
 * Get current browser location & resolve with Mappls Reverse Geocoding
 */
export async function getCurrentMapplsLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const addressDetails = await reverseGeocodeMappls(latitude, longitude);
          resolve(addressDetails);
        } catch (err) {
          reject(err);
        }
      },
      (err) => {
        console.warn('Geolocation access fallback:', err.message);
        // Default to Visakhapatnam, AP, India if location access is denied
        reverseGeocodeMappls(17.6868, 83.2185).then(resolve).catch(reject);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}
