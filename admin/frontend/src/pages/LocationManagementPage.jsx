import React, { useState, useEffect } from 'react';
import {
  MapPin, Search, Globe, Building2, CheckCircle2, XCircle,
  Loader2, Filter, Eye, ShieldCheck, Map
} from 'lucide-react';
import MapplsMap from '../components/MapplsMap';

const API_BASE = '/api';

export default function LocationManagementPage() {
  const [pincodes, setPincodes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('pincodes'); // 'pincodes' | 'addresses' | 'map'
  const [selectedCustomerLoc, setSelectedCustomerLoc] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await fetch(`${API_BASE}/pincodes/all`);
      const pData = await pRes.json();
      if (pData.success) {
        setPincodes(pData.data || []);
      }

      // Fetch customer list / mock location data
      const uRes = await fetch(`${API_BASE}/users`);
      const uData = await uRes.json();
      if (uData.success) {
        setCustomers(uData.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePincode = async (code, currentEnabled) => {
    try {
      const res = await fetch(`${API_BASE}/pincodes/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setPincodes((prev) =>
          prev.map((p) => (p.code === code ? { ...p, enabled: !currentEnabled } : p))
        );
      }
    } catch (err) {
      console.error('Toggle pincode error:', err);
    }
  };

  const filteredPincodes = pincodes.filter(
    (p) =>
      p.code.includes(searchTerm) ||
      (p.areaName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.state || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group pincodes by State & District
  const statesSet = new Set(pincodes.map((p) => p.state || 'Andhra Pradesh'));
  const citiesSet = new Set(pincodes.map((p) => p.city || 'Visakhapatnam'));

  const mapMarkers = (selectedCustomerLoc ? [selectedCustomerLoc] : pincodes).map((item) => ({
    lat: Number(item.latitude || item.lat || 17.6868),
    lng: Number(item.longitude || item.lng || 83.2185),
    title: `${item.code || item.name}: ${item.areaName || item.city || 'India'}`,
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900">Location Management (India)</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Serviceable States, Districts, Cities & Pincodes powered by Mappls (MapmyIndia)
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1 text-xs font-bold">
          <button
            onClick={() => { setSelectedTab('pincodes'); setSelectedCustomerLoc(null); }}
            className={`px-4 py-2 rounded-lg transition ${selectedTab === 'pincodes' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Serviceable Pincodes ({pincodes.length})
          </button>
          <button
            onClick={() => setSelectedTab('addresses')}
            className={`px-4 py-2 rounded-lg transition ${selectedTab === 'addresses' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Customer Addresses
          </button>
          <button
            onClick={() => setSelectedTab('map')}
            className={`px-4 py-2 rounded-lg transition ${selectedTab === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Mappls Map View
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">States Covered</p>
            <p className="text-base font-black text-gray-900">{statesSet.size}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <Globe size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Cities Covered</p>
            <p className="text-base font-black text-gray-900">{citiesSet.size}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Active Pincodes</p>
            <p className="text-base font-black text-gray-900">
              {pincodes.filter((p) => p.enabled !== false).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Geocoding Engine</p>
            <p className="text-xs font-black text-gray-900">Mappls REST API</p>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      {selectedTab === 'pincodes' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-sm font-black text-gray-900">Serviceable Locations & Pincodes</h2>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search state, city, pincode..."
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              <Loader2 size={24} className="spin text-primary" />
              <span>Loading location data…</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-100">
                    <th className="p-3">Pincode</th>
                    <th className="p-3">Area / Sector</th>
                    <th className="p-3">City</th>
                    <th className="p-3">District</th>
                    <th className="p-3">State</th>
                    <th className="p-3">Coordinates (Lat, Lng)</th>
                    <th className="p-3">Delivery Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPincodes.map((pin) => (
                    <tr key={pin.id || pin.code} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-black text-gray-900">{pin.code}</td>
                      <td className="p-3 font-semibold text-gray-800">{pin.areaName || '—'}</td>
                      <td className="p-3 font-semibold text-gray-800">{pin.city || '—'}</td>
                      <td className="p-3 font-semibold text-gray-600">{pin.district || pin.city || '—'}</td>
                      <td className="p-3 font-semibold text-gray-600">{pin.state || 'Andhra Pradesh'}</td>
                      <td className="p-3 font-mono text-[10px] text-gray-500">
                        {pin.latitude ? Number(pin.latitude).toFixed(4) : '17.6868'},{' '}
                        {pin.longitude ? Number(pin.longitude).toFixed(4) : '83.2185'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            pin.enabled !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {pin.enabled !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {pin.enabled !== false ? 'Serviceable' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleTogglePincode(pin.code, pin.enabled !== false)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                            pin.enabled !== false
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {pin.enabled !== false ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'addresses' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-black text-gray-900">Customer Delivery Locations (India)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-100">
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Email / Mobile</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">City & State</th>
                  <th className="p-3">Pincode</th>
                  <th className="p-3">Coordinates (Mappls)</th>
                  <th className="p-3 text-right">Map View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(customers.length > 0 ? customers : [
                  {
                    name: 'Rajesh Kumar',
                    email: 'rajesh@example.com',
                    phone: '9876543210',
                    addressText: 'Plot 42, MVP Colony, Visakhapatnam, Andhra Pradesh',
                    city: 'Visakhapatnam',
                    state: 'Andhra Pradesh',
                    pincode: '530017',
                    latitude: 17.7412,
                    longitude: 83.3321,
                  },
                  {
                    name: 'Anita Sharma',
                    email: 'anita@example.com',
                    phone: '9812345678',
                    addressText: '12th Cross, Koramangala, Bengaluru, Karnataka',
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    pincode: '560034',
                    latitude: 12.9279,
                    longitude: 77.6271,
                  }
                ]).map((cust, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition">
                    <td className="p-3 font-bold text-gray-900">{cust.name || cust.full_name || 'Customer'}</td>
                    <td className="p-3 text-gray-600">
                      <div>{cust.email}</div>
                      <div className="text-[10px] text-gray-400">{cust.phone || cust.mobile_number}</div>
                    </td>
                    <td className="p-3 font-medium text-gray-800 max-w-xs truncate">
                      {cust.addressText || cust.default_address || 'MVP Colony, Visakhapatnam'}
                    </td>
                    <td className="p-3 text-gray-700">
                      {cust.city || 'Visakhapatnam'}, {cust.state || 'Andhra Pradesh'}
                    </td>
                    <td className="p-3 font-black text-gray-900">{cust.pincode || '530001'}</td>
                    <td className="p-3 font-mono text-[10px] text-gray-500">
                      {cust.latitude ? Number(cust.latitude).toFixed(4) : '17.6868'},{' '}
                      {cust.longitude ? Number(cust.longitude).toFixed(4) : '83.2185'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedCustomerLoc({
                            lat: Number(cust.latitude || 17.6868),
                            lng: Number(cust.longitude || 83.2185),
                            title: `${cust.name}: ${cust.pincode}`,
                          });
                          setSelectedTab('map');
                        }}
                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition flex items-center gap-1 ml-auto"
                      >
                        <Eye size={12} /> View on Map
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'map' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900">Interactive Mappls Location Map</h2>
            <span className="text-xs font-semibold text-primary">Restricted to India</span>
          </div>
          <MapplsMap
            center={[
              selectedCustomerLoc ? selectedCustomerLoc.lat : 17.6868,
              selectedCustomerLoc ? selectedCustomerLoc.lng : 83.2185,
            ]}
            zoom={selectedCustomerLoc ? 14 : 11}
            markers={mapMarkers}
            height="450px"
          />
        </div>
      )}
    </div>
  );
}
