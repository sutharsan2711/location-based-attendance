import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import { CompanyLocation } from '../../types/location';
import { LocationMapPicker } from '../../components/LocationMapPicker';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  Map as MapIcon,
  Layers,
} from 'lucide-react';

const LocationSettings: React.FC = () => {
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<CompanyLocation | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formLatitude, setFormLatitude] = useState<number>(11.078319);
  const [formLongitude, setFormLongitude] = useState<number>(76.999745);
  const [formRadius, setFormRadius] = useState<number>(50);
  const [formAccuracy, setFormAccuracy] = useState<number>(100);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal State
  const [deleteModalLoc, setDeleteModalLoc] = useState<CompanyLocation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      const data = await locationService.getAllLocations();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations', err);
      setErrorMsg('Failed to load company location details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openAddModal = () => {
    setEditingLocation(null);
    setFormName('');
    setFormLatitude(11.078319);
    setFormLongitude(76.999745);
    setFormRadius(50);
    setFormAccuracy(100);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (loc: CompanyLocation) => {
    setEditingLocation(loc);
    setFormName(loc.companyName);
    setFormLatitude(loc.latitude);
    setFormLongitude(loc.longitude);
    setFormRadius(loc.allowedRadius);
    setFormAccuracy(loc.maxGpsAccuracy);
    setFormError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please provide a location/branch name.');
      return;
    }

    setModalLoading(true);
    setFormError(null);

    const payload: CompanyLocation = {
      ...(editingLocation ? editingLocation : {}),
      companyName: formName.trim(),
      latitude: formLatitude,
      longitude: formLongitude,
      allowedRadius: formRadius,
      maxGpsAccuracy: formAccuracy,
    };

    try {
      if (editingLocation && editingLocation.id) {
        await locationService.updateLocationById(editingLocation.id, payload);
        setSuccessMsg(`Location "${payload.companyName}" updated successfully.`);
      } else {
        await locationService.createLocation(payload);
        setSuccessMsg(`New location "${payload.companyName}" added successfully.`);
      }
      setShowModal(false);
      await fetchLocations();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save location.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteModalLoc || !deleteModalLoc.id) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await locationService.deleteLocation(deleteModalLoc.id);
      setSuccessMsg(`Location "${deleteModalLoc.companyName}" removed.`);
      setDeleteModalLoc(null);
      await fetchLocations();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.message || 'Failed to delete location.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <Loading fullScreen message="Loading locations..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Office Locations
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage physical office branches and GPS geofence boundaries for attendance
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openAddModal}
          className="font-semibold text-xs py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Location</span>
        </Button>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-800 animate-slide">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200/80 bg-rose-50/70 px-4 py-3 text-xs font-medium text-rose-800 animate-slide">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 cursor-pointer p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Locations Summary Banner */}
      <div className="p-4 bg-slate-900 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">
              Multi-Location Geofencing Active ({locations.length} {locations.length === 1 ? 'branch' : 'branches'})
            </p>
            <p className="text-[11px] text-slate-300">
              Employees can check in automatically at any configured office within the allowed radius.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-3 py-1 rounded-xl bg-white/10 text-slate-200 border border-white/15 self-start sm:self-auto shrink-0">
          Default Radius: {locations[0]?.allowedRadius || 50}m
        </span>
      </div>

      {/* Locations Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc, idx) => (
          <div
            key={loc.id || idx}
            className="p-4.5 bg-white border border-slate-200/80 hover:border-slate-300 transition-all rounded-2xl flex flex-col justify-between space-y-3.5 shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50/80 text-indigo-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{loc.companyName}</h3>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Branch #{idx + 1}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Coordinates Pill */}
              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-600 flex items-center justify-between">
                <span>{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</span>
                <span className="font-sans text-[10px] font-semibold text-indigo-600">{loc.allowedRadius}m radius</span>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase">Radius</p>
                    <p className="text-xs font-bold text-slate-800">{loc.allowedRadius}m</p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase">Accuracy</p>
                    <p className="text-xs font-bold text-slate-800">±{loc.maxGpsAccuracy}m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => openEditModal(loc)}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer transition-all"
              >
                <Edit2 className="h-3 w-3 text-slate-500" /> Edit
              </button>

              {locations.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalLoc(loc);
                    setDeleteError(null);
                  }}
                  className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Trash2 className="h-3 w-3 text-rose-500" /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════ ADD / EDIT LOCATION MODAL ══════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-4 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-scale">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <MapPin className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingLocation ? 'Edit Office Location' : 'Add New Office Location'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form id="location-modal-form" onSubmit={handleFormSubmit} className="overflow-y-auto p-5 space-y-3.5 flex-1 custom-scrollbar">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Location Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Location / Branch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coimbatore Main Office, Bangalore Branch"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              {/* Interactive Google Map Picker */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <MapIcon className="h-3.5 w-3.5 text-indigo-600" />
                  Select Office Pin on Google Map
                </label>
                <LocationMapPicker
                  latitude={formLatitude}
                  longitude={formLongitude}
                  radius={formRadius}
                  onChange={(lat, lng) => {
                    setFormLatitude(lat);
                    setFormLongitude(lng);
                  }}
                  onRadiusChange={(r) => setFormRadius(r)}
                />
              </div>

              {/* Coordinates Inputs */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formLatitude}
                    onChange={(e) => setFormLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formLongitude}
                    onChange={(e) => setFormLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Allowed Radius & GPS Accuracy */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">
                    Allowed Radius (m)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    required
                    value={formRadius}
                    onChange={(e) => setFormRadius(parseInt(e.target.value, 10) || 50)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">
                    Max Accuracy (m)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    required
                    value={formAccuracy}
                    onChange={(e) => setFormAccuracy(parseInt(e.target.value, 10) || 100)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>
            </form>

            {/* Modal Sticky Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                form="location-modal-form"
                variant="primary"
                size="sm"
                loading={modalLoading}
                className="py-2 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer rounded-xl"
              >
                {editingLocation ? 'Save Changes' : 'Create Location'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ DELETE CONFIRMATION MODAL ══════════════ */}
      {deleteModalLoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-4 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-sm w-full shadow-xl p-5 space-y-3.5 border border-slate-200 animate-scale">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-100">
                <Trash2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Delete Location</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>"{deleteModalLoc.companyName}"</strong>? Employees will no longer be able to punch in at this branch.
            </p>

            {deleteError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalLoc(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteLoading}
                onClick={handleDeleteLocation}
                className="py-1.5 px-4 font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer rounded-xl"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSettings;
