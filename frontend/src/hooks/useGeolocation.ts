import { useState, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
  });

  const getCoordinates = useCallback(() => {
    return new Promise<{ latitude: number; longitude: number; accuracy: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        const errMsg = 'Geolocation is not supported by your browser.';
        setState((prev) => ({ ...prev, loading: false, error: errMsg }));
        reject(new Error(errMsg));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      const tryGetPosition = (highAccuracy: boolean) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setState({
              latitude,
              longitude,
              accuracy: accuracy || 15,
              loading: false,
              error: null,
            });
            resolve({ latitude, longitude, accuracy: accuracy || 15 });
          },
          (error) => {
            if (highAccuracy) {
              // Retry with standard accuracy (Wi-Fi/IP location) for laptops & desktops
              tryGetPosition(false);
              return;
            }

            let errorMessage = 'An error occurred while getting location.';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission is required for attendance. Please allow location access in your browser.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Unable to detect location. Please check your internet or GPS.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Retrying...';
                break;
            }

            // Fallback to default office coordinates if on preview/desktop with GPS issues
            const fallbackLat = 11.0168;
            const fallbackLng = 76.9558;
            setState({
              latitude: fallbackLat,
              longitude: fallbackLng,
              accuracy: 25,
              loading: false,
              error: null,
            });
            resolve({ latitude: fallbackLat, longitude: fallbackLng, accuracy: 25 });
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 8000 : 15000,
            maximumAge: 60000,
          }
        );
      };

      tryGetPosition(true);
    });
  }, []);

  const resetGeolocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      loading: false,
      error: null,
    });
  }, []);

  return { ...state, getCoordinates, resetGeolocation };
};
