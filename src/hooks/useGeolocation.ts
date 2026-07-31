import { useState, useEffect, useRef, useCallback } from "react";

export interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  tracking: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: false,
    tracking: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation is not supported by your browser.", loading: false }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
          tracking: false,
        });
      },
      (err) => {
        let msg = "Location unavailable.";
        if (err.code === 1) msg = "Location permission denied. Please enable in browser settings.";
        else if (err.code === 3) msg = "Location request timed out.";
        setState((s) => ({ ...s, error: msg, loading: false, tracking: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported.", loading: false }));
      return;
    }

    setState((s) => ({ ...s, tracking: true, loading: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
          tracking: true,
        });
      },
      (err) => {
        let msg = "Location unavailable.";
        if (err.code === 1) msg = "Location permission denied. Please enable in browser settings.";
        else if (err.code === 3) msg = "Location request timed out.";
        setState((s) => ({ ...s, error: msg, loading: false, tracking: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((s) => ({ ...s, tracking: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, getLocation, startTracking, stopTracking };
};
