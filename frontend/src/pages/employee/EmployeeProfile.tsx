import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { employeeService } from '../../services/employeeService';
import Loading from '../../components/Loading';
import {
  User as UserIcon,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  X,
  Laptop,
  Shield
} from 'lucide-react';
import { EmployeeProfileInfo } from '../../types/employee';

type SubTab = 'personal' | 'accounts' | 'family' | 'employment' | 'assets';

const defaultProfileData: EmployeeProfileInfo = {
  bloodGroup: '—',
  dob: '—',
  nationality: '—',
  maritalStatus: '—',
  marriageDate: '—',
  spouse: '—',
  placeOfBirth: '—',
  residentialStatus: '—',
  fatherName: '—',
  religion: '—',
  physicallyChallenged: 'No',
  internationalEmployee: 'No',
  height: '—',
  weight: '—',
  identificationMark: '—',

  presentAddress: '—',
  permanentAddress: '—',

  educationDegree: '—',
  educationInstitution: '—',
  educationYear: '—',
  educationStatus: '—',

  bankName: '—',
  accountNumber: '—',
  ifscCode: '—',
  accountType: 'Savings',
  branch: '—',
  panNumber: '—',
  pfNumber: '—',
  uanNumber: '—',
  esiNumber: '—',

  fatherDob: '—',
  fatherBloodGroup: '—',
  fatherGender: 'Male',
  fatherNationality: '—',
  nominationDetails: '—',

  costCenter: '—',
  department: '—',
  designation: '—',
  division: '—',
  grade: '—',
  location: '—',
  reportingTo: '—',
  extension: '—',

  laptopModel: '—',
  laptopTag: '—',
  rfidCardId: '—',
  assetStatus: 'Active',
};

const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active sub-tab in Employee Information
  const [activeTab, setActiveTab] = useState<SubTab>('personal');

  // Collapsible cards state
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    personal: true,
    address: true,
    education: true,
    father: true,
    mother: true,
    bankDetails: true,
    pfDetails: true,
    currentAssets: true,
  });

  // Masking toggles (eye icons)
  const [showPhone, setShowPhone] = useState(false);
  const [showBloodGroup, setShowBloodGroup] = useState(false);
  const [showDob, setShowDob] = useState(false);
  const [showBankAcc, setShowBankAcc] = useState(false);
  const [showPan, setShowPan] = useState(false);

  // Password reset modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals for Timeline & Resignation
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignSubmitted, setResignSubmitted] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const data = await employeeService.getById(user.id);
          setProfile(data);
        } catch (err: any) {
          console.error('Failed to load full profile:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const toggleCard = (cardKey: string) => {
    setOpenCards((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!password) {
      setErrorMsg('New password cannot be empty.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const targetId = profile?.id || user?.id;
      const res = await employeeService.resetPassword(targetId, password);
      if (res.success) {
        setSuccessMsg('Your login password has been changed successfully!');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setSuccessMsg(null);
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayUser = profile || user;

  if (loading && !displayUser) return <Loading fullScreen message="Loading employee information..." />;

  // Parse dynamic HRMS profileData if set by Admin
  let customData: Partial<EmployeeProfileInfo> = {};
  if (profile?.profileData) {
    try {
      customData = JSON.parse(profile.profileData);
    } catch (e) {
      console.error('Error parsing profileData:', e);
    }
  }

  const pInfo: EmployeeProfileInfo = {
    ...defaultProfileData,
    ...customData,
  };

  // Dynamic values
  const fullName = displayUser?.name || 'Sutharsan V';
  const employeeId = displayUser?.employeeCode || 'ECLDI4018';
  const email = displayUser?.email || 'sutharsanv2711@gmail.com';
  const rawPhone = displayUser?.phone || '9876547532';
  const maskedPhone = rawPhone.length > 4 ? `XXXXXX${rawPhone.slice(-4)}` : 'XXXXXX7532';

  const rawBankAcc = pInfo.accountNumber || '987654321098';
  const maskedBankAcc = rawBankAcc.length > 4 ? `XXXXXXXX${rawBankAcc.slice(-4)}` : 'XXXXXXXX1098';

  const rawPan = pInfo.panNumber || 'ABCDE1234F';
  const maskedPan = rawPan.length > 4 ? `XXXXX${rawPan.slice(-4)}` : 'XXXXX1234F';

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16 animate-slide">
      {/* ── Top Header Ribbon ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          {/* Teal Ribbon Icon */}
          <div className="h-6 w-5 rounded bg-emerald-500/90 transform rotate-12 flex items-center justify-center shadow-xs" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Employee Information</h1>
        </div>

        <button
          onClick={() => setShowPasswordModal(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <Lock className="h-3.5 w-3.5 text-slate-500" />
          Change Password
        </button>
      </div>

      {/* ── Main Layout: Inner Sidebar + Content Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* ── 1. Left Sub-Tabs Menu ── */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-1">
          <button
            onClick={() => setActiveTab('personal')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors text-left ${
              activeTab === 'personal'
                ? 'bg-slate-100/90 text-slate-900 font-bold border-l-4 border-slate-800'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Personal</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors text-left ${
              activeTab === 'accounts'
                ? 'bg-slate-100/90 text-slate-900 font-bold border-l-4 border-slate-800'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Accounts & Statutory</span>
          </button>

          <button
            onClick={() => setActiveTab('family')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors text-left ${
              activeTab === 'family'
                ? 'bg-slate-100/90 text-slate-900 font-bold border-l-4 border-slate-800'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Family</span>
          </button>

          <button
            onClick={() => setActiveTab('employment')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors text-left ${
              activeTab === 'employment'
                ? 'bg-slate-100/90 text-slate-900 font-bold border-l-4 border-slate-800'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Employment & Job</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors text-left ${
              activeTab === 'assets'
                ? 'bg-slate-100/90 text-slate-900 font-bold border-l-4 border-slate-800'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Assets</span>
          </button>
        </div>

        {/* ── 2. Content Pane Based on Tab ── */}
        <div className="lg:col-span-9 space-y-5">
          {/* ======================================================== */}
          {/* TAB 1: PERSONAL                                         */}
          {/* ======================================================== */}
          {activeTab === 'personal' && (
            <div className="space-y-5 animate-slide">
              {/* Jump To Bar */}
              <div className="flex items-center gap-2 text-xs py-1">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider">JUMP TO</span>
                <button
                  onClick={() => scrollToSection('sec-profile')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Profile
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => scrollToSection('sec-personal')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Personal
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => scrollToSection('sec-address')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Address
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => scrollToSection('sec-education')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Education
                </button>
              </div>

              {/* Top Profile Summary Card */}
              <div
                id="sec-profile"
                className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6"
              >
                {/* Silhouette Profile Avatar */}
                <div className="h-28 w-28 rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                  <UserIcon className="h-16 w-16 text-slate-500 stroke-[1.5]" />
                </div>

                {/* Details Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs w-full">
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Name</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{fullName}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Employee ID</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{employeeId}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Company Email</p>
                    <a
                      href={`mailto:${email}`}
                      className="text-sm font-semibold text-blue-600 hover:underline mt-0.5 block truncate"
                    >
                      {email}
                    </a>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Location</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.location || 'Coimbatore'}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Primary Contact No.</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-medium text-slate-700">
                        {showPhone ? rawPhone : maskedPhone}
                      </span>
                      <button
                        onClick={() => setShowPhone(!showPhone)}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-0.5"
                        title={showPhone ? 'Mask Phone' : 'Show Phone'}
                      >
                        {showPhone ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Extension</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.extension || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: PERSONAL (Collapsible) */}
              <div
                id="sec-personal"
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">PERSONAL</span>
                  <button
                    onClick={() => toggleCard('personal')}
                    className="h-6 w-6 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                  >
                    {openCards.personal ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {openCards.personal && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 text-xs animate-slide">
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Blood Group</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-medium text-slate-800">
                          {showBloodGroup ? (pInfo.bloodGroup || 'O +ve') : 'XXXXX'}
                        </span>
                        <button
                          onClick={() => setShowBloodGroup(!showBloodGroup)}
                          className="text-blue-500 hover:text-blue-700 p-0.5"
                        >
                          {showBloodGroup ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Date of Birth</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-medium text-slate-800">
                          {showDob ? (pInfo.dob || '15 Nov 2003') : 'XX XXX 2003'}
                        </span>
                        <button
                          onClick={() => setShowDob(!showDob)}
                          className="text-blue-500 hover:text-blue-700 p-0.5"
                        >
                          {showDob ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Nationality</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.nationality || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Marital Status</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.maritalStatus || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Marriage Date</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.marriageDate || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Spouse</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.spouse || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Place of Birth</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.placeOfBirth || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Residential Status</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.residentialStatus || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Father Name</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.fatherName || 'Vanarajan R'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Religion</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.religion || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Physically Challenged</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.physicallyChallenged || 'No'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">International Employee</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.internationalEmployee || 'No'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Height</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.height || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Weight</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.weight || '—'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Identification Mark</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.identificationMark || '—'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: ADDRESS (Collapsible) */}
              <div
                id="sec-address"
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">ADDRESS</span>
                  <button
                    onClick={() => toggleCard('address')}
                    className="h-6 w-6 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                  >
                    {openCards.address ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {openCards.address && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs animate-slide">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Present Address
                      </p>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                        {pInfo.presentAddress || '12/4, Gandhi Street, Peelamedu, Coimbatore, Tamil Nadu, 641004'}
                      </p>
                      <p className="text-[11px] text-slate-400">Country: India</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Permanent Address
                      </p>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                        {pInfo.permanentAddress || '12/4, Gandhi Street, Peelamedu, Coimbatore, Tamil Nadu, 641004'}
                      </p>
                      <p className="text-[11px] text-slate-400">Country: India</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: EDUCATION (Collapsible) */}
              <div
                id="sec-education"
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">EDUCATION</span>
                  <button
                    onClick={() => toggleCard('education')}
                    className="h-6 w-6 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                  >
                    {openCards.education ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {openCards.education && (
                  <div className="p-6 text-xs space-y-3 animate-slide">
                    <div className="p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {pInfo.educationDegree || 'B.E. Computer Science and Engineering'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {pInfo.educationInstitution || 'Anna University Affiliated Institution'} • Graduated {pInfo.educationYear || '2024'}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                        {pInfo.educationStatus || 'Verified'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ACCOUNTS & STATUTORY                             */}
          {/* ======================================================== */}
          {activeTab === 'accounts' && (
            <div className="space-y-5 animate-slide">
              <div className="flex items-center gap-2 pb-1 border-l-4 border-slate-800 pl-3">
                <h2 className="text-base font-bold text-slate-800">Accounts & Statutory</h2>
              </div>

              {/* Bank Details Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">BANK DETAILS</span>
                  <button
                    onClick={() => toggleCard('bankDetails')}
                    className="h-6 w-6 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                  >
                    {openCards.bankDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {openCards.bankDetails && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 text-xs animate-slide">
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Bank Name</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{pInfo.bankName || 'State Bank of India'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Account Number</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-semibold text-slate-800">
                          {showBankAcc ? rawBankAcc : maskedBankAcc}
                        </span>
                        <button
                          onClick={() => setShowBankAcc(!showBankAcc)}
                          className="text-blue-500 hover:text-blue-700 p-0.5"
                        >
                          {showBankAcc ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">IFSC Code</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.ifscCode || 'SBIN0001234'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Account Type</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.accountType || 'Savings'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Branch</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.branch || 'Peelamedu, Coimbatore'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Statutory Info Card (PAN, PF, UAN) */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">STATUTORY DETAILS</span>
                  <button
                    onClick={() => toggleCard('pfDetails')}
                    className="h-6 w-6 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                  >
                    {openCards.pfDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {openCards.pfDetails && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 text-xs animate-slide">
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">PAN Number</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-semibold text-slate-800">
                          {showPan ? rawPan : maskedPan}
                        </span>
                        <button
                          onClick={() => setShowPan(!showPan)}
                          className="text-blue-500 hover:text-blue-700 p-0.5"
                        >
                          {showPan ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">PF Number</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.pfNumber || 'TN/CBE/1029384/000'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">UAN Number</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.uanNumber || '101293847561'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">ESI Number</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.esiNumber || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FAMILY                                           */}
          {/* ======================================================== */}
          {activeTab === 'family' && (
            <div className="space-y-5 animate-slide">
              <div className="flex items-center gap-2 text-xs py-1">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider">JUMP TO</span>
                <button
                  onClick={() => scrollToSection('sec-father')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Father
                </button>
              </div>

              {/* FATHER Card */}
              <div
                id="sec-father"
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">FATHER</span>
                  <button
                    onClick={() => toggleCard('father')}
                    className="h-6 w-6 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                  >
                    {openCards.father ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {openCards.father && (
                  <div className="p-6 space-y-6 animate-slide">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 text-xs">
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Name</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{pInfo.fatherName || 'Vanarajan R'}</p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Date of Birth</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.fatherDob || '—'}</p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Blood Group</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.fatherBloodGroup || '—'}</p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Gender</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.fatherGender || 'Male'}</p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Nationality</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{pInfo.fatherNationality || '—'}</p>
                      </div>
                    </div>

                    {/* Nomination block */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NOMINATION</p>
                      <p className="text-xs text-slate-500">{pInfo.nominationDetails || 'No data Found.'}</p>
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-400">Additional</span>
                        <button className="text-blue-600 hover:underline font-semibold cursor-pointer">
                          See details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: EMPLOYMENT & JOB                                  */}
          {/* ======================================================== */}
          {activeTab === 'employment' && (
            <div className="space-y-5 animate-slide">
              <div className="flex items-center gap-2 text-xs py-1">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider">Jump to:</span>
                <button
                  onClick={() => scrollToSection('sec-current-position')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Current Position
                </button>
              </div>

              <div className="flex items-center gap-2 pb-1 border-l-4 border-slate-800 pl-3">
                <h2 className="text-base font-bold text-slate-800">Employment & Job</h2>
              </div>

              {/* Current Position Card */}
              <div
                id="sec-current-position"
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                {/* Beige / Cream Header Bar */}
                <div className="flex items-center justify-between px-6 py-3.5 bg-[#fdf8f3] border-b border-orange-100/60">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Current Position</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowResignModal(true)}
                      className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Resign
                    </button>
                    <button
                      onClick={() => setShowTimelineModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      View Timeline
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Cost Center</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.costCenter || 'NA'}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Department</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{pInfo.department || 'IT Divisions'}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Designation</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{pInfo.designation || 'Intern'}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Division</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.division || 'Coimbatore'}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Grade</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.grade || 'NA'}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Location</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.location || 'Coimbatore'}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Reporting To</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{pInfo.reportingTo || 'NA'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ASSETS                                           */}
          {/* ======================================================== */}
          {activeTab === 'assets' && (
            <div className="space-y-5 animate-slide">
              <div className="flex items-center gap-2 pb-1 border-l-4 border-slate-800 pl-3">
                <h2 className="text-base font-bold text-slate-800">Company Assets</h2>
              </div>

              {/* Assets Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">ALLOCATED ASSETS</span>
                  <button
                    onClick={() => toggleCard('currentAssets')}
                    className="h-6 w-6 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                  >
                    {openCards.currentAssets ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {openCards.currentAssets && (
                  <div className="p-6 space-y-4 animate-slide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <Laptop className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{pInfo.laptopModel || 'Dell Latitude 5420'}</p>
                          <p className="text-[11px] text-slate-400">Tag: {pInfo.laptopTag || 'EC-LAP-2024-4018'}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {pInfo.assetStatus || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Smart Access Card (RFID)</p>
                          <p className="text-[11px] text-slate-400">ID: {pInfo.rfidCardId || 'AC-CBE-0418'}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {pInfo.assetStatus || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Change Password ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-slide">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Update Login Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
                >
                  {passwordLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Timeline ── */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-slide">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Employment Timeline</h3>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 py-2 text-xs">
              <div className="flex gap-3 relative before:absolute before:left-3 before:top-3 before:bottom-0 before:w-0.5 before:bg-blue-200">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10 text-[10px] font-bold">
                  1
                </div>
                <div className="space-y-0.5 pb-4">
                  <p className="font-bold text-slate-800">Joined as {pInfo.designation || 'Intern'}</p>
                  <p className="text-slate-500 text-[11px]">{pInfo.department || 'IT Divisions'} • {pInfo.location || 'Coimbatore'}</p>
                  <span className="inline-block text-[10px] font-semibold text-blue-600">Jan 2026 - Present</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowTimelineModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Resign Request ── */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-slide">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Submit Resignation Request</h3>
              <button
                onClick={() => {
                  setShowResignModal(false);
                  setResignSubmitted(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resignSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2 text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-emerald-800 text-sm">Resignation Workflow Initiated</p>
                <p className="text-emerald-700">
                  Your request has been routed to HR and your reporting manager.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Are you sure you wish to initiate the separation / resignation workflow?
                </p>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                    Reason for leaving (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide brief reason..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowResignModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setResignSubmitted(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                  >
                    Confirm Resignation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
