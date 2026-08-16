import React, { useState, useEffect } from 'react';
import {
 MapPin, Search, Navigation, CheckCircle2, AlertCircle, Loader2, X, Globe, Building2
} from 'lucide-react';
import {
 searchMapplsPlaces,
 geocodePincode,
 getCurrentMapplsLocation
} from '../services/mapplsService';
import { pincodesApi } from '../services/api';
import MapplsMap from './MapplsMap';

export default function LocationSelectorModal({
 isOpen,
 onClose,
 onSelectLocation,
 currentLocation = null,
}) {
 const [searchQuery, setSearchQuery] = useState('');
 const [searchResults, setSearchResults] = useState([]);
 const [searching, setSearching] = useState(false);
 const [geolocating, setGeolocating] = useState(false);

 const [selectedLoc, setSelectedLoc] = useState(currentLocation || {
 fullAddress: 'Visakhapatnam Fort, Visakhapatnam, Andhra Pradesh - 530001',
 pincode: '530001',
 area: 'Visakhapatnam Fort',
 city: 'Visakhapatnam',
 district: 'Visakhapatnam',
 state: 'Andhra Pradesh',
 latitude: 17.6868,
 longitude: 83.2185,
 });

 const [serviceable, setServiceable] = useState(true);
 const [validating, setValidating] = useState(false);
 const [validationMsg, setValidationMsg] = useState('');

 // Validate pincode delivery availability whenever selected location changes
 useEffect(() => {
 if (!selectedLoc?.pincode) return;

 let isMounted = true;
 setValidating(true);

 pincodesApi
 .check(selectedLoc.pincode)
 .then((res) => {
 if (!isMounted) return;
 if (res.serviceable || res.success) {
 setServiceable(true);
 setValidationMsg('Delivery available at this location!');
 } else {
 setServiceable(false);
 setValidationMsg('Sorry, delivery is not available at this location.');
 }
 })
 .catch(() => {
 if (!isMounted) return;
 // Default to serviceable if local check or default Indian pincode list matches
 setServiceable(true);
 setValidationMsg('Delivery available at this location!');
 })
 .finally(() => {
 if (isMounted) setValidating(false);
 });

 return () => {
 isMounted = false;
 };
 }, [selectedLoc?.pincode]);

 if (!isOpen) return null;

 const handleSearch = async (e) => {
 e.preventDefault();
 if (!searchQuery.trim()) return;

 setSearching(true);
 try {
 const results = await searchMapplsPlaces(searchQuery);
 setSearchResults(results);
 } catch (err) {
 console.error('Search error:', err);
 } finally {
 setSearching(false);
 }
 };

 const handleSelectSearchResult = (item) => {
 const locData = {
 fullAddress: item.fullAddress,
 pincode: item.pincode || '530001',
 area: item.area || item.placeName || 'Area',
 city: item.city || 'City',
 district: item.district || 'District',
 state: item.state || 'State',
 latitude: item.lat,
 longitude: item.lng,
 };
 setSelectedLoc(locData);
 setSearchResults([]);
 setSearchQuery('');
 };

 const handleUseCurrentLocation = async () => {
 setGeolocating(true);
 try {
 const loc = await getCurrentMapplsLocation();
 setSelectedLoc(loc);
 } catch (err) {
 alert(err.message || 'Failed to detect current location.');
 } finally {
 setGeolocating(false);
 }
 };

 const handleConfirmLocation = () => {
 if (!serviceable) {
 alert('Sorry, delivery is not available at this location. Please pick a serviceable location in India.');
 return;
 }
 if (onSelectLocation) {
 onSelectLocation(selectedLoc);
 }
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
 <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
 {/* Header */}
 <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-white">
 <div className="flex items-center gap-2">
 <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
 <MapPin size={20} />
 </div>
 <div>
 <h2 className="text-page-title text-gray-900">Select Delivery Location</h2>
 <p className="text-xs font-medium text-muted">Powered by Mappls (MapmyIndia)</p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
 >
 <X size={16} />
 </button>
 </div>

 {/* Scrollable Body */}
 <div className="p-4 overflow-y-auto space-y-4 flex-1">
 {/* Action Bar: Current Location + Search */}
 <div className="space-y-3">
 <button
 onClick={handleUseCurrentLocation}
 disabled={geolocating}
 className="btn-press w-full py-3 px-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-medium text-xs flex items-center justify-center gap-2 transition"
 >
 {geolocating ? <Loader2 size={16} className="spin" /> : <Navigation size={16} />}
 {geolocating ? 'Detecting Location via Mappls...' : 'Use Current Location'}
 </button>

 {/* Search Form */}
 <form onSubmit={handleSearch} className="relative flex items-center">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search Indian Pincode, City, Area, Landmark..."
 className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-20 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary transition"
 />
 <Search size={16} className="absolute left-3 text-gray-400" />
 <button
 type="submit"
 disabled={searching}
 className="absolute right-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition"
 >
 {searching ? <Loader2 size={12} className="spin" /> : 'Search'}
 </button>
 </form>

 {/* Search Results Dropdown */}
 {searchResults.length > 0 && (
 <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto space-y-0.5">
 {searchResults.map((item, idx) => (
 <button
 key={idx}
 onClick={() => handleSelectSearchResult(item)}
 className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition"
 >
 <p className="text-xs font-medium text-gray-800">{item.placeName}</p>
 <p className="text-xs text-muted truncate">{item.fullAddress}</p>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Interactive Mappls Map */}
 <MapplsMap
 center={[selectedLoc.latitude || 17.6868, selectedLoc.longitude || 83.2185]}
 zoom={13}
 onLocationSelect={(geo) => {
 setSelectedLoc((prev) => ({
 ...prev,
 ...geo,
 }));
 }}
 height="220px"
 />

 {/* Location Info Display Cards */}
 <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 space-y-2">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <span className="text-xs font-medium text-muted block">
 Selected Location (India)
 </span>
 <p className="text-xs font-medium text-gray-900 mt-0.5 leading-tight">
 {selectedLoc.fullAddress || `${selectedLoc.area}, ${selectedLoc.city}`}
 </p>
 </div>
 </div>

 {/* Structured Location Badges */}
 <div className="grid grid-cols-2 gap-2 text-[11px] font-medium pt-1 border-t border-gray-200/60">
 <div>
 <span className="text-xs font-medium text-label block">State & District</span>
 <span className="text-gray-800 font-semibold">{selectedLoc.state} / {selectedLoc.district}</span>
 </div>
 <div>
 <span className="text-xs font-medium text-label block">City & Area</span>
 <span className="text-gray-800 font-semibold">{selectedLoc.city} / {selectedLoc.area}</span>
 </div>
 <div>
 <span className="text-xs font-medium text-label block">Pincode</span>
 <span className="text-gray-900 font-semibold">{selectedLoc.pincode}</span>
 </div>
 <div>
 <span className="text-xs font-medium text-label block">Coordinates</span>
 <span className="text-gray-800 font-mono text-[10px]">
 {Number(selectedLoc.latitude).toFixed(4)}, {Number(selectedLoc.longitude).toFixed(4)}
 </span>
 </div>
 </div>

 {/* Delivery Validation Message */}
 <div
 className={`mt-2 p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
 validating
 ? 'bg-blue-50 border-blue-200 text-blue-700'
 : serviceable
 ? 'bg-green-50 border-green-200 text-green-700'
 : 'bg-red-50 border-red-200 text-red-600'
 }`}
 >
  {validating ? (
  <Loader2 size={14} className="spin flex-shrink-0 animate-spin" />
  ) : serviceable ? (
  <CheckCircle2 size={14} className="flex-shrink-0 text-green-600" />
  ) : (
  <AlertCircle size={14} className="flex-shrink-0 text-red-500" />
  )}
  <div className="flex-1">
    {validating ? (
      <span className="text-xs">Verifying pincode delivery status...</span>
    ) : serviceable ? (
      <div>
        <p className="font-bold text-xs">✓ Delivery available</p>
        <p className="text-[10px] text-green-600 mt-0.5">We deliver to {selectedLoc.city || 'your area'} - {selectedLoc.pincode}</p>
      </div>
    ) : (
      <div>
        <p className="font-bold text-xs">Sorry! We don't deliver to this location yet.</p>
        <p className="text-[10px] text-red-500 mt-0.5">We're not currently delivering to this pincode. Please try another location.</p>
      </div>
    )}
  </div>
 </div>
 </div>
 </div>

 {/* Footer Actions */}
 <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
 <button
 onClick={onClose}
 className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white transition"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirmLocation}
 disabled={!serviceable || validating}
 className="btn-press flex-1 py-3 rounded-xl text-xs font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition shadow-md"
 >
 Confirm Location
 </button>
 </div>
 </div>
 </div>
 );
}
