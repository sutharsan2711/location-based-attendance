import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { assetService } from '../../services/assetService';
import { employeeService } from '../../services/employeeService';
import {
  Asset,
  AssetCategory,
  AssetStatus,
  AssetCondition,
  AssetCreatePayload,
  AssetRequestItem,
  AssetRequestPriority,
} from '../../types/asset';
import { Employee } from '../../types/employee';
import { formatDate } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Laptop,
  Monitor,
  KeyRound,
  Mouse,
  Smartphone,
  Armchair,
  Package,
  PlusCircle,
  Search,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  RotateCcw,
  Edit3,
  Trash2,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  HelpCircle,
  AlertCircle,
  Info,
  Settings,
} from 'lucide-react';

const CATEGORY_ICONS: Record<AssetCategory, any> = {
  LAPTOP: Laptop,
  MONITOR: Monitor,
  ACCESS_CARD: KeyRound,
  PERIPHERAL: Mouse,
  MOBILE: Smartphone,
  FURNITURE: Armchair,
  OTHER: Package,
};

const CATEGORY_COLORS: Record<AssetCategory, { bg: string; text: string; border: string }> = {
  LAPTOP: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  MONITOR: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  ACCESS_CARD: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PERIPHERAL: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  MOBILE: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  FURNITURE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  OTHER: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

const STATUS_BADGES: Record<AssetStatus, { bg: string; text: string; border: string; label: string }> = {
  AVAILABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'In Stock' },
  ASSIGNED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Allocated' },
  UNDER_MAINTENANCE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Maintenance' },
  DAMAGED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Damaged' },
  RETIRED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Retired' },
};

const PRIORITY_BADGES: Record<AssetRequestPriority, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  URGENT: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const AdminAssets: React.FC = () => {
  // Tabs: 'inventory' | 'requests'
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<AssetRequestItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetForm, setAssetForm] = useState<AssetCreatePayload>({
    assetCode: '',
    name: '',
    category: 'LAPTOP',
    model: '',
    serialNumber: '',
    condition: 'GOOD',
    purchaseDate: '',
    purchaseCost: undefined,
    notes: '',
  });
  const [savingAsset, setSavingAsset] = useState<boolean>(false);

  // Assign Modal
  const [assignModalAsset, setAssignModalAsset] = useState<Asset | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState<number | ''>('');
  const [assignDate, setAssignDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [assignHandoverNotes, setAssignHandoverNotes] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  // Return Modal
  const [returnModalAsset, setReturnModalAsset] = useState<Asset | null>(null);
  const [returnCondition, setReturnCondition] = useState<AssetCondition>('GOOD');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [returning, setReturning] = useState<boolean>(false);

  // Request Action Modal
  const [actionModalRequest, setActionModalRequest] = useState<AssetRequestItem | null>(null);
  const [actionStatus, setActionStatus] = useState<'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'RESOLVED'>('APPROVED');
  const [actionAdminRemarks, setActionAdminRemarks] = useState<string>('');
  const [updatingRequest, setUpdatingRequest] = useState<boolean>(false);

  // Categories State
  const [categories, setCategories] = useState<{ id: number; name: string; description: string | null; icon: string | null }[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [creatingCat, setCreatingCat] = useState<boolean>(false);
  const [deletingCatId, setDeletingCatId] = useState<number | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchCategories = async () => {
    try {
      const data = await assetService.getCategories();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load asset categories', err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setCreatingCat(true);
      await assetService.createCategory(newCatName.trim(), newCatDesc.trim() || undefined);
      setNewCatName('');
      setNewCatDesc('');
      await fetchCategories();
      showToast('success', 'Asset category created successfully.');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create category.');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      setDeletingCatId(id);
      await assetService.deleteCategory(id);
      if (selectedCategory === name) setSelectedCategory('ALL');
      await fetchCategories();
      showToast('success', `Category "${name}" deleted.`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeletingCatId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsData, requestsData, employeesData] = await Promise.all([
        assetService.getAllAssets({
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          search: searchQuery || undefined,
        }),
        assetService.getAllRequests(),
        employeeService.getAll(),
      ]);
      setAssets(assetsData);
      setRequests(requestsData);
      setEmployees(employeesData.filter((e) => e.status === 'ACTIVE'));
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Failed to load asset management data.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [fetchData]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const total = assets.length;
    const assigned = assets.filter((a) => a.status === 'ASSIGNED').length;
    const inStock = assets.filter((a) => a.status === 'AVAILABLE').length;
    const maintenance = assets.filter((a) => a.status === 'UNDER_MAINTENANCE' || a.status === 'DAMAGED').length;
    const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
    return { total, assigned, inStock, maintenance, pendingRequests };
  }, [assets, requests]);

  // Handle Save Asset (Create / Update)
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.name.trim() || !assetForm.category) {
      showToast('error', 'Asset name and category are required');
      return;
    }

    setSavingAsset(true);
    try {
      if (editingAsset) {
        await assetService.updateAsset(editingAsset.id, assetForm);
        showToast('success', `Asset '${assetForm.name}' updated successfully!`);
      } else {
        await assetService.createAsset(assetForm);
        showToast('success', `Asset '${assetForm.name}' added to inventory!`);
      }
      setShowAddModal(false);
      setEditingAsset(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || err.message || 'Failed to save asset');
    } finally {
      setSavingAsset(false);
    }
  };

  // Handle Assign Asset
  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalAsset || !assignEmployeeId) {
      showToast('error', 'Please select an employee');
      return;
    }

    setAssigning(true);
    try {
      await assetService.assignAsset(assignModalAsset.id, {
        employeeId: Number(assignEmployeeId),
        assignedDate: assignDate,
        handoverNotes: assignHandoverNotes,
      });
      showToast('success', `Asset '${assignModalAsset.name}' allocated successfully!`);
      setAssignModalAsset(null);
      setAssignEmployeeId('');
      setAssignHandoverNotes('');
      fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || err.message || 'Failed to assign asset');
    } finally {
      setAssigning(false);
    }
  };

  // Handle Return Asset
  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalAsset) return;

    setReturning(true);
    try {
      await assetService.returnAsset(returnModalAsset.id, {
        condition: returnCondition,
        notes: returnNotes,
      });
      showToast('success', `Asset '${returnModalAsset.name}' returned to stock!`);
      setReturnModalAsset(null);
      setReturnNotes('');
      fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || err.message || 'Failed to return asset');
    } finally {
      setReturning(false);
    }
  };

  // Handle Delete Asset
  const handleDeleteAsset = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete / retire asset '${name}'?`)) return;
    try {
      await assetService.deleteAsset(id);
      showToast('success', `Asset '${name}' deleted.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || err.message || 'Failed to delete asset');
    }
  };

  // Handle Request Status Update
  const handleUpdateRequestStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalRequest) return;

    setUpdatingRequest(true);
    try {
      await assetService.updateRequestStatus(actionModalRequest.id, actionStatus, actionAdminRemarks);
      showToast('success', `Asset request marked as ${actionStatus}`);
      setActionModalRequest(null);
      setActionAdminRemarks('');
      fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || err.message || 'Failed to update request');
    } finally {
      setUpdatingRequest(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Asset Management</h1>
              <p className="text-xs text-slate-500 font-medium">
                Track hardware inventory, employee device allocations & equipment requests
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setEditingAsset(null);
              setAssetForm({
                assetCode: '',
                name: '',
                category: 'LAPTOP',
                model: '',
                serialNumber: '',
                condition: 'GOOD',
                purchaseDate: '',
                purchaseCost: undefined,
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Add New Asset</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-slide ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* ── 2. Top Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Assets</span>
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 block">{metrics.total}</span>
            <span className="text-[10px] text-slate-400 font-medium">Registered items</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Allocated</span>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-700 block">{metrics.assigned}</span>
            <span className="text-[10px] text-blue-600/80 font-medium">Active with employees</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">In Stock</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-700 block">{metrics.inStock}</span>
            <span className="text-[10px] text-emerald-600/80 font-medium">Available to assign</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Maintenance</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-700 block">{metrics.maintenance}</span>
            <span className="text-[10px] text-amber-600/80 font-medium">Repair or damaged</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Requests</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-black text-purple-700 block">{metrics.pendingRequests}</span>
            {metrics.pendingRequests > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                Action Req.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Tabs & Search Controls ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Asset Inventory ({assets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Employee Requests ({requests.length})</span>
              {metrics.pendingRequests > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {metrics.pendingRequests}
                </span>
              )}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by asset code, model, serial, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {activeTab === 'inventory' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="assetCategoryFilter" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Category:</span>
                </label>
                <select
                  id="assetCategoryFilter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs hover:bg-white transition-colors min-w-[170px]"
                >
                  <option value="ALL">All Categories ({assets.length})</option>
                  {(categories.length > 0
                    ? categories.map((c) => c.name)
                    : ['LAPTOP', 'MONITOR', 'ACCESS_CARD', 'PERIPHERAL', 'MOBILE', 'FURNITURE', 'OTHER']
                  ).map((cat) => {
                    const count = assets.filter((a) => a.category === cat).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, ' ')} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="assetStatusFilter" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-slate-400" />
                  <span>Status:</span>
                </label>
                <select
                  id="assetStatusFilter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs hover:bg-white transition-colors min-w-[150px]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">In Stock (Available)</option>
                  <option value="ASSIGNED">Allocated (Assigned)</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                </select>
              </div>

              {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              <span>Manage Categories</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 4. Main Tab Content ── */}
      {loading ? (
        <Loading fullScreen={false} message="Loading assets..." />
      ) : activeTab === 'inventory' ? (
        /* Inventory Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Asset Code / Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Serial Number / Model</th>
                  <th className="py-3.5 px-4">Status & Condition</th>
                  <th className="py-3.5 px-4">Current Allocation</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-xs text-slate-600">No assets found</p>
                      <p className="text-[11px] text-slate-400">Add a new asset to start managing your inventory.</p>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const Icon = CATEGORY_ICONS[asset.category] || Package;
                    const catStyle = CATEGORY_COLORS[asset.category] || CATEGORY_COLORS.OTHER;
                    const statusStyle = STATUS_BADGES[asset.status] || STATUS_BADGES.AVAILABLE;

                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Asset Item */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{asset.name}</span>
                              <span className="text-[10.5px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                {asset.assetCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                          >
                            {asset.category.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Serial & Model */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block text-xs">
                            {asset.model || '--'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            SN: {asset.serialNumber || 'N/A'}
                          </span>
                        </td>

                        {/* Status & Condition */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2.5 py-0.8 rounded-full text-[10.5px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                            >
                              {statusStyle.label}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {asset.condition}
                            </span>
                          </div>
                        </td>

                        {/* Current Allocation */}
                        <td className="py-3.5 px-4">
                          {asset.assignedEmployee ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {asset.assignedEmployee.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs leading-tight">
                                  {asset.assignedEmployee.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {asset.assignedEmployee.employeeCode} {asset.assignedDate ? `• Since ${formatDate(asset.assignedDate)}` : ''}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned (In Stock)</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {asset.status === 'AVAILABLE' ? (
                              <button
                                onClick={() => {
                                  setAssignModalAsset(asset);
                                  setAssignEmployeeId('');
                                  setAssignDate(new Date().toISOString().split('T')[0]);
                                  setAssignHandoverNotes('');
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Allocate this asset to an employee"
                              >
                                <UserCheck className="h-3 w-3" />
                                <span>Assign</span>
                              </button>
                            ) : asset.status === 'ASSIGNED' ? (
                              <button
                                onClick={() => {
                                  setReturnModalAsset(asset);
                                  setReturnCondition(asset.condition || 'GOOD');
                                  setReturnNotes('');
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Check-in / Return this asset back to stock"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Return</span>
                              </button>
                            ) : null}

                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setAssetForm({
                                  assetCode: asset.assetCode,
                                  name: asset.name,
                                  category: asset.category,
                                  model: asset.model || '',
                                  serialNumber: asset.serialNumber || '',
                                  condition: asset.condition,
                                  purchaseDate: asset.purchaseDate || '',
                                  purchaseCost: asset.purchaseCost || undefined,
                                  notes: asset.notes || '',
                                });
                                setShowAddModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Asset"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteAsset(asset.id, asset.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Asset"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Requests Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Request / Category</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Priority & Type</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Description & Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-xs text-slate-600">No asset requests pending</p>
                      <p className="text-[11px] text-slate-400">Employee hardware tickets will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const prioStyle = PRIORITY_BADGES[req.priority] || PRIORITY_BADGES.MEDIUM;
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block text-xs">{req.title}</span>
                          <span className="text-[10px] text-indigo-600 font-bold uppercase">
                            {req.category.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block text-xs">
                            {req.employee?.name || 'Employee'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {req.employee?.employeeCode}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[9.5px] font-bold border inline-block ${prioStyle.bg} ${prioStyle.text} ${prioStyle.border}`}
                            >
                              {req.priority} PRIORITY
                            </span>
                            <span className="text-[10.5px] text-slate-500 block font-semibold">
                              {req.requestType.replace('_', ' ')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-700 text-xs leading-snug">{req.description}</p>
                          {req.adminRemarks && (
                            <div className="mt-1 text-[11px] text-indigo-800 bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100">
                              <strong>Admin Note:</strong> {req.adminRemarks}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.8 rounded-full text-[10.5px] font-bold border ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : req.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : req.status === 'RESOLVED'
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setActionModalRequest(req);
                              setActionStatus(req.status === 'PENDING' ? 'APPROVED' : (req.status as any));
                              setActionAdminRemarks(req.adminRemarks || '');
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Review / Update
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. ADD / EDIT ASSET MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingAsset ? 'Edit Asset Record' : 'Register New Asset'}
                  </h3>
                  <p className="text-xs text-slate-400">Fill in hardware specifications and inventory details</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro 14 M3"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Category *
                  </label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value as AssetCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="LAPTOP">Laptop / Computer</option>
                    <option value="MONITOR">Monitor / Display</option>
                    <option value="ACCESS_CARD">Office Access Card</option>
                    <option value="PERIPHERAL">Peripheral (Mouse/Keyboard/Headset)</option>
                    <option value="MOBILE">Mobile Device / Tablet</option>
                    <option value="FURNITURE">Ergonomic Furniture / Chair</option>
                    <option value="OTHER">Other Equipment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Model Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 16GB / 512GB SSD Space Gray"
                    value={assetForm.model || ''}
                    onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Serial Number (Unique)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-A9842109X"
                    value={assetForm.serialNumber || ''}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Asset Code
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={assetForm.assetCode || ''}
                    onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Condition
                  </label>
                  <select
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value as AssetCondition })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="EXCELLENT">Excellent (Brand New)</option>
                    <option value="GOOD">Good (Working)</option>
                    <option value="FAIR">Fair (Minor Wear)</option>
                    <option value="DAMAGED">Damaged / Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 75000"
                    value={assetForm.purchaseCost || ''}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Purchase / Acquisition Date
                </label>
                <input
                  type="date"
                  value={assetForm.purchaseDate || ''}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Internal Notes & Warranty Info
                </label>
                <textarea
                  rows={2}
                  placeholder="Warranty expiry, supplier, or additional details..."
                  value={assetForm.notes || ''}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAsset}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {savingAsset && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />}
                  {editingAsset ? 'Update Asset' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. ALLOCATE / ASSIGN MODAL ── */}
      {assignModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Allocate Hardware</h3>
                  <p className="text-xs text-slate-400">{assignModalAsset.name} ({assignModalAsset.assetCode})</p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Select Employee *
                </label>
                <select
                  required
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) • {emp.department || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Handover Date *
                </label>
                <input
                  type="date"
                  required
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Handover Notes / Accessories Included
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Provided with 65W USB-C Charger, Bag & Wireless Mouse"
                  value={assignHandoverNotes}
                  onChange={(e) => setAssignHandoverNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalAsset(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {assigning && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />}
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. RETURN / CHECK-IN MODAL ── */}
      {returnModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Check-in / Return Asset</h3>
                  <p className="text-xs text-slate-400">
                    Returning from {returnModalAsset.assignedEmployee?.name || 'Employee'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Received Condition *
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as AssetCondition)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="GOOD">Good / Working Condition</option>
                  <option value="EXCELLENT">Excellent (Like New)</option>
                  <option value="FAIR">Fair (Minor Scratches/Wear)</option>
                  <option value="DAMAGED">Damaged (Requires Maintenance)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Return Notes / Inspection Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. All accessories returned in good order / Screen cleaned"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnModalAsset(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returning}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {returning && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />}
                  Check-in to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. REVIEW REQUEST MODAL ── */}
      {actionModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Review Asset Request</h3>
                  <p className="text-xs text-slate-400">By {actionModalRequest.employee?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setActionModalRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRequestStatus} className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <p><strong>Title:</strong> {actionModalRequest.title}</p>
                <p><strong>Category:</strong> {actionModalRequest.category.replace('_', ' ')}</p>
                <p className="text-slate-600"><strong>Description:</strong> {actionModalRequest.description}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Update Request Status *
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="APPROVED">APPROVED (Approve Request)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Procuring / In-Transit)</option>
                  <option value="RESOLVED">RESOLVED (Allocated / Completed)</option>
                  <option value="REJECTED">REJECTED (Decline)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Admin Remarks / Handover Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved. Please collect device from IT desk on Monday."
                  value={actionAdminRemarks}
                  onChange={(e) => setActionAdminRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingRequest}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {updatingRequest && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MANAGE ASSET CATEGORIES MODAL                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Manage Asset Categories</h3>
                  <p className="text-xs text-slate-400">Create new categories or delete existing categories</p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Create Category Form */}
            <form onSubmit={handleCreateCategory} className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Add New Category</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category Code/Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TABLET / PROJECTOR"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief details"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={creatingCat || !newCatName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{creatingCat ? 'Creating...' : 'Create Category'}</span>
                </button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Existing Categories ({categories.length})
              </span>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 text-xs">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <span className="font-extrabold text-slate-800">{cat.name}</span>
                      {cat.description && (
                        <p className="text-[11px] text-slate-400">{cat.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={deletingCatId === cat.id}
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssets;
