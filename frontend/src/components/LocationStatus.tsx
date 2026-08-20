import React from 'react';
import { MapPin, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface LocationStatusProps {
  loading: boolean;
  error: string | null;
  distance: number | null;
  allowedRadius: number | null;
  accuracy: number | null;
  maxGpsAccuracy: number | null;
  onRefresh?: () => void;
}

const LocationStatus: React.FC<LocationStatusProps> = ({
  loading,
  error,
  distance,
  allowedRadius,
  accuracy,
  maxGpsAccuracy,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-slate-100 bg-white rounded-3xl shadow-sm">
        <MapPin className="h-8 w-8 text-primary-500 animate-bounce mb-3" />
        <h4 className="text-sm font-semibold text-slate-700">Getting your location...</h4>
        <p className="text-xs text-slate-400 mt-1">Please allow GPS permissions if prompted.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-rose-100 bg-rose-50/50 rounded-3xl shadow-sm">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-rose-800">Location Detection Failed</h4>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If we have accuracy but it's higher than the maximum allowed accuracy
  if (accuracy !== null && maxGpsAccuracy !== null && accuracy > maxGpsAccuracy) {
    return (
      <div className="p-6 border border-amber-100 bg-amber-50/50 rounded-3xl shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800">GPS Accuracy Too Low</h4>
            <p className="text-xs text-amber-600 mt-1">
              Current accuracy: {accuracy.toFixed(1)}m (Max allowed: {maxGpsAccuracy}m).
            </p>
            <p className="text-xs text-amber-500 mt-0.5">
              Please move outdoors or enable precise location services on your device.
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Refresh GPS
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (distance !== null && allowedRadius !== null) {
    const isInside = distance <= allowedRadius;

    if (isInside) {
      return (
        <div className="p-6 border border-emerald-100 bg-emerald-50/50 rounded-3xl shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-emerald-800">✓ Location Verified</h4>
              <div className="mt-2 space-y-1 text-xs text-emerald-700">
                <p>Distance: <span className="font-bold">{distance.toFixed(1)} meters</span> from office</p>
                <p>GPS Precision: ±{accuracy?.toFixed(1)} meters</p>
                <p className="text-emerald-600 font-medium mt-1">Status: You are within the allowed {allowedRadius}m office boundary.</p>
              </div>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Recalculate
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="p-6 border border-rose-100 bg-rose-50/50 rounded-3xl shadow-sm">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-800">✕ Outside Office Area</h4>
              <div className="mt-2 space-y-1 text-xs text-rose-700">
                <p>Distance: <span className="font-bold">{distance.toFixed(1)} meters</span> away</p>
                <p>Allowed Radius: {allowedRadius} meters</p>
                <p>GPS Precision: ±{accuracy?.toFixed(1)} meters</p>
                <p className="text-rose-600 font-medium mt-1">Error: You must be within the office location to login.</p>
              </div>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh GPS
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-slate-100 bg-white rounded-3xl shadow-sm">
      <MapPin className="h-8 w-8 text-slate-400 mb-3" />
      <h4 className="text-sm font-semibold text-slate-600">Location Checking...</h4>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Verify Location
        </button>
      )}
    </div>
  );
};

export default LocationStatus;
