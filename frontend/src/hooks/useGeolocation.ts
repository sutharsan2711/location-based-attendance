import { useState, useCallback, useEffect } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported' | 'unknown';
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionStatus: typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'unknown' : 'unsupported',
  });

  const checkPermission = useCallback(async (): Promise<'prompt' | 'granted' | 'denied' | 'unsupported'> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({ ...prev, permissionStatus: 'unsupported' }));
      return 'unsupported';
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        const status = result.state as 'prompt' | 'granted' | 'denied';
        setState((prev) => ({ ...prev, permissionStatus: status }));
        result.onchange = () => {
          setState((prev) => ({ ...prev, permissionStatus: result.state as 'prompt' | 'granted' | 'denied' }));
        };
        return status;
      } catch {
        // Fallback for browsers that don't support geolocation permission query
      }
    }
    return 'prompt';
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const getCoordinates = useCallback((strict: boolean = true): Promise<GeolocationCoordinates> => {
    return new Promise<GeolocationCoordinates>((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const errMsg = 'Geolocation is not supported by your browser. Please use a supported modern browser.';
        setState((prev) => ({ ...prev, loading: false, error: errMsg, permissionStatus: 'unsupported' }));
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
              permissionStatus: 'granted',
            });
            resolve({ latitude, longitude, accuracy: accuracy || 15 });
          },
          (error) => {
            if (highAccuracy && error.code !== error.PERMISSION_DENIED) {
              // Retry with standard accuracy (Wi-Fi/IP location) for laptops & desktops
              tryGetPosition(false);
              return;
            }

            let errorMessage = 'An error occurred while accessing your location.';
            let permStatus: 'denied' | 'prompt' = 'prompt';

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission is required to sign in. Please allow location access in your browser.';
                permStatus = 'denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Unable to determine your device location. Please enable GPS / location services.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please ensure location services are active and try again.';
                break;
            }

            if (strict || error.code === error.PERMISSION_DENIED) {
              setState({
                latitude: null,
                longitude: null,
                accuracy: null,
                loading: false,
                error: errorMessage,
                permissionStatus: permStatus,
              });
              reject(new Error(errorMessage));
            } else {
              // Fallback coordinates when strict is explicitly false
              const fallbackLat = 11.0168;
              const fallbackLng = 76.9558;
              setState({
                latitude: fallbackLat,
                longitude: fallbackLng,
                accuracy: 25,
                loading: false,
                error: null,
                permissionStatus: 'granted',
              });
              resolve({ latitude: fallbackLat, longitude: fallbackLng, accuracy: 25 });
            }
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 8000 : 15000,
            maximumAge: 0,
          }
        );
      };

      tryGetPosition(true);
    });
  }, []);

  const resetGeolocation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      latitude: null,
      longitude: null,
      accuracy: null,
      loading: false,
      error: null,
    }));
  }, []);

  return { ...state, getCoordinates, checkPermission, resetGeolocation };
};

