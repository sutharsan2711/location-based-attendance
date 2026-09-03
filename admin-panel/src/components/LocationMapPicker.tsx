import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Crosshair, Sparkles } from 'lucide-react';

// Fix default Leaflet icon paths in Vite / React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationMapPickerProps {
  latitude: number;
  longitude: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
  onRadiusChange?: (radius: number) => void;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  radius,
  onChange,
  onRadiusChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = latitude || 11.078319;
    const initialLng = longitude || 76.999745;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Draggable Marker
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background-color: #4f46e5; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.5); border: 3px solid white; color: white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    // Radius Circle
    const circle = L.circle([initialLat, initialLng], {
      radius: radius || 50,
      color: '#4f46e5',
      fillColor: '#6366f1',
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map);

    // Event on drag
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      circle.setLatLng(position);
      onChange(position.lat, position.lng);
    });

    // Event on click map
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    // Trigger resize after small delay to fix tile rendering in modals
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker and circle position when props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      if (latitude && longitude) {
        const currentPos = markerRef.current.getLatLng();
        if (Math.abs(currentPos.lat - latitude) > 0.00001 || Math.abs(currentPos.lng - longitude) > 0.00001) {
          const newLatLng = new L.LatLng(latitude, longitude);
          markerRef.current.setLatLng(newLatLng);
          circleRef.current.setLatLng(newLatLng);
          mapInstanceRef.current.panTo(newLatLng);
        }
      }
    }
  }, [latitude, longitude]);

  // Update circle radius when radius prop changes
  useEffect(() => {
    if (circleRef.current && radius) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  // Search Address with OpenStreetMap Nominatim
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          const latLng = new L.LatLng(lat, lng);
          markerRef.current.setLatLng(latLng);
          circleRef.current.setLatLng(latLng);
          mapInstanceRef.current.setView(latLng, 17);
        }
        onChange(lat, lng);
      } else {
        setSearchError('Location not found. Please try a different query or street name.');
      }
    } catch (err) {
      console.error('Geocoding error', err);
      setSearchError('Failed to search location. Please click on the map directly.');
    } finally {
      setSearching(false);
    }
  };

  // Use Current GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          const latLng = new L.LatLng(lat, lng);
          markerRef.current.setLatLng(latLng);
          circleRef.current.setLatLng(latLng);
          mapInstanceRef.current.setView(latLng, 18);
        }
        onChange(lat, lng);
      },
      (error) => {
        console.error(error);
        alert('Could not access your location. Please check browser permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      {/* Map Search Bar & GPS Trigger */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchAddress} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search address, landmark, or city (e.g. Peelamedu, Coimbatore)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {searching ? (
              <span>Searching...</span>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" /> Search
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Crosshair className="h-3.5 w-3.5 text-indigo-600 animate-spin-slow" />
          <span>My GPS</span>
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          {searchError}
        </p>
      )}

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <div ref={mapContainerRef} style={{ height: '240px', width: '100%' }} />

        {/* Floating Quick Info Pill */}
        <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-md border border-slate-200/80 text-[10px] font-mono text-slate-700 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {latitude.toFixed(6)}, {longitude.toFixed(6)} • <strong>{radius}m</strong> Radius
          </span>
        </div>
      </div>

      {/* Quick Radius Selector */}
      {onRadiusChange && (
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Allowed Geofence Radius:
          </span>
          <div className="flex items-center gap-1.5">
            {[30, 50, 100, 200, 500].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRadiusChange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  radius === r
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {r}m
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 italic">
        💡 Tip: Click anywhere on the map or drag the purple pin to set the exact office entrance coordinates.
      </p>
    </div>
  );
};
