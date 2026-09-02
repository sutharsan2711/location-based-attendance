package com.company.attendance.service;

import com.company.attendance.dto.*;
import com.company.attendance.entity.LeaveBalance;
import com.company.attendance.entity.LeaveRequest;
import com.company.attendance.entity.User;
import com.company.attendance.enums.LeaveType;
import com.company.attendance.enums.RequestStatus;
import com.company.attendance.enums.UserStatus;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.LeaveBalanceRepository;
import com.company.attendance.repository.LeaveRequestRepository;
import com.company.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final UserRepository userRepository;

    public LeaveService(LeaveRequestRepository leaveRepository,
                        LeaveBalanceRepository leaveBalanceRepository,
                        UserRepository userRepository) {
        this.leaveRepository = leaveRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public LeaveRequest applyLeave(String email, LeaveCreateRequest request) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));

        if (employee.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Your employee account is inactive.");
        }

        if (request.getToDate().isBefore(request.getFromDate())) {
            throw new IllegalArgumentException("To Date must be after or same as From Date.");
        }

        LeaveRequest leave = new LeaveRequest(
                employee,
                request.getLeaveType(),
                request.getFromDate(),
                request.getToDate(),
                request.getReason().trim(),
                request.getRemarks() != null ? request.getRemarks().trim() : null
        );

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest recordAdminLeave(AdminRecordLeaveRequest request) {
        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + request.getEmployeeId()));

        if (request.getToDate().isBefore(request.getFromDate())) {
            throw new IllegalArgumentException("To Date must be after or same as From Date.");
        }

        String note = "[Admin Noted / Direct Entry] " + (request.getAdminRemarks() != null ? request.getAdminRemarks().trim() : "Directly recorded by Admin");

        LeaveRequest leave = new LeaveRequest(
                employee,
                request.getLeaveType(),
                request.getFromDate(),
                request.getToDate(),
                request.getReason() != null ? request.getReason().trim() : "Unapplied Leave / Admin Recorded",
                note
        );

        leave.setStatus(RequestStatus.APPROVED);
        leave.setAdminRemarks(request.getAdminRemarks() != null ? request.getAdminRemarks().trim() : "Approved (Admin Direct Entry)");

        return leaveRepository.save(leave);
    }

    public List<LeaveRequest> getMyLeaves(String email) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));
        return leaveRepository.findByEmployeeIdOrderByFromDateDesc(employee.getId());
    }

    public List<LeaveRequest> getAllLeaves(Long employeeId, RequestStatus status, LocalDate startDate, LocalDate endDate) {
        return leaveRepository.findByFilters(employeeId, status, startDate, endDate);
    }

    @Transactional
    public LeaveRequest updateLeaveStatus(Long id, RequestStatusUpdateRequest request) {
        LeaveRequest leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with ID: " + id));

        leave.setStatus(request.getStatus());
        if (request.getAdminRemarks() != null) {
            leave.setAdminRemarks(request.getAdminRemarks().trim());
        }

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveBalanceSummaryResponse getMyLeaveBalances(String email, int year) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));
        return buildEmployeeLeaveSummary(employee, year);
    }

    @Transactional
    public List<LeaveBalanceSummaryResponse> getAllLeaveBalances(int year) {
        List<User> employees = userRepository.findAll();
        List<LeaveBalanceSummaryResponse> summaries = new ArrayList<>();
        for (User emp : employees) {
            if (emp.getRole().name().equals("EMPLOYEE")) {
                summaries.add(buildEmployeeLeaveSummary(emp, year));
            }
        }
        return summaries;
    }

    @Transactional
    public LeaveBalanceSummaryResponse updateLeaveGrants(LeaveGrantUpdateRequest request) {
        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + request.getEmployeeId()));

        int year = request.getYear() > 0 ? request.getYear() : LocalDate.now().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYear(employee.getId(), year)
                .orElseGet(() -> new LeaveBalance(employee, year));

        balance.setCasualLeaveGranted(request.getCasualLeaveGranted());
        balance.setSickLeaveGranted(request.getSickLeaveGranted());
        balance.setCompOffGranted(request.getCompOffGranted());
        balance.setLossOfPayGranted(request.getLossOfPayGranted());
        balance.setWorkFromHomeGranted(request.getWorkFromHomeGranted());

        leaveBalanceRepository.save(balance);
        return buildEmployeeLeaveSummary(employee, year);
    }

    private LeaveBalanceSummaryResponse buildEmployeeLeaveSummary(User employee, int year) {
        if (year <= 0) year = LocalDate.now().getYear();

        final int targetYear = year;
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYear(employee.getId(), targetYear)
                .orElseGet(() -> leaveBalanceRepository.save(new LeaveBalance(employee, targetYear)));

        LocalDate startOfYear = LocalDate.of(year, 1, 1);
        LocalDate endOfYear = LocalDate.of(year, 12, 31);

        List<LeaveRequest> userLeaves = leaveRepository.findByEmployeeIdOrderByFromDateDesc(employee.getId());

        // Process leave buckets
        double lopConsumed = 0;
        double compOffConsumed = 0;
        double casualConsumed = 0;
        double sickConsumed = 0;
        double wfhConsumed = 0;

        List<LeaveDetailItemDTO> lopList = new ArrayList<>();
        List<LeaveDetailItemDTO> compOffList = new ArrayList<>();
        List<LeaveDetailItemDTO> casualList = new ArrayList<>();
        List<LeaveDetailItemDTO> sickList = new ArrayList<>();
        List<LeaveDetailItemDTO> wfhList = new ArrayList<>();

        for (LeaveRequest req : userLeaves) {
            if (req.getFromDate().getYear() == targetYear || req.getToDate().getYear() == targetYear) {
                double days = (double) (ChronoUnit.DAYS.between(req.getFromDate(), req.getToDate()) + 1);
                LeaveDetailItemDTO detail = new LeaveDetailItemDTO(
                        req.getId(), req.getFromDate(), req.getToDate(), days, req.getReason(), req.getStatus().name()
                );

                boolean isApproved = req.getStatus() == RequestStatus.APPROVED;

                switch (req.getLeaveType()) {
                    case LOSS_OF_PAY:
                        lopList.add(detail);
                        if (isApproved) lopConsumed += days;
                        break;
                    case COMP_OFF:
                        compOffList.add(detail);
                        if (isApproved) compOffConsumed += days;
                        break;
                    case SICK_LEAVE:
                        sickList.add(detail);
                        if (isApproved) sickConsumed += days;
                        break;
                    case WORK_FROM_HOME:
                        wfhList.add(detail);
                        if (isApproved) wfhConsumed += days;
                        break;
                    case CASUAL_LEAVE:
                    default:
                        casualList.add(detail);
                        if (isApproved) casualConsumed += days;
                        break;
                }
            }
        }

        List<LeaveBalanceItemDTO> items = new ArrayList<>();

        // 1. Loss Of Pay
        LeaveBalanceItemDTO lopItem = new LeaveBalanceItemDTO(
                "LOSS_OF_PAY", "Loss Of Pay",
                balance.getLossOfPayGranted(), lopConsumed, Math.max(0, balance.getLossOfPayGranted() - lopConsumed)
        );
        lopItem.setBreakdown(lopList);
        items.add(lopItem);

        // 2. Comp - Off
        LeaveBalanceItemDTO compOffItem = new LeaveBalanceItemDTO(
                "COMP_OFF", "Comp - Off",
                balance.getCompOffGranted(), compOffConsumed, Math.max(0, balance.getCompOffGranted() - compOffConsumed)
        );
        compOffItem.setBreakdown(compOffList);
        items.add(compOffItem);

        // 3. Casual Leave
        LeaveBalanceItemDTO casualItem = new LeaveBalanceItemDTO(
                "CASUAL_LEAVE", "Casual Leave",
                balance.getCasualLeaveGranted(), casualConsumed, Math.max(0, balance.getCasualLeaveGranted() - casualConsumed)
        );
        casualItem.setBreakdown(casualList);
        items.add(casualItem);

        // 4. Sick Leave- Trainee And Interns
        LeaveBalanceItemDTO sickItem = new LeaveBalanceItemDTO(
                "SICK_LEAVE", "Sick Leave- Trainee And Interns",
                balance.getSickLeaveGranted(), sickConsumed, Math.max(0, balance.getSickLeaveGranted() - sickConsumed)
        );
        sickItem.setBreakdown(sickList);
        items.add(sickItem);

        // 5. Work From Home
        LeaveBalanceItemDTO wfhItem = new LeaveBalanceItemDTO(
                "WORK_FROM_HOME", "Work From Home",
                balance.getWorkFromHomeGranted(), wfhConsumed, Math.max(0, balance.getWorkFromHomeGranted() - wfhConsumed)
        );
        wfhItem.setBreakdown(wfhList);
        items.add(wfhItem);

        return new LeaveBalanceSummaryResponse(
                employee.getId(),
                employee.getName(),
                employee.getEmployeeCode(),
                targetYear,
                items
        );
    }
}
