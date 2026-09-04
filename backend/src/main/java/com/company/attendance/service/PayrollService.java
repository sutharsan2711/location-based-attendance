package com.company.attendance.service;

import com.company.attendance.dto.PayrollDashboardStats;
import com.company.attendance.dto.PayrollGenerationRequest;
import com.company.attendance.dto.PayrollResponse;
import com.company.attendance.dto.PayslipResponse;
import com.company.attendance.entity.*;
import com.company.attendance.enums.AttendanceTimingStatus;
import com.company.attendance.enums.PayrollStatus;
import com.company.attendance.enums.RequestStatus;
import com.company.attendance.enums.Role;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PermissionRequestRepository permissionRequestRepository;
    private final HolidayRepository holidayRepository;
    private final CompanyLocationRepository companyLocationRepository;

    public PayrollService(
            PayrollRepository payrollRepository,
            SalaryStructureRepository salaryStructureRepository,
            UserRepository userRepository,
            AttendanceRepository attendanceRepository,
            LeaveRequestRepository leaveRequestRepository,
            PermissionRequestRepository permissionRequestRepository,
            HolidayRepository holidayRepository,
            CompanyLocationRepository companyLocationRepository
    ) {
        this.payrollRepository = payrollRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.permissionRequestRepository = permissionRequestRepository;
        this.holidayRepository = holidayRepository;
        this.companyLocationRepository = companyLocationRepository;
    }

    @Transactional
    public List<PayrollResponse> generatePayroll(PayrollGenerationRequest req) {
        int month = req.getMonth();
        int year = req.getYear();

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        // Compute default standard working days (Mon-Sat, excluding Sundays and Holidays)
        List<Holiday> holidays = holidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(startDate, endDate);
        int workingDays = calculateWorkingDays(startDate, endDate, holidays);

        List<User> targets;
        if (req.getEmployeeId() != null) {
            User emp = userRepository.findById(req.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + req.getEmployeeId()));
            targets = List.of(emp);
        } else {
            targets = userRepository.findByRoleNot(Role.ADMIN);
        }

        List<Payroll> generatedList = new ArrayList<>();

        for (User emp : targets) {
            // Check for existing payroll in the given month & year
            if (payrollRepository.existsByEmployeeIdAndMonthAndYear(emp.getId(), month, year)) {
                // If single employee request, throw error; otherwise skip
                if (req.getEmployeeId() != null) {
                    throw new IllegalArgumentException("Payroll for " + emp.getName() + " has already been generated for " + Month.of(month).name() + " " + year);
                }
                continue;
            }

            // Retrieve salary structure or default
            SalaryStructure structure = salaryStructureRepository.findByEmployeeId(emp.getId())
                    .orElseGet(() -> new SalaryStructure(emp));

            // Calculate attendance stats
            List<Attendance> logs = attendanceRepository.findByEmployeeIdAndAttendanceDateBetween(emp.getId(), startDate, endDate);
            int presentDays = logs.size();

            int lateDays = (int) logs.stream()
                    .filter(a -> a.getTimingStatus() == AttendanceTimingStatus.LATE)
                    .count();

            // Count approved leaves
            List<LeaveRequest> approvedLeaves = leaveRequestRepository.findByEmployeeIdAndStatus(emp.getId(), RequestStatus.APPROVED);
            int leaveDays = 0;
            for (LeaveRequest l : approvedLeaves) {
                if (l.getFromDate() != null && l.getToDate() != null) {
                    if (!l.getFromDate().isAfter(endDate) && !l.getToDate().isBefore(startDate)) {
                        long days = java.time.temporal.ChronoUnit.DAYS.between(l.getFromDate(), l.getToDate()) + 1;
                        leaveDays += (int) Math.max(1, days);
                    }
                }
            }

            // Count approved permissions
            List<PermissionRequest> approvedPermissions = permissionRequestRepository.findByEmployeeIdAndStatus(emp.getId(), RequestStatus.APPROVED);
            int permissionDays = (int) approvedPermissions.stream()
                    .filter(p -> p.getPermissionDate() != null && !p.getPermissionDate().isBefore(startDate) && !p.getPermissionDate().isAfter(endDate))
                    .count();

            int absentDays = Math.max(0, workingDays - presentDays - leaveDays);

            // Create Payroll record
            Payroll payroll = new Payroll();
            payroll.setEmployee(emp);
            payroll.setMonth(month);
            payroll.setYear(year);

            // Earnings snapshot
            payroll.setBasicSalary(structure.getBasicSalary());
            payroll.setHra(structure.getHra());
            payroll.setDa(structure.getDa());
            payroll.setConveyanceAllowance(structure.getConveyanceAllowance());
            payroll.setMedicalAllowance(structure.getMedicalAllowance());
            payroll.setOtherAllowance(structure.getOtherAllowance());

            // Deductions snapshot
            payroll.setPf(structure.getPf());
            payroll.setEsi(structure.getEsi());
            payroll.setProfessionalTax(structure.getProfessionalTax());
            payroll.setOtherDeduction(structure.getOtherDeduction());

            payroll.recalculateTotals();

            // Attendance snapshot
            payroll.setWorkingDays(workingDays);
            payroll.setPresentDays(presentDays);
            payroll.setAbsentDays(absentDays);
            payroll.setLeaveDays(leaveDays);
            payroll.setPermissionDays(permissionDays);
            payroll.setLateDays(lateDays);

            payroll.setStatus(PayrollStatus.GENERATED);
            payroll.setGeneratedAt(LocalDateTime.now());

            generatedList.add(payrollRepository.save(payroll));
        }

        return generatedList.stream().map(PayrollResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> getPayrollList(Integer month, Integer year, Long employeeId, PayrollStatus status) {
        return payrollRepository.findWithFilters(month, year, employeeId, status)
                .stream()
                .map(PayrollResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PayrollResponse getPayrollById(Long id, String requesterEmail, boolean isAdmin) {
        Payroll payroll = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll record not found with ID: " + id));

        if (!isAdmin && !payroll.getEmployee().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new AccessDeniedException("You are not authorized to view another employee's payroll.");
        }

        return PayrollResponse.fromEntity(payroll);
    }

    @Transactional
    public PayrollResponse updatePayrollStatus(Long id, PayrollStatus status) {
        Payroll payroll = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll record not found with ID: " + id));

        payroll.setStatus(status);
        if (status == PayrollStatus.PAID) {
            payroll.setPaidAt(LocalDateTime.now());
        }
        return PayrollResponse.fromEntity(payrollRepository.save(payroll));
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> getMyPayrollList(String requesterEmail, Integer year) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + requesterEmail));

        List<Payroll> list = (year != null)
                ? payrollRepository.findByEmployeeIdAndYearOrderByMonthDesc(user.getId(), year)
                : payrollRepository.findByEmployeeIdOrderByYearDescMonthDesc(user.getId());

        return list.stream().map(PayrollResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PayslipResponse getPayslip(Long payrollId, String requesterEmail, boolean isAdmin) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll record not found with ID: " + payrollId));

        if (!isAdmin && !payroll.getEmployee().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new AccessDeniedException("You are not authorized to view another employee's payslip.");
        }

        CompanyLocation defaultLoc = companyLocationRepository.findAll().stream().findFirst().orElse(null);
        return PayslipResponse.fromEntity(payroll, defaultLoc);
    }

    @Transactional(readOnly = true)
    public PayrollDashboardStats getDashboardStats(int month, int year) {
        long totalEmployees = userRepository.findByRoleNot(Role.ADMIN).size();
        long generated = payrollRepository.countByMonthAndYear(month, year);
        long paid = payrollRepository.countByMonthAndYearAndStatus(month, year, PayrollStatus.PAID);
        long pending = Math.max(0, totalEmployees - generated);

        String monthName = Month.of(month).name();
        return new PayrollDashboardStats(totalEmployees, generated, pending, paid, month, year, monthName);
    }

    private int calculateWorkingDays(LocalDate start, LocalDate end, List<Holiday> holidays) {
        int count = 0;
        LocalDate curr = start;
        while (!curr.isAfter(end)) {
            // Count all days except Sundays
            if (curr.getDayOfWeek() != DayOfWeek.SUNDAY) {
                final LocalDate checkDate = curr;
                boolean isHoliday = holidays.stream().anyMatch(h -> h.getHolidayDate().equals(checkDate));
                if (!isHoliday) {
                    count++;
                }
            }
            curr = curr.plusDays(1);
        }
        return count;
    }
}
