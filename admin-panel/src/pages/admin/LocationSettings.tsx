import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import { CompanyLocation } from '../../types/location';
import { LocationMapPicker } from '../../components/LocationMapPicker';
import Card from '../../components/Card';
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
  Compass,
  X,
  Sparkles,
  Layers,
  Map as MapIcon,
  Crosshair,
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
        setSuccessMsg(`Location "${payload.companyName}" updated successfully!`);
      } else {
        await locationService.createLocation(payload);
        setSuccessMsg(`New location "${payload.companyName}" added successfully!`);
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
      setSuccessMsg(`Location "${deleteModalLoc.companyName}" removed successfully.`);
      setDeleteModalLoc(null);
      await fetchLocations();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.message || 'Failed to delete location.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <Loading fullScreen message="Loading company locations..." />;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-indigo-600" />
            Company Office Locations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage multiple office branches, interactive GPS geofences, and boundary limits
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openAddModal}
          className="font-bold py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Location</span>
        </Button>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-slide">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 animate-slide">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Locations Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 text-white shadow-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-extrabold text-white">
              Active Geofenced Locations ({locations.length})
            </h3>
          </div>
          <p className="text-xs text-indigo-200">
            Employees can check in and out automatically at <strong>any approved company location</strong> within the allowed boundary radius.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center">
            <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wide">Total Branches</p>
            <p className="text-lg font-mono font-extrabold text-white">{locations.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center">
            <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wide">Standard Radius</p>
            <p className="text-lg font-mono font-extrabold text-emerald-400">{locations[0]?.allowedRadius || 50}m</p>
          </div>
        </div>
      </div>

      {/* Locations Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc, idx) => (
          <Card
            key={loc.id || idx}
            className="p-5 bg-white border-slate-200/80 hover:shadow-lg transition-all rounded-2xl flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{loc.companyName}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Location #{idx + 1}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Coordinates Pill */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">Latitude:</span>
                  <span className="font-bold">{loc.latitude.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">Longitude:</span>
                  <span className="font-bold">{loc.longitude.toFixed(6)}</span>
                </div>
              </div>

              {/* Geofence Badges */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Radius</p>
                    <p className="text-xs font-bold text-indigo-900">{loc.allowedRadius} meters</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Max Accuracy</p>
                    <p className="text-xs font-bold text-emerald-900">±{loc.maxGpsAccuracy}m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(loc)}
                className="text-xs font-bold py-1.5 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 text-indigo-600" /> Edit
              </Button>

              {locations.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteModalLoc(loc);
                    setDeleteError(null);
                  }}
                  className="text-xs font-bold py-1.5 px-3 border-rose-200 hover:bg-rose-50 text-rose-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* ══════════════ ADD / EDIT LOCATION MODAL WITH INTERACTIVE MAP ══════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-scale">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">
                  {editingLocation ? 'Edit Company Location' : 'Add New Company Location'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form id="location-modal-form" onSubmit={handleFormSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 custom-scrollbar">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Location Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Location / Branch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coimbatore Main Campus, Branch Office 2, Bangalore Tech Center"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              {/* Interactive Map Picker */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <MapIcon className="h-3.5 w-3.5 text-indigo-600" />
                  Select Office Location on Map (Drag Marker or Click)
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
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formLatitude}
                    onChange={(e) => setFormLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formLongitude}
                    onChange={(e) => setFormLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Allowed Radius & GPS Accuracy */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Allowed Radius (meters)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    required
                    value={formRadius}
                    onChange={(e) => setFormRadius(parseInt(e.target.value, 10) || 50)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Max GPS Accuracy (meters)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    required
                    value={formAccuracy}
                    onChange={(e) => setFormAccuracy(parseInt(e.target.value, 10) || 100)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>
            </form>

            {/* Modal Sticky Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
                className="py-2 px-4 font-bold text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="location-modal-form"
                variant="primary"
                size="sm"
                loading={modalLoading}
                className="py-2 px-6 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                {editingLocation ? 'Save Changes' : 'Create Location'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ DELETE CONFIRMATION MODAL ══════════════ */}
      {deleteModalLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-slate-200 animate-scale">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Delete Location</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the company location{' '}
              <strong>"{deleteModalLoc.companyName}"</strong>? Employees will no longer be able to check in at this branch.
            </p>

            {deleteError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalLoc(null)}
                className="py-2 font-bold text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteLoading}
                onClick={handleDeleteLocation}
                className="py-2 font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSettings;
