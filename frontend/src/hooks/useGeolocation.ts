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
  isVerified: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionStatus: typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'unknown' : 'unsupported',
    isVerified: false,
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

  const getCoordinates = useCallback((): Promise<GeolocationCoordinates> => {
    return new Promise<GeolocationCoordinates>((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const errMsg = 'Geolocation is not supported by your browser/device.';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errMsg,
          permissionStatus: 'unsupported',
          isVerified: false,
        }));
        reject(new Error(errMsg));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      const tryGetPosition = (highAccuracy: boolean) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const validAcc = accuracy && accuracy > 0 ? accuracy : 15;
            setState({
              latitude,
              longitude,
              accuracy: validAcc,
              loading: false,
              error: null,
              permissionStatus: 'granted',
              isVerified: true,
            });
            resolve({ latitude, longitude, accuracy: validAcc });
          },
          (error) => {
            if (highAccuracy && error.code !== error.PERMISSION_DENIED) {
              // Rapid fallback to standard accuracy (Wi-Fi/cellular) before failing
              tryGetPosition(false);
              return;
            }

            let errorMessage = 'An error occurred while accessing device GPS location.';
            let permStatus: 'denied' | 'prompt' = 'prompt';

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission is denied. Please enable location access in your browser settings.';
                permStatus = 'denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Device GPS / Location is turned off. Please switch ON Location in your phone settings and tap retry.';
                break;
              case error.TIMEOUT:
                errorMessage = 'GPS location request timed out. Please ensure phone location is enabled and try again.';
                break;
            }

            setState({
              latitude: null,
              longitude: null,
              accuracy: null,
              loading: false,
              error: errorMessage,
              permissionStatus: permStatus,
              isVerified: false,
            });
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 8000 : 10000,
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
      isVerified: false,
    }));
  }, []);

  return { ...state, getCoordinates, checkPermission, resetGeolocation };
};


