import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import { attendanceService } from '../../services/attendanceService';
import { Employee, EmployeeProfileInfo } from '../../types/employee';
import { Attendance } from '../../types/attendance';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  UserPlus,
  Edit2,
  ShieldAlert,
  KeyRound,
  CalendarDays,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  X,
  Briefcase,
  User as UserIcon,
  MapPin,
  GraduationCap,
  Landmark,
  Users as UsersIcon,
  Laptop,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Code2,
} from 'lucide-react';

const defaultProfileData: EmployeeProfileInfo = {
  bloodGroup: 'O +ve',
  dob: '2003-11-15',
  nationality: 'Indian',
  maritalStatus: 'Single',
  marriageDate: '',
  spouse: '',
  placeOfBirth: 'Coimbatore',
  residentialStatus: 'Resident Indian',
  fatherName: 'Vanarajan R',
  religion: 'Hindu',
  physicallyChallenged: 'No',
  internationalEmployee: 'No',
  height: '175 cm',
  weight: '68 kg',
  identificationMark: 'Mole on right forearm',

  presentAddress: '12/4, Gandhi Street, Peelamedu, Coimbatore, Tamil Nadu, 641004',
  permanentAddress: '12/4, Gandhi Street, Peelamedu, Coimbatore, Tamil Nadu, 641004',

  educationDegree: 'B.E. Computer Science and Engineering',
  educationInstitution: 'Anna University Affiliated Institution',
  educationYear: '2024',
  educationStatus: 'Verified',

  bankName: 'State Bank of India',
  accountNumber: '987654321098',
  ifscCode: 'SBIN0001234',
  accountType: 'Savings',
  branch: 'Peelamedu, Coimbatore',
  panNumber: 'ABCDE1234F',
  pfNumber: 'TN/CBE/1029384/000',
  uanNumber: '101293847561',
  esiNumber: 'N/A',

  fatherDob: '1975-06-12',
  fatherBloodGroup: 'B +ve',
  fatherGender: 'Male',
  fatherNationality: 'Indian',
  nominationDetails: '100% Share - Primary Nominee',

  costCenter: 'NA',
  department: 'IT Divisions',
  designation: 'Intern',
  division: 'Coimbatore',
  grade: 'NA',
  location: 'Coimbatore',
  reportingTo: 'Engineering Manager',
  extension: '104',

  laptopModel: 'Dell Latitude 5420',
  laptopTag: 'EC-LAP-2024-4018',
  rfidCardId: 'AC-CBE-0418',
  assetStatus: 'Active',
};

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Basic Add/Edit Modal
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Full Profile Editor Modal
  const [showProfileEditor, setShowProfileEditor] = useState<boolean>(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [profileForm, setProfileForm] = useState<EmployeeProfileInfo>(defaultProfileData);
  const [profileActiveTab, setProfileActiveTab] = useState<string>('employment');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);
  
  // Password Reset Modal
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');

  // Attendance History Modal
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<Attendance[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Basic Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formDepartment, setFormDepartment] = useState<string>('IT');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal state
  const [deleteModalEmp, setDeleteModalEmp] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteEmployee = async () => {
    if (!deleteModalEmp) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await employeeService.delete(deleteModalEmp.id);
      setDeleteModalEmp(null);
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.message || 'Failed to delete employee account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch employee list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAddModal = () => {
    setSelectedEmployee(null);
    setFormCode('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormRole('EMPLOYEE');
    setFormStatus('ACTIVE');
    setFormDepartment('IT');
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormCode(emp.employeeCode);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormPassword('');
    setFormRole(emp.role);
    setFormStatus(emp.status);
    setFormDepartment(emp.department || 'IT');
    setFormError(null);
    setShowFormModal(true);
  };

  const openProfileEditor = (emp: Employee) => {
    setEditingEmp(emp);
    setProfileSaveSuccess(false);
    let parsed: any = {};
    if (emp.profileData) {
      try {
        parsed = JSON.parse(emp.profileData);
      } catch (e) {
        console.error('Failed to parse profileData:', e);
      }
    }
    setProfileForm({
      ...defaultProfileData,
      ...parsed,
      fatherName: parsed.fatherName || defaultProfileData.fatherName,
      location: parsed.location || 'Coimbatore',
    });
    setProfileActiveTab('employment');
    setShowProfileEditor(true);
  };

  const handleProfileFormChange = (field: keyof EmployeeProfileInfo, val: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    setProfileSaving(true);
    setProfileSaveSuccess(false);

    try {
      const serialized = JSON.stringify(profileForm);
      const payload = {
        employeeCode: editingEmp.employeeCode,
        name: editingEmp.name,
        email: editingEmp.email,
        phone: editingEmp.phone,
        role: editingEmp.role,
        status: editingEmp.status,
        profileData: serialized,
      };

      await employeeService.update(editingEmp.id, payload);
      setProfileSaveSuccess(true);
      fetchEmployees();
      setTimeout(() => {
        setProfileSaveSuccess(false);
        setShowProfileEditor(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update employee information.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      employeeCode: formCode,
      name: formName,
      email: formEmail,
      phone: formPhone,
      password: formPassword || undefined,
      department: formDepartment,
      role: formRole,
      status: formStatus,
    };

    try {
      if (selectedEmployee) {
        await employeeService.update(selectedEmployee.id, payload);
      } else {
        await employeeService.create(payload);
      }
      setShowFormModal(false);
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Save operation failed. Please check inputs.');
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await employeeService.toggleStatus(emp.id, nextStatus);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert('Failed to change status.');
    }
  };

  const openResetModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await employeeService.resetPassword(selectedEmployee.id, newPassword);
      setShowResetModal(false);
      alert('Password reset completed.');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Password reset failed.');
    }
  };

  const openHistoryModal = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const logs = await attendanceService.getEmployeeHistory(emp.id);
      setHistoryLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = [
    {
      header: 'Employee Code',
      render: (row: Employee) => <span className="font-bold text-slate-800">{row.employeeCode}</span>,
    },
    {
      header: 'Name',
      render: (row: Employee) => <span className="font-semibold text-slate-700">{row.name}</span>,
    },
    {
      header: 'Email',
      render: (row: Employee) => <span className="text-slate-500">{row.email}</span>,
    },
    {
      header: 'Phone',
      render: (row: Employee) => <span className="text-slate-500">{row.phone || '--'}</span>,
    },
    {
      header: 'Team / Shift',
      render: (row: Employee) => {
        let dept = row.department;
        if (!dept && row.profileData) {
          if (row.profileData.toLowerCase().includes('edtech')) dept = 'EDTECH';
          else if (row.profileData.toLowerCase().includes('business')) dept = 'BUSINESS_SOLUTION';
        }
        dept = dept || 'IT';

        if (dept.toUpperCase() === 'EDTECH') {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>EdTech (8:45-5:45)</span>
            </span>
          );
        }
        if (dept.toUpperCase() === 'BUSINESS_SOLUTION' || dept.toUpperCase() === 'BUSINESS') {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Business (8:45-5:45)</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Code2 className="h-3.5 w-3.5" />
            <span>IT (9:00-6:30)</span>
          </span>
        );
      },
    },
    {
      header: 'Role',
      render: (row: Employee) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
          row.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row: Employee) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
          row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {row.status === 'ACTIVE' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row: Employee) => (
        <div className="flex items-center gap-1.5">
          {/* Edit Complete Profile Information */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => openProfileEditor(row)}
            className="py-1 px-2.5 text-xs font-bold flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-xs"
            title="Edit Full Employee Information (greytHR details)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Info</span>
          </Button>

          {/* Quick Edit Settings */}
          <Button variant="outline" size="sm" onClick={() => openEditModal(row)} title="Edit basic account settings">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>

          {/* Status Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(row)}
            className={row.status === 'ACTIVE' ? 'hover:bg-rose-50 text-rose-600' : 'hover:bg-emerald-50 text-emerald-600'}
            title={row.status === 'ACTIVE' ? 'Deactivate account' : 'Activate account'}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
          </Button>

          {/* Reset Password */}
          <Button variant="outline" size="sm" onClick={() => openResetModal(row)} title="Reset password">
            <KeyRound className="h-3.5 w-3.5" />
          </Button>

          {/* View Attendance */}
          <Button variant="outline" size="sm" onClick={() => openHistoryModal(row)} title="View attendance history">
            <CalendarDays className="h-3.5 w-3.5" />
          </Button>

          {/* Delete Employee */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDeleteModalEmp(row);
              setDeleteError(null);
            }}
            className="hover:bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-300 transition-colors cursor-pointer"
            title="Delete Employee"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading fullScreen message="Loading employees profiles..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
            Employees Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage employee accounts, fill detailed HRMS profile information, and track records
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openAddModal} className="font-bold py-2.5 rounded-xl">
          <UserPlus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : (
        <Card>
          <Table data={employees} columns={columns} keyExtractor={(row) => row.id} />
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FULL EMPLOYEE INFORMATION EDITOR MODAL (ADMIN ONLY)            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showProfileEditor && editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    Edit Employee Information — {editingEmp.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Code: <span className="font-bold text-slate-700">{editingEmp.employeeCode}</span> • Email: {editingEmp.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowProfileEditor(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notification alert */}
            {profileSaveSuccess && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 animate-slide">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Employee information updated successfully! Changes are live on the employee portal.</span>
              </div>
            )}

            {/* Modal Body with Left Tabs and Right Form */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              {/* Section Tabs */}
              <div className="md:col-span-3 border-r border-slate-100 bg-slate-50/50 p-3 space-y-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setProfileActiveTab('employment')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors ${
                    profileActiveTab === 'employment'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span>Employment & Job</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileActiveTab('personal')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors ${
                    profileActiveTab === 'personal'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserIcon className="h-4 w-4 shrink-0" />
                  <span>Personal Info</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileActiveTab('address')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors ${
                    profileActiveTab === 'address'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>Address</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileActiveTab('education')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors ${
                    profileActiveTab === 'education'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>Education</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileActiveTab('accounts')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors ${
                    profileActiveTab === 'accounts'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Landmark className="h-4 w-4 shrink-0" />
                  <span>Accounts & Statutory</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileActiveTab('family')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors ${
                    profileActiveTab === 'family'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UsersIcon className="h-4 w-4 shrink-0" />
                  <span>Family Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileActiveTab('assets')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors ${
                    profileActiveTab === 'assets'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Laptop className="h-4 w-4 shrink-0" />
                  <span>Company Assets</span>
                </button>
              </div>

              {/* Form Input Fields */}
              <div className="md:col-span-9 p-6 overflow-y-auto max-h-[60vh]">
                <form id="profileForm" onSubmit={handleSaveProfileData} className="space-y-4">
                  {/* 1. EMPLOYMENT & JOB */}
                  {profileActiveTab === 'employment' && (
                    <div className="space-y-4 animate-slide">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Current Position & Department
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Designation</label>
                          <input
                            type="text"
                            value={profileForm.designation || ''}
                            onChange={(e) => handleProfileFormChange('designation', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Intern / Software Engineer"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Department</label>
                          <input
                            type="text"
                            value={profileForm.department || ''}
                            onChange={(e) => handleProfileFormChange('department', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. IT Divisions"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Division</label>
                          <input
                            type="text"
                            value={profileForm.division || ''}
                            onChange={(e) => handleProfileFormChange('division', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Coimbatore"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Location</label>
                          <input
                            type="text"
                            value={profileForm.location || ''}
                            onChange={(e) => handleProfileFormChange('location', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Coimbatore"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Cost Center</label>
                          <input
                            type="text"
                            value={profileForm.costCenter || ''}
                            onChange={(e) => handleProfileFormChange('costCenter', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. NA / CC-01"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Grade</label>
                          <input
                            type="text"
                            value={profileForm.grade || ''}
                            onChange={(e) => handleProfileFormChange('grade', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. NA / L1 / L2"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Reporting To</label>
                          <input
                            type="text"
                            value={profileForm.reportingTo || ''}
                            onChange={(e) => handleProfileFormChange('reportingTo', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Engineering Manager"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Extension</label>
                          <input
                            type="text"
                            value={profileForm.extension || ''}
                            onChange={(e) => handleProfileFormChange('extension', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 104"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. PERSONAL */}
                  {profileActiveTab === 'personal' && (
                    <div className="space-y-4 animate-slide">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Personal Background Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Blood Group</label>
                          <input
                            type="text"
                            value={profileForm.bloodGroup || ''}
                            onChange={(e) => handleProfileFormChange('bloodGroup', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. O +ve"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Date of Birth</label>
                          <input
                            type="text"
                            value={profileForm.dob || ''}
                            onChange={(e) => handleProfileFormChange('dob', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 15 Nov 2003"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Father Name</label>
                          <input
                            type="text"
                            value={profileForm.fatherName || ''}
                            onChange={(e) => handleProfileFormChange('fatherName', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Vanarajan R"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Nationality</label>
                          <input
                            type="text"
                            value={profileForm.nationality || ''}
                            onChange={(e) => handleProfileFormChange('nationality', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Indian"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Marital Status</label>
                          <input
                            type="text"
                            value={profileForm.maritalStatus || ''}
                            onChange={(e) => handleProfileFormChange('maritalStatus', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Single / Married"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Place of Birth</label>
                          <input
                            type="text"
                            value={profileForm.placeOfBirth || ''}
                            onChange={(e) => handleProfileFormChange('placeOfBirth', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Coimbatore"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Residential Status</label>
                          <input
                            type="text"
                            value={profileForm.residentialStatus || ''}
                            onChange={(e) => handleProfileFormChange('residentialStatus', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Resident Indian"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Physically Challenged</label>
                          <select
                            value={profileForm.physicallyChallenged || 'No'}
                            onChange={(e) => handleProfileFormChange('physicallyChallenged', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600 bg-white"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">International Employee</label>
                          <select
                            value={profileForm.internationalEmployee || 'No'}
                            onChange={(e) => handleProfileFormChange('internationalEmployee', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600 bg-white"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Height</label>
                          <input
                            type="text"
                            value={profileForm.height || ''}
                            onChange={(e) => handleProfileFormChange('height', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 175 cm"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Weight</label>
                          <input
                            type="text"
                            value={profileForm.weight || ''}
                            onChange={(e) => handleProfileFormChange('weight', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 68 kg"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Identification Mark</label>
                          <input
                            type="text"
                            value={profileForm.identificationMark || ''}
                            onChange={(e) => handleProfileFormChange('identificationMark', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Mole on right forearm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. ADDRESS */}
                  {profileActiveTab === 'address' && (
                    <div className="space-y-4 animate-slide">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Address Coordinates
                      </h3>
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Present Address</label>
                          <textarea
                            rows={3}
                            value={profileForm.presentAddress || ''}
                            onChange={(e) => handleProfileFormChange('presentAddress', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="Door No, Street, Locality, City, State, PIN"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Permanent Address</label>
                          <textarea
                            rows={3}
                            value={profileForm.permanentAddress || ''}
                            onChange={(e) => handleProfileFormChange('permanentAddress', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="Door No, Street, Locality, City, State, PIN"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. EDUCATION */}
                  {profileActiveTab === 'education' && (
                    <div className="space-y-4 animate-slide">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Education & Qualifications
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Degree / Qualification</label>
                          <input
                            type="text"
                            value={profileForm.educationDegree || ''}
                            onChange={(e) => handleProfileFormChange('educationDegree', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. B.E. Computer Science and Engineering"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Institution / University</label>
                          <input
                            type="text"
                            value={profileForm.educationInstitution || ''}
                            onChange={(e) => handleProfileFormChange('educationInstitution', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Anna University Affiliated Institution"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Year of Graduation</label>
                          <input
                            type="text"
                            value={profileForm.educationYear || ''}
                            onChange={(e) => handleProfileFormChange('educationYear', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 2024"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Status</label>
                          <input
                            type="text"
                            value={profileForm.educationStatus || 'Verified'}
                            onChange={(e) => handleProfileFormChange('educationStatus', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Verified"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. ACCOUNTS & STATUTORY */}
                  {profileActiveTab === 'accounts' && (
                    <div className="space-y-4 animate-slide">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Banking & Statutory Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={profileForm.bankName || ''}
                            onChange={(e) => handleProfileFormChange('bankName', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. State Bank of India"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Account Number</label>
                          <input
                            type="text"
                            value={profileForm.accountNumber || ''}
                            onChange={(e) => handleProfileFormChange('accountNumber', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 987654321098"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">IFSC Code</label>
                          <input
                            type="text"
                            value={profileForm.ifscCode || ''}
                            onChange={(e) => handleProfileFormChange('ifscCode', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. SBIN0001234"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Branch</label>
                          <input
                            type="text"
                            value={profileForm.branch || ''}
                            onChange={(e) => handleProfileFormChange('branch', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Peelamedu, Coimbatore"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">PAN Number</label>
                          <input
                            type="text"
                            value={profileForm.panNumber || ''}
                            onChange={(e) => handleProfileFormChange('panNumber', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. ABCDE1234F"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">PF Number</label>
                          <input
                            type="text"
                            value={profileForm.pfNumber || ''}
                            onChange={(e) => handleProfileFormChange('pfNumber', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. TN/CBE/1029384/000"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">UAN Number</label>
                          <input
                            type="text"
                            value={profileForm.uanNumber || ''}
                            onChange={(e) => handleProfileFormChange('uanNumber', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 101293847561"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">ESI Number</label>
                          <input
                            type="text"
                            value={profileForm.esiNumber || ''}
                            onChange={(e) => handleProfileFormChange('esiNumber', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. N/A"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. FAMILY */}
                  {profileActiveTab === 'family' && (
                    <div className="space-y-4 animate-slide">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Family & Nomination
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Father's Name</label>
                          <input
                            type="text"
                            value={profileForm.fatherName || ''}
                            onChange={(e) => handleProfileFormChange('fatherName', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Vanarajan R"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Father's DOB</label>
                          <input
                            type="text"
                            value={profileForm.fatherDob || ''}
                            onChange={(e) => handleProfileFormChange('fatherDob', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 1975-06-12"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Father's Blood Group</label>
                          <input
                            type="text"
                            value={profileForm.fatherBloodGroup || ''}
                            onChange={(e) => handleProfileFormChange('fatherBloodGroup', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. B +ve"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Father's Gender</label>
                          <input
                            type="text"
                            value={profileForm.fatherGender || 'Male'}
                            onChange={(e) => handleProfileFormChange('fatherGender', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Male"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="font-semibold text-slate-700 block mb-1">Nomination Share & Details</label>
                          <input
                            type="text"
                            value={profileForm.nominationDetails || ''}
                            onChange={(e) => handleProfileFormChange('nominationDetails', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. 100% Share - Primary Nominee"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. ASSETS */}
                  {profileActiveTab === 'assets' && (
                    <div className="space-y-4 animate-slide">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Allocated Devices & Assets
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Laptop Model</label>
                          <input
                            type="text"
                            value={profileForm.laptopModel || ''}
                            onChange={(e) => handleProfileFormChange('laptopModel', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. Dell Latitude 5420"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Laptop Asset Tag</label>
                          <input
                            type="text"
                            value={profileForm.laptopTag || ''}
                            onChange={(e) => handleProfileFormChange('laptopTag', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. EC-LAP-2024-4018"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Smart RFID Access Card ID</label>
                          <input
                            type="text"
                            value={profileForm.rfidCardId || ''}
                            onChange={(e) => handleProfileFormChange('rfidCardId', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                            placeholder="e.g. AC-CBE-0418"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Asset Status</label>
                          <select
                            value={profileForm.assetStatus || 'Active'}
                            onChange={(e) => handleProfileFormChange('assetStatus', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600 bg-white"
                          >
                            <option value="Active">Active</option>
                            <option value="Returned">Returned</option>
                            <option value="Under Repair">Under Repair</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
              <span className="text-xs text-slate-400 font-medium">
                Admin updates are synced with employee profile immediately.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileEditor(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="profileForm"
                  disabled={profileSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  {profileSaving ? 'Saving Changes...' : 'Save Employee Information'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BASIC ADD / EDIT MODAL                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card
            title={selectedEmployee ? 'Update Employee Settings' : 'Create New Employee'}
            className="w-full max-w-lg shadow-2xl bg-white"
          >
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-semibold text-rose-800">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                    placeholder="e.g. EMP001"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              {!selectedEmployee && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                    placeholder="Set temporary password"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Team / Shift</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="IT">IT Team (09:00 AM - 06:30 PM)</option>
                    <option value="EDTECH">EdTech Team (08:45 AM - 05:45 PM)</option>
                    <option value="BUSINESS_SOLUTION">Business Solution (08:45 AM - 05:45 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Account Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600 bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowFormModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {selectedEmployee ? 'Save Settings' : 'Create Employee'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RESET PASSWORD MODAL                                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card title={`Reset Password: ${selectedEmployee?.name}`} className="w-full max-w-sm shadow-2xl bg-white">
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-600"
                  placeholder="Enter new password"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowResetModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Apply Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ATTENDANCE HISTORY LOGS MODAL                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card
            title={`Attendance History: ${selectedEmployee?.name} (${selectedEmployee?.employeeCode})`}
            className="w-full max-w-3xl shadow-2xl bg-white max-h-[85vh] flex flex-col"
          >
            <div className="flex-1 overflow-y-auto my-2">
              {historyLoading ? (
                <div className="p-8 text-center text-slate-400">Loading punch logs...</div>
              ) : historyLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No punch records found for this employee.</div>
              ) : (
                <Table
                  data={historyLogs}
                  keyExtractor={(r) => r.id}
                  columns={[
                    { header: 'Date', render: (r: Attendance) => formatDate(r.attendanceDate) },
                    { header: 'Check In', render: (r: Attendance) => r.loginTime ? formatTime(r.loginTime) : '--' },
                    { header: 'Check Out', render: (r: Attendance) => r.logoutTime ? formatTime(r.logoutTime) : '--' },
                    {
                      header: 'Working Hours',
                      render: (r: Attendance) => {
                        if (!r.loginTime || !r.logoutTime) return '--';
                        try {
                          const diff = new Date(r.logoutTime).getTime() - new Date(r.loginTime).getTime();
                          if (diff <= 0) return '--';
                          const h = Math.floor(diff / (1000 * 60 * 60));
                          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        } catch {
                          return '--';
                        }
                      },
                    },
                    {
                      header: 'Status',
                      render: (r: Attendance) => {
                        if (r.timingStatus === 'LEAVE') {
                          return <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 border border-rose-200">Leave</span>;
                        }
                        if (r.timingStatus === 'PERMISSION') {
                          return <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 border border-indigo-200">Permission</span>;
                        }
                        if (r.timingStatus === 'LATE') {
                          return <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">Late</span>;
                        }
                        if (r.status === 'LOGGED_IN') {
                          return <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600 border border-blue-200">Working</span>;
                        }
                        if (r.status === 'COMPLETED') {
                          return <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-200">Present</span>;
                        }
                        return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{r.status}</span>;
                      },
                    },
                    {
                      header: 'Distance (GPS)',
                      render: (r: Attendance) => (
                        <span className="text-slate-500 font-medium">
                          {r.loginDistance != null ? `${r.loginDistance.toFixed(1)}m` : '--'}
                        </span>
                      ),
                    },
                  ]}
                />
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowHistoryModal(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DELETE EMPLOYEE CONFIRMATION MODAL                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {deleteModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Employee Account</h3>
                <p className="text-xs text-slate-400">Permanently remove employee records</p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="my-5 space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Employee Name:</span>
                  <span className="font-bold text-slate-800">{deleteModalEmp.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Employee Code:</span>
                  <span className="font-mono font-bold text-slate-800">{deleteModalEmp.employeeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Email:</span>
                  <span className="text-slate-700">{deleteModalEmp.email}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-rose-900 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Warning:</strong> This action cannot be undone. All attendance punches, leave history, permission logs, and quota balances belonging to this employee will also be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalEmp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteEmployee}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {deleteLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
