import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Crosshair, Sparkles, MapPin, X, Loader2, Check } from 'lucide-react';

// Fix default Leaflet icon paths in Vite / React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationSearchResult {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

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
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
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
      setShowResultsDropdown(false);
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

  // Handle Jump to Coords helper
  const jumpToCoordinates = (lat: number, lng: number, zoomLevel = 17) => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const latLng = new L.LatLng(lat, lng);
      markerRef.current.setLatLng(latLng);
      circleRef.current.setLatLng(latLng);
      mapInstanceRef.current.setView(latLng, zoomLevel);
    }
    onChange(lat, lng);
  };

  // Multi-Engine Geocoding with Photon Komoot & Nominatim Fallback
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);

    // Check if user entered direct coordinates like "11.0783, 76.9997"
    const coordMatch = query.match(/^([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        jumpToCoordinates(lat, lng, 18);
        setSearching(false);
        setShowResultsDropdown(false);
        return;
      }
    }

    const results: LocationSearchResult[] = [];

    // Engine 1: Photon Komoot API (Fast, no CORS/User-Agent issues, high accuracy for POIs/streets)
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
      );
      if (photonRes.ok) {
        const photonData = await photonRes.json();
        if (photonData?.features && Array.isArray(photonData.features)) {
          for (const feat of photonData.features) {
            const [lng, lat] = feat.geometry.coordinates;
            const props = feat.properties || {};
            const name = props.name || props.street || query;
            const parts = [props.street, props.district, props.city, props.state, props.country]
              .filter(Boolean);
            const desc = parts.join(', ') || 'Matching Location';

            results.push({
              name,
              description: desc,
              latitude: lat,
              longitude: lng,
            });
          }
        }
      }
    } catch (photonErr) {
      console.warn('Photon geocoding failed, trying Nominatim fallback', photonErr);
    }

    // Engine 2: OpenStreetMap Nominatim Fallback if results are empty
    if (results.length === 0) {
      try {
        const nominatimRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=6&addressdetails=1`
        );
        if (nominatimRes.ok) {
          const nominatimData = await nominatimRes.json();
          if (Array.isArray(nominatimData) && nominatimData.length > 0) {
            for (const item of nominatimData) {
              results.push({
                name: item.display_name.split(',')[0] || query,
                description: item.display_name,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
              });
            }
          }
        }
      } catch (nomErr) {
        console.warn('Nominatim geocoding failed', nomErr);
      }
    }

    setSearching(false);

    if (results.length > 0) {
      setSearchResults(results);
      setShowResultsDropdown(true);

      // Auto-jump to the top match
      const topMatch = results[0];
      jumpToCoordinates(topMatch.latitude, topMatch.longitude, 17);
    } else {
      setSearchError(`No matching locations found for "${query}". Try searching with a landmark, area name, or city.`);
    }
  };

  const handleSelectResult = (res: LocationSearchResult) => {
    jumpToCoordinates(res.latitude, res.longitude, 18);
    setShowResultsDropdown(false);
    setSearchQuery(res.name);
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
        jumpToCoordinates(lat, lng, 18);
        setShowResultsDropdown(false);
      },
      (error) => {
        console.error(error);
        alert('Could not access your location. Please check browser permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3 relative">
      {/* Map Search Bar & GPS Trigger */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <form onSubmit={handleSearchAddress} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search address, area, or coordinates (e.g. Peelamedu, Coimbatore or 11.078, 76.999)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResultsDropdown(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              {searching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-[1100] max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                <span>Matching Places ({searchResults.length})</span>
                <button
                  onClick={() => setShowResultsDropdown(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close
                </button>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/70 transition-all flex items-start gap-2.5 group cursor-pointer"
                >
                  <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <Crosshair className="h-3.5 w-3.5 text-indigo-600" />
          <span>My GPS</span>
        </button>
      </div>

      {searchError && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center justify-between">
          <span>{searchError}</span>
          <button onClick={() => setSearchError(null)} className="text-amber-700 hover:text-amber-900">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
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
        💡 Tip: You can search any landmark, street, city, paste GPS coordinates, or drag the purple pin on the map.
      </p>
    </div>
  );
};
