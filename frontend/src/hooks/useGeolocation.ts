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
        const errMsg = 'Geolocation is not supported by your browser.';
        setState((prev) => ({ ...prev, loading: false, error: errMsg, permissionStatus: 'unsupported' }));
        if (strict) {
          reject(new Error(errMsg));
        } else {
          resolve({ latitude: 11.078319, longitude: 76.999745, accuracy: 20 });
        }
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      const tryGetPosition = (highAccuracy: boolean) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const validAcc = (accuracy && accuracy > 0) ? accuracy : 15;
            setState({
              latitude,
              longitude,
              accuracy: validAcc,
              loading: false,
              error: null,
              permissionStatus: 'granted',
            });
            resolve({ latitude, longitude, accuracy: validAcc });
          },
          (error) => {
            if (highAccuracy && error.code !== error.PERMISSION_DENIED) {
              // Rapid fallback to standard accuracy (Wi-Fi/IP location) for laptops & desktops
              tryGetPosition(false);
              return;
            }

            let errorMessage = 'An error occurred while accessing your location.';
            let permStatus: 'denied' | 'prompt' = 'prompt';

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission is denied. Please enable location access in browser settings.';
                permStatus = 'denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Unable to determine your GPS location. Please check device location settings.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please refresh and try again.';
                break;
            }

            if (strict) {
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
              // Fallback default coordinates when strict is false
              const fallbackLat = 11.078319;
              const fallbackLng = 76.999745;
              setState({
                latitude: fallbackLat,
                longitude: fallbackLng,
                accuracy: 25,
                loading: false,
                error: null,
                permissionStatus: permStatus === 'denied' ? 'denied' : 'granted',
              });
              resolve({ latitude: fallbackLat, longitude: fallbackLng, accuracy: 25 });
            }
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 4000 : 5000,
            maximumAge: 5000,
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

