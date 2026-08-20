import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import { attendanceService } from '../../services/attendanceService';
import { Employee } from '../../types/employee';
import { Attendance } from '../../types/attendance';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import { UserPlus, Edit2, ShieldAlert, KeyRound, CalendarDays, CheckCircle, XCircle } from 'lucide-react';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<Attendance[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormCode(emp.employeeCode);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormPassword(''); // blank unless updating
    setFormRole(emp.role);
    setFormStatus(emp.status);
    setFormError(null);
    setShowFormModal(true);
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditModal(row)} title="Edit details">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(row)}
            className={row.status === 'ACTIVE' ? 'hover:bg-rose-50 text-rose-600' : 'hover:bg-emerald-50 text-emerald-600'}
            title={row.status === 'ACTIVE' ? 'Deactivate account' : 'Activate account'}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => openResetModal(row)} title="Reset password">
            <KeyRound className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => openHistoryModal(row)} title="View attendance history">
            <CalendarDays className="h-3.5 w-3.5" />
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
          <p className="text-sm text-slate-400">Add, edit, deactivate, and track attendance history of users</p>
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

      {/* Add / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card
            title={selectedEmployee ? 'Update Employee Settings' : 'Create New Employee'}
            className="w-full max-w-lg shadow-2xl bg-white"
            action={
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            }
          >
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP102"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Smith"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alice@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Password field only shown for new employees, optional for edit updates */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  Password {selectedEmployee && <span className="text-[9px] text-slate-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!selectedEmployee}
                  placeholder="Min 6 characters"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                    Access Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowFormModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card
            title={`Reset Password for ${selectedEmployee.name}`}
            className="w-full max-w-sm shadow-2xl bg-white"
            action={<button onClick={() => setShowResetModal(false)}>✕</button>}
          >
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowResetModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" type="submit">
                  Confirm Reset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* View History Modal */}
      {showHistoryModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-5 right-6 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-2">
              Attendance History: {selectedEmployee.name}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Reviewing logged data for {selectedEmployee.employeeCode} ({selectedEmployee.email})
            </p>

            {historyLoading ? (
              <Loading message="Loading logs..." />
            ) : (
              <Table
                data={historyLogs}
                keyExtractor={(row) => row.id}
                emptyMessage="No history logs recorded for this employee."
                columns={[
                  {
                    header: 'Date',
                    render: (row) => <span className="font-bold text-slate-800">{formatDate(row.attendanceDate)}</span>,
                  },
                  {
                    header: 'Login Time',
                    render: (row) => <span>{row.loginTime ? formatTime(row.loginTime) : '--'}</span>,
                  },
                  {
                    header: 'Login Distance',
                    render: (row) => (
                      <span className="text-xs text-slate-500">
                        {row.loginDistance !== null && row.loginDistance !== undefined ? `${row.loginDistance.toFixed(1)}m` : '--'}
                      </span>
                    ),
                  },
                  {
                    header: 'Logout Time',
                    render: (row) => <span>{row.logoutTime ? formatTime(row.logoutTime) : '--'}</span>,
                  },
                  {
                    header: 'Logout Distance',
                    render: (row) => (
                      <span className="text-xs text-slate-500">
                        {row.logoutDistance !== null && row.logoutDistance !== undefined ? `${row.logoutDistance.toFixed(1)}m` : '--'}
                      </span>
                    ),
                  },
                  {
                    header: 'Status',
                    render: (row) => (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        row.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'
                      }`}>
                        {row.status}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
