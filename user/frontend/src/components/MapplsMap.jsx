import React, { useEffect, useRef, useState } from 'react';
import { loadMapplsSDK, reverseGeocodeMappls } from '../services/mapplsService';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

export default function MapplsMap({
  center = [17.6868, 83.2185],
  zoom = 13,
  markers = [],
  onLocationSelect = null,
  height = '320px',
  readOnly = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentCoord, setCurrentCoord] = useState({ lat: center[0], lng: center[1] });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadMapplsSDK().then((mapplsObj) => {
      if (!isMounted || !mapContainerRef.current) return;

      try {
        if (mapplsObj && window.mappls && window.mappls.Map) {
          // Initialize Mappls Vector Map
          const map = new window.mappls.Map(mapContainerRef.current, {
            center: [center[0], center[1]],
            zoom: zoom,
            zoomControl: true,
            hybrid: false,
          });

          mapInstanceRef.current = map;
          setMapLoaded(true);

          if (!readOnly && onLocationSelect) {
            map.addListener('click', async (e) => {
              const lat = e.lngLat ? e.lngLat.lat : e.lat;
              const lng = e.lngLat ? e.lngLat.lng : e.lng;
              if (lat && lng) {
                setCurrentCoord({ lat, lng });
                updateMarker(map, lat, lng);
                try {
                  const geoData = await reverseGeocodeMappls(lat, lng);
                  onLocationSelect(geoData);
                } catch (err) {
                  console.warn('Click reverse geocode err:', err);
                }
              }
            });
          }
        } else {
          setMapLoaded(false);
        }
      } catch (err) {
        console.warn('Mappls Map init fallback:', err);
        setMapLoaded(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [center[0], center[1]]);

  const updateMarker = (map, lat, lng) => {
    if (!window.mappls || !map) return;

    if (markerInstanceRef.current) {
      if (markerInstanceRef.current.remove) markerInstanceRef.current.remove();
      else if (markerInstanceRef.current.setMap) markerInstanceRef.current.setMap(null);
    }

    try {
      if (window.mappls.Marker) {
        const marker = new window.mappls.Marker({
          map: map,
          position: { lat, lng },
          draggable: !readOnly,
        });

        if (!readOnly && onLocationSelect && marker.addListener) {
          marker.addListener('dragend', async (e) => {
            const dragLat = e.target.getLatLng ? e.target.getLatLng().lat : lat;
            const dragLng = e.target.getLatLng ? e.target.getLatLng().lng : lng;
            setCurrentCoord({ lat: dragLat, lng: dragLng });
            try {
              const geoData = await reverseGeocodeMappls(dragLat, dragLng);
              onLocationSelect(geoData);
            } catch (err) {
              console.warn('Drag end reverse geocode err:', err);
            }
          });
        }
        markerInstanceRef.current = marker;
      }
    } catch (e) {
      console.warn('Marker create note:', e);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-slate-100" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-bold text-gray-700">
          <Loader2 size={18} className="spin text-primary" />
          <span>Loading Mappls Interactive Map…</span>
        </div>
      )}

      {/* Map Target Div */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Responsive Visual Fallback Banner if Web SDK tiles load in offline mode */}
      {!mapLoaded && !loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <MapPin size={24} />
          </div>
          <p className="text-sm font-black text-gray-900">Mappls Location Map</p>
          <p className="text-xs text-gray-500 max-w-xs mt-0.5">
            Coordinates: {currentCoord.lat.toFixed(4)}, {currentCoord.lng.toFixed(4)} (India)
          </p>
          <span className="mt-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-600 shadow-sm flex items-center gap-1">
            <Navigation size={12} className="text-primary" /> Powered by Mappls (MapmyIndia)
          </span>
        </div>
      )}
    </div>
  );
}
