import React, { useEffect, useRef, useState } from 'react';
import { loadMapplsSDK } from '../services/mapplsService';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

export default function MapplsMap({
  center = [17.6868, 83.2185],
  zoom = 12,
  markers = [],
  height = '350px',
}) {
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadMapplsSDK().then((mapplsObj) => {
      if (!isMounted || !mapContainerRef.current) return;

      try {
        if (mapplsObj && window.mappls && window.mappls.Map) {
          const map = new window.mappls.Map(mapContainerRef.current, {
            center: [center[0], center[1]],
            zoom: zoom,
            zoomControl: true,
          });

          markers.forEach((m) => {
            if (m.lat && m.lng && window.mappls.Marker) {
              new window.mappls.Marker({
                map: map,
                position: { lat: m.lat, lng: m.lng },
                title: m.title || 'Location',
              });
            }
          });

          setMapLoaded(true);
        } else {
          setMapLoaded(false);
        }
      } catch (err) {
        console.warn('Admin Mappls Map init note:', err);
        setMapLoaded(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [center[0], center[1], markers.length]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-slate-100" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-bold text-gray-700">
          <Loader2 size={18} className="spin text-primary" />
          <span>Loading Mappls Map…</span>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />

      {!mapLoaded && !loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-slate-50 to-blue-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <MapPin size={24} />
          </div>
          <p className="text-sm font-black text-gray-900">Mappls Interactive Map (India)</p>
          <p className="text-xs text-gray-500 max-w-sm mt-0.5">
            {markers.length > 0
              ? `Displaying ${markers.length} customer delivery locations in India`
              : `Center: ${center[0].toFixed(4)}, ${center[1].toFixed(4)}`}
          </p>
          <span className="mt-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-600 shadow-sm flex items-center gap-1">
            <Navigation size={12} className="text-primary" /> Powered by Mappls (MapmyIndia)
          </span>
        </div>
      )}
    </div>
  );
}
