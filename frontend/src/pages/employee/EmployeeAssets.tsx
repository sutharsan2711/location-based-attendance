import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Monitor,
  Smartphone,
  KeyRound,
  MousePointer2,
  Armchair,
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Search,
  RefreshCw,
  Tag,
  Calendar,
} from 'lucide-react';
import { assetService } from '../../services/assetService';
import {
  Asset,
  AssetRequestItem,
  AssetCategory,
  AssetRequestType,
  AssetRequestPriority,
  AssetRequestStatus,
  AssetCondition,
} from '../../types/asset';
import Loading from '../../components/Loading';

const categoryIcons: Record<AssetCategory, React.ReactNode> = {
  LAPTOP: <Laptop className="h-5 w-5 text-indigo-600" />,
  MONITOR: <Monitor className="h-5 w-5 text-teal-600" />,
  ACCESS_CARD: <KeyRound className="h-5 w-5 text-amber-600" />,
  PERIPHERAL: <MousePointer2 className="h-5 w-5 text-blue-600" />,
  MOBILE: <Smartphone className="h-5 w-5 text-purple-600" />,
  FURNITURE: <Armchair className="h-5 w-5 text-orange-600" />,
  OTHER: <HelpCircle className="h-5 w-5 text-slate-600" />,
};

const categoryLabels: Record<AssetCategory, string> = {
  LAPTOP: 'Laptop & Notebook',
  MONITOR: 'External Monitor / Display',
  ACCESS_CARD: 'Access Card / Key',
  PERIPHERAL: 'Mouse / Keyboard / Accessories',
  MOBILE: 'Mobile Device / Phone',
  FURNITURE: 'Office Chair / Desk',
  OTHER: 'Other Equipment',
};

const requestTypeLabels: Record<AssetRequestType, string> = {
  NEW_ASSET: 'Request New Equipment',
  REPAIR_REPLACEMENT: 'Repair / Replacement',
  RETURN_ASSET: 'Asset Handover / Return',
  HARDWARE_ISSUE: 'Report Hardware Defect / Issue',
};

const EmployeeAssets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assigned' | 'requests'>('assigned');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<AssetRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [requestFilter, setRequestFilter] = useState('ALL');

  // Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    requestType: 'NEW_ASSET' as AssetRequestType,
    category: 'LAPTOP' as AssetCategory,
    assetId: undefined as number | undefined,
    priority: 'MEDIUM' as AssetRequestPriority,
    description: '',
  });

  const fetchData = async () => {
    try {
      setError(null);
      const [assetsData, requestsData] = await Promise.all([
        assetService.getMyAssets(),
        assetService.getMyRequests(),
      ]);
      setAssets(assetsData || []);
      setRequests(requestsData || []);
    } catch (err: any) {
      console.error('Error fetching asset data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load asset details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openNewRequestModal = (prefillAsset?: Asset, prefillType: AssetRequestType = 'HARDWARE_ISSUE') => {
    if (prefillAsset) {
      setFormData({
        title: `${requestTypeLabels[prefillType]}: ${prefillAsset.name} (${prefillAsset.assetCode})`,
        requestType: prefillType,
        category: prefillAsset.category,
        assetId: prefillAsset.id,
        priority: 'HIGH',
        description: '',
      });
    } else {
      setFormData({
        title: '',
        requestType: 'NEW_ASSET',
        category: 'LAPTOP',
        assetId: undefined,
        priority: 'MEDIUM',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please provide a title and detailed description for your request.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await assetService.createRequest({
        title: formData.title.trim(),
        requestType: formData.requestType,
        category: formData.category,
        assetId: formData.assetId ? Number(formData.assetId) : undefined,
        priority: formData.priority,
        description: formData.description.trim(),
      });

      setSuccessMessage('Asset ticket submitted successfully! IT Admin will review your request.');
      setIsModalOpen(false);
      fetchData();
      setActiveTab('requests');
      setTimeout(() => setSuccessMessage(null), 4500);
    } catch (err: any) {
      console.error('Error creating request:', err);
      setError(err.response?.data?.error || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge helpers
  const getStatusBadge = (status: AssetRequestStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Approved
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" /> In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-500" /> Resolved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-500" /> Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> Pending Review
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: AssetRequestPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">Medium</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">Low</span>;
    }
  };

  const getConditionBadge = (condition: AssetCondition) => {
    switch (condition) {
      case 'EXCELLENT':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">Excellent</span>;
      case 'GOOD':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 text-blue-800">Good</span>;
      case 'FAIR':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-800">Fair / Normal</span>;
      case 'DAMAGED':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">Damaged</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">{condition}</span>;
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.assetCode.toLowerCase().includes(query) ||
      asset.category.toLowerCase().includes(query) ||
      (asset.model && asset.model.toLowerCase().includes(query)) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(query))
    );
  });

  const filteredRequests = requests.filter((req) => {
    if (requestFilter !== 'ALL' && req.status !== requestFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.title.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query) ||
      req.requestType.toLowerCase().includes(query) ||
      req.category.toLowerCase().includes(query)
    );
  });

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  if (loading) {
    return <Loading fullScreen message="Loading your assigned assets and requests..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Workspace Inventory & Equipment</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-display">
            My Assigned Assets & Requests
          </h1>
          <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
            View company-issued laptops, displays, peripherals, or submit maintenance requests, repairs, and upgrade tickets.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition-all backdrop-blur-md border border-white/10 cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openNewRequestModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Raise Asset Ticket</span>
          </button>
        </div>
      </div>

      {/* ── Alerts & Notifications ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="flex-1 font-semibold">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Laptop className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Assigned Devices</p>
            <p className="text-2xl font-black text-slate-800">{assets.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Active equipment in your custody</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Pending Requests</p>
            <p className="text-2xl font-black text-slate-800">{pendingRequestsCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Awaiting IT Admin review</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Tickets</p>
            <p className="text-2xl font-black text-slate-800">{requests.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">All requests & tickets raised</p>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Assigned Hardware ({assets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>My Requests & Tickets ({requests.length})</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'assigned' ? 'Search devices...' : 'Search tickets...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48 sm:w-60"
            />
          </div>

          {activeTab === 'requests' && (
            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}
        </div>
      </div>

      {/* ── TAB 1: Assigned Assets Grid ── */}
      {activeTab === 'assigned' && (
        <>
          {filteredAssets.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                <Laptop className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Assigned Equipment Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'No devices matched your search query.'
                  : 'You do not have any company-assigned hardware currently. Need a laptop, monitor, or accessories?'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => openNewRequestModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Request Equipment</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all hover:border-indigo-200 flex flex-col justify-between space-y-4 relative group"
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {categoryIcons[asset.category] || <Laptop className="h-5 w-5 text-indigo-600" />}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            {categoryLabels[asset.category] || asset.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {asset.name}
                          </h3>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {asset.assetCode}
                      </span>
                    </div>

                    {/* Spec details */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2 text-xs">
                      {asset.model && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-slate-400 font-medium">Model:</span>
                          <span className="font-semibold text-slate-800">{asset.model}</span>
                        </div>
                      )}

                      {asset.serialNumber && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-slate-400 font-medium">Serial No:</span>
                          <span className="font-mono text-slate-800 font-semibold">{asset.serialNumber}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400 font-medium">Handover Date:</span>
                        <span className="font-medium text-slate-800">
                          {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : 'Active'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400 font-medium">Condition:</span>
                        {getConditionBadge(asset.condition)}
                      </div>
                    </div>

                    {asset.handoverNotes && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-2">
                        "{asset.handoverNotes}"
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openNewRequestModal(asset, 'HARDWARE_ISSUE')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Report Issue</span>
                    </button>
                    <button
                      onClick={() => openNewRequestModal(asset, 'RETURN_ASSET')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-colors cursor-pointer border border-transparent hover:border-indigo-200"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Return Handover</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: Asset Requests Table / History ── */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Wrench className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Asset Tickets Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || requestFilter !== 'ALL'
                  ? 'No tickets match the selected filters.'
                  : 'You have not submitted any equipment requests or repair tickets yet.'}
              </p>
              {!searchQuery && requestFilter === 'ALL' && (
                <button
                  onClick={() => openNewRequestModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Raise Asset Ticket</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Ticket Type & Category</th>
                    <th className="px-5 py-3.5">Title & Description</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Submitted</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Admin Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            {categoryIcons[req.category] || <Laptop className="h-4 w-4 text-indigo-600" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {requestTypeLabels[req.requestType] || req.requestType}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {categoryLabels[req.category] || req.category}
                              {req.asset && ` • ${req.asset.name} (${req.asset.assetCode})`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-bold text-slate-800 mb-0.5">{req.title}</p>
                        <p className="text-slate-600 whitespace-pre-line line-clamp-3 text-[11px]">
                          {req.description}
                        </p>
                      </td>

                      <td className="px-5 py-4">{getPriorityBadge(req.priority)}</td>

                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                        <span className="block text-[10px] text-slate-400">
                          {req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">{getStatusBadge(req.status)}</td>

                      <td className="px-5 py-4 max-w-xs">
                        {req.adminRemarks ? (
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                            <span className="font-semibold text-indigo-600 block text-[10px] uppercase">
                              IT Admin Note:
                            </span>
                            {req.adminRemarks}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No remarks yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Raise Asset Request / Report Issue ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Raise Asset Ticket</h3>
                  <p className="text-xs text-slate-400">Request new equipment or report maintenance issues</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ticket Subject / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Request for MacBook Pro M2 or Keyboard issue"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
                />
              </div>

              {/* Request Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ticket / Request Type</label>
                <select
                  value={formData.requestType}
                  onChange={(e) => setFormData({ ...formData, requestType: e.target.value as AssetRequestType })}
                  className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
                >
                  <option value="NEW_ASSET">Request New Equipment</option>
                  <option value="HARDWARE_ISSUE">Report Malfunction / Hardware Issue</option>
                  <option value="REPAIR_REPLACEMENT">Request Repair / Replacement</option>
                  <option value="RETURN_ASSET">Return Equipment to Office</option>
                </select>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Asset Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
                  >
                    <option value="LAPTOP">Laptop & Notebook</option>
                    <option value="MONITOR">Monitor / Display</option>
                    <option value="ACCESS_CARD">Access Card / Key</option>
                    <option value="PERIPHERAL">Mouse / Keyboard / Accessories</option>
                    <option value="MOBILE">Mobile Phone / Device</option>
                    <option value="FURNITURE">Office Chair / Desk</option>
                    <option value="OTHER">Other Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as AssetRequestPriority })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Blocker)</option>
                  </select>
                </div>
              </div>

              {/* Target Asset if repairing or replacing */}
              {assets.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Link to Assigned Device <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={formData.assetId || ''}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
                  >
                    <option value="">-- None / General Request --</option>
                    {assets.map((ast) => (
                      <option key={ast.id} value={ast.id}>
                        {ast.name} ({ast.assetCode}) - {categoryLabels[ast.category] || ast.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Description / Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why you require this asset or describe the hardware defect in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium resize-none"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAssets;
