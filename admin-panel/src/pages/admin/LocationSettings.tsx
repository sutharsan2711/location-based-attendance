import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import { CompanyLocation } from '../../types/location';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import { MapPin, ShieldCheck, Compass, Radio, CheckCircle2, AlertTriangle } from 'lucide-react';

const LocationSettings: React.FC = () => {
  const [location, setLocation] = useState<CompanyLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  
  const [companyName, setCompanyName] = useState('');
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [allowedRadius, setAllowedRadius] = useState<number>(50);
  const [maxGpsAccuracy, setMaxGpsAccuracy] = useState<number>(100);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const data = await locationService.getLocation();
        setLocation(data);
        setCompanyName(data.companyName);
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setAllowedRadius(data.allowedRadius);
        setMaxGpsAccuracy(data.maxGpsAccuracy);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load company location details.');
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setSaveLoading(true);

    try {
      const payload: CompanyLocation = {
        companyName: companyName.trim(),
        latitude,
        longitude,
        allowedRadius,
        maxGpsAccuracy,
      };

      const updated = await locationService.updateLocation(payload);
      setLocation(updated);
      setSuccessMsg('Office boundary and location settings updated successfully!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update location configurations.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Helper to fetch admin's current coordinates to pre-fill coordinates inputs
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setMaxGpsAccuracy(Math.ceil(position.coords.accuracy));
        alert(`Location coordinates retrieved: ${position.coords.latitude}, ${position.coords.longitude}`);
      },
      (error) => {
        console.error(error);
        alert('Failed to detect current location coordinates. Please verify browser permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading) return <Loading fullScreen message="Loading settings..." />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
          Office Location Settings
        </h1>
        <p className="text-sm text-slate-400">Configure corporate geographical bounds, allowed check-in radius, and GPS accuracy filters</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Settings Form */}
        <Card title="Coordinates Configuration" className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none text-slate-800"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Latitude Coordinates
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Longitude Coordinates
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Allowed Boundary Radius (meters)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={allowedRadius}
                  onChange={(e) => setAllowedRadius(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Maximum GPS Accuracy Filter (meters)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={maxGpsAccuracy}
                  onChange={(e) => setMaxGpsAccuracy(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={useCurrentLocation}
                className="py-2.5 font-bold"
              >
                <Compass className="mr-2 h-4 w-4" /> Autofill Current Location
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={saveLoading}
                className="py-2.5 font-bold px-6"
              >
                SAVE LOCATION
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Box */}
        <Card title="Current Target Bounds" className="md:col-span-2">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
              <MapPin className="h-6 w-6 text-primary-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Location Coordinates</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
              <Radio className="h-6 w-6 text-indigo-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Allowed Radius Bounds</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{allowedRadius} meters</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
              <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">GPS Precision Limit</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">±{maxGpsAccuracy} meters</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4 text-[11px] text-slate-400 font-medium">
              💡 <span className="font-semibold text-slate-500">How boundary validation works:</span> When employees submit attendance, the server calculates their distance from these target coordinates using the Haversine formula. Punches exceeding {allowedRadius}m are strictly rejected.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LocationSettings;
