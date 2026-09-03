import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Crosshair,
  Sparkles,
  MapPin,
  X,
  Loader2,
  ExternalLink,
  Layers,
  Globe,
  Navigation,
} from 'lucide-react';

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

type MapLayerType = 'google_roadmap' | 'google_satellite' | 'google_terrain' | 'osm';

const MAP_LAYERS: Record<MapLayerType, { name: string; url: string; subdomains?: string; maxZoom: number; attribution: string }> = {
  google_roadmap: {
    name: 'Google Maps',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
  google_satellite: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps Satellite',
  },
  google_terrain: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps Terrain',
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  },
};

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  radius,
  onChange,
  onRadiusChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('google_roadmap');
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

    const activeLayerConfig = MAP_LAYERS[currentLayer];
    const tileLayer = L.tileLayer(activeLayerConfig.url, {
      attribution: activeLayerConfig.attribution,
      maxZoom: activeLayerConfig.maxZoom,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Custom Google Pin Marker
    const customIcon = L.divIcon({
      className: 'google-map-pin',
      html: `<div style="background: linear-gradient(135deg, #EA4335, #B31412); width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(234, 67, 53, 0.6); border: 2.5px solid white;">
              <div style="transform: rotate(45deg); width: 12px; height: 12px; background: white; border-radius: 50%;"></div>
             </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    // Geofence Radius Circle
    const circle = L.circle([initialLat, initialLng], {
      radius: radius || 50,
      color: '#EA4335',
      fillColor: '#EA4335',
      fillOpacity: 0.18,
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

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Map Layer (Google Road, Satellite, Terrain, OSM)
  const handleLayerChange = (layerKey: MapLayerType) => {
    setCurrentLayer(layerKey);
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const config = MAP_LAYERS[layerKey];
      const newLayer = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: config.maxZoom,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    }
  };

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

  const jumpToCoordinates = (lat: number, lng: number, zoomLevel = 17) => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const latLng = new L.LatLng(lat, lng);
      markerRef.current.setLatLng(latLng);
      circleRef.current.setLatLng(latLng);
      mapInstanceRef.current.setView(latLng, zoomLevel);
    }
    onChange(lat, lng);
  };

  // Extract Coordinates from Google Maps URLs or Raw Strings
  const parseGoogleMapsLinkOrCoords = (input: string): { lat: number; lng: number } | null => {
    const trimmed = input.trim();

    // 1. Coordinates format: "11.078319, 76.999745" or "11.078319 76.999745"
    const coordMatch = trimmed.match(/^[-+]?([0-8]?\d(\.\d+)?|90(\.0+)?)[,\s]+[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/);
    if (coordMatch) {
      const parts = trimmed.split(/[,\s]+/).map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
    }

    // 2. Google Maps URL @lat,lng format (e.g. https://www.google.com/maps/@11.078319,76.999745,17z)
    const atMatch = trimmed.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // 3. Google Maps URL ?q=lat,lng or &q=lat,lng or ll=lat,lng
    const qMatch = trimmed.match(/[?&](?:q|ll|query)=([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // 4. Google Maps place coordinates parameter: !3d11.078319!4d76.999745
    const dataMatch = trimmed.match(/!3d([-+]?\d{1,2}\.\d+)!4d([-+]?\d{1,3}\.\d+)/);
    if (dataMatch) {
      return { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) };
    }

    return null;
  };

  // Search Address / Google Maps Link
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);

    // Check if user pasted a Google Maps URL or raw coordinates
    const parsedCoords = parseGoogleMapsLinkOrCoords(query);
    if (parsedCoords) {
      jumpToCoordinates(parsedCoords.lat, parsedCoords.lng, 18);
      setSearching(false);
      setShowResultsDropdown(false);
      return;
    }

    const results: LocationSearchResult[] = [];

    // Search Engine 1: Photon Global Places
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
            const parts = [props.street, props.district, props.city, props.state, props.country].filter(Boolean);
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
    } catch (err) {
      console.warn('Primary geocoder failed', err);
    }

    // Search Engine 2: OpenStreetMap Nominatim Fallback
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
        console.warn('Fallback geocoder failed', nomErr);
      }
    }

    setSearching(false);

    if (results.length > 0) {
      setSearchResults(results);
      setShowResultsDropdown(true);
      const topMatch = results[0];
      jumpToCoordinates(topMatch.latitude, topMatch.longitude, 17);
    } else {
      setSearchError(`No locations found for "${query}". You can paste a Google Maps link, coordinates, or search landmark.`);
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

  const googleMapsWebUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="space-y-3 relative">
      {/* Search Bar & Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <form onSubmit={handleSearchAddress} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Google place, area, coordinates, or paste Google Maps link..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-red-500 bg-white text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResultsDropdown(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
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
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[1100] max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                <span>Matching Places ({searchResults.length})</span>
                <button
                  onClick={() => setShowResultsDropdown(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left px-3.5 py-2 hover:bg-red-50/70 transition-all flex items-start gap-2.5 group cursor-pointer"
                >
                  <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
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
          className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <Crosshair className="h-3.5 w-3.5 text-red-600" />
          <span>My GPS</span>
        </button>
      </div>

      {searchError && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center justify-between">
          <span>{searchError}</span>
          <button onClick={() => setSearchError(null)} className="text-amber-700 hover:text-amber-900 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Map Container with Google Layer Controls */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <div ref={mapContainerRef} style={{ height: '240px', width: '100%' }} />

        {/* Map Style Selector Pill */}
        <div className="absolute top-2.5 right-2.5 z-[1000] bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200 flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => handleLayerChange('google_roadmap')}
            className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              currentLayer === 'google_roadmap' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Google Map
          </button>
          <button
            type="button"
            onClick={() => handleLayerChange('google_satellite')}
            className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              currentLayer === 'google_satellite' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => handleLayerChange('google_terrain')}
            className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              currentLayer === 'google_terrain' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Floating Quick Info Pill */}
        <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-md border border-slate-200 text-[10px] font-mono text-slate-700 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>
            {latitude.toFixed(6)}, {longitude.toFixed(6)} • <strong>{radius}m</strong> Radius
          </span>
          <a
            href={googleMapsWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 flex items-center gap-0.5 font-bold font-sans ml-1"
            title="Open in Google Maps"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Quick Radius Selector */}
      {onRadiusChange && (
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-red-600" />
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
                    ? 'bg-red-600 text-white shadow-sm'
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
        💡 Tip: You can drag the red Google pin, switch to Satellite view, search any address, or paste a link directly from Google Maps.
      </p>
    </div>
  );
};
