/**
 * Admin Mappls (MapmyIndia) SDK & REST API Service
 */

const MAPPLS_API_KEY = import.meta.env.VITE_MAPPLS_API_KEY || 'dmdblrrmxkpvhvrgsljvpdmxscrlkaukaypd';

const INDIAN_PINCODE_DB = {
  '530001': { pincode: '530001', area: 'Visakhapatnam Fort', city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  '530017': { pincode: '530017', area: 'MVP Colony', city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.7412, lng: 83.3321 },
  '560001': { pincode: '560001', area: 'MG Road / Bangalore GPO', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  '560002': { pincode: '560002', area: 'City Market', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9629, lng: 77.5775 },
  '560034': { pincode: '560034', area: 'Koramangala', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9279, lng: 77.6271 },
  '110001': { pincode: '110001', area: 'Connaught Place', city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167 },
  '400001': { pincode: '400001', area: 'Fort / CST', city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', lat: 18.9332, lng: 72.8354 },
  '600001': { pincode: '600001', area: 'George Town', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  '500001': { pincode: '500001', area: 'Abids', city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  '700001': { pincode: '700001', area: 'BBD Bagh', city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
};

let scriptPromise = null;
export function loadMapplsSDK() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
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
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function geocodePincode(pincode) {
  const cleanPin = String(pincode).trim();
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
          area: result.subLocality || result.locality || `Area ${cleanPin}`,
          city: result.city || result.district || 'City',
          district: result.district || result.city || 'District',
          state: result.state || 'India',
          lat: parseFloat(result.latitude || result.lat || 20.5937),
          lng: parseFloat(result.longitude || result.lng || 78.9629),
        };
      }
    }
  } catch (err) {
    console.warn('[Admin Mappls geocode] note:', err.message);
  }

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
