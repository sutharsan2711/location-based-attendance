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

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setState({
            latitude,
            longitude,
            accuracy,
            loading: false,
            error: null,
          });
          resolve({ latitude, longitude, accuracy });
        },
        (error) => {
          let errorMessage = 'An unknown error occurred while getting location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission is required for attendance.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Unable to detect your location. Please enable GPS/location services.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          setState({
            latitude: null,
            longitude: null,
            accuracy: null,
            loading: false,
            error: errorMessage,
          });
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
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
