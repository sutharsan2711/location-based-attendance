package com.company.attendance.service;

import com.company.attendance.dto.*;
import com.company.attendance.entity.LeaveBalance;
import com.company.attendance.entity.LeaveRequest;
import com.company.attendance.entity.User;
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

        if (Boolean.TRUE.equals(request.getIsHalfDay())) {
            if (!request.getFromDate().equals(request.getToDate())) {
                throw new IllegalArgumentException("Half-day leave must have the same From Date and To Date.");
            }
            if (request.getHalfDaySession() == null) {
                throw new IllegalArgumentException("Please select a session (First Half or Second Half) for half-day leave.");
            }
        } else if (request.getToDate().isBefore(request.getFromDate())) {
            throw new IllegalArgumentException("To Date must be after or same as From Date.");
        }

        LeaveRequest leave = new LeaveRequest(
                employee,
                request.getLeaveType(),
                request.getFromDate(),
                request.getToDate(),
                Boolean.TRUE.equals(request.getIsHalfDay()),
                request.getHalfDaySession(),
                request.getReason().trim(),
                request.getRemarks() != null ? request.getRemarks().trim() : null
        );

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest recordAdminLeave(AdminRecordLeaveRequest request) {
        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + request.getEmployeeId()));

        if (Boolean.TRUE.equals(request.getIsHalfDay())) {
            if (!request.getFromDate().equals(request.getToDate())) {
                throw new IllegalArgumentException("Half-day leave must have the same From Date and To Date.");
            }
            if (request.getHalfDaySession() == null) {
                throw new IllegalArgumentException("Please select a session (First Half or Second Half) for half-day leave.");
            }
        } else if (request.getToDate().isBefore(request.getFromDate())) {
            throw new IllegalArgumentException("To Date must be after or same as From Date.");
        }

        String note = "[Admin Noted / Direct Entry] " + (request.getAdminRemarks() != null ? request.getAdminRemarks().trim() : "Directly recorded by Admin");

        LeaveRequest leave = new LeaveRequest(
                employee,
                request.getLeaveType(),
                request.getFromDate(),
                request.getToDate(),
                Boolean.TRUE.equals(request.getIsHalfDay()),
                request.getHalfDaySession(),
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
    public LeaveRequest withdrawMyLeave(String email, Long id, LeaveWithdrawRequest request) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));

        LeaveRequest leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with ID: " + id));

        if (!leave.getEmployee().getId().equals(employee.getId())) {
            throw new IllegalStateException("You are not authorized to withdraw this leave request.");
        }

        if (leave.getStatus() == RequestStatus.CANCELLED || leave.getStatus() == RequestStatus.WITHDRAWN) {
            throw new IllegalStateException("This leave request is already cancelled/withdrawn.");
        }

        leave.setStatus(RequestStatus.CANCELLED);
        String reason = (request != null && request.getWithdrawalReason() != null && !request.getWithdrawalReason().trim().isEmpty())
                ? request.getWithdrawalReason().trim()
                : "Withdrawn by Employee";
        
        String existingRemarks = leave.getAdminRemarks() != null ? leave.getAdminRemarks() + " | " : "";
        leave.setAdminRemarks(existingRemarks + "[Withdrawn by Employee] " + reason);

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest adminCancelLeave(Long id, LeaveWithdrawRequest request) {
        LeaveRequest leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with ID: " + id));

        if (leave.getStatus() == RequestStatus.CANCELLED || leave.getStatus() == RequestStatus.WITHDRAWN) {
            throw new IllegalStateException("This leave request is already cancelled/withdrawn.");
        }

        leave.setStatus(RequestStatus.CANCELLED);
        String reason = (request != null && request.getWithdrawalReason() != null && !request.getWithdrawalReason().trim().isEmpty())
                ? request.getWithdrawalReason().trim()
                : "Cancelled by Admin";

        String existingRemarks = leave.getAdminRemarks() != null ? leave.getAdminRemarks() + " | " : "";
        leave.setAdminRemarks(existingRemarks + "[Cancelled by Admin] " + reason);

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
            if (!emp.getRole().name().equals("ADMIN")) {
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

    @Transactional
    public CarryForwardPreviewResponse previewCarryForward(CarryForwardRuleDTO rules) {
        int fromYear = rules.getFromYear() > 0 ? rules.getFromYear() : LocalDate.now().getYear() - 1;
        int toYear = rules.getToYear() > 0 ? rules.getToYear() : fromYear + 1;

        List<User> employees = userRepository.findAll();
        CarryForwardPreviewResponse response = new CarryForwardPreviewResponse();
        response.setFromYear(fromYear);
        response.setToYear(toYear);

        double totalDays = 0;
        List<CarryForwardPreviewResponse.CarryForwardEmployeeItem> items = new ArrayList<>();

        for (User emp : employees) {
            if (emp.getRole().name().equals("ADMIN")) continue;

            LeaveBalanceSummaryResponse fromSummary = buildEmployeeLeaveSummary(emp, fromYear);

            double casualClosing = 0;
            double sickClosing = 0;
            double compOffClosing = 0;

            for (LeaveBalanceItemDTO item : fromSummary.getBalances()) {
                if ("CASUAL_LEAVE".equals(item.getType())) {
                    casualClosing = item.getBalance();
                } else if ("SICK_LEAVE".equals(item.getType())) {
                    sickClosing = item.getBalance();
                } else if ("COMP_OFF".equals(item.getType())) {
                    compOffClosing = item.getBalance();
                }
            }

            double casualCarried = rules.isEnableCasualLeave() ? Math.min(casualClosing, rules.getMaxCasualLeaveCap()) : 0;
            double sickCarried = rules.isEnableSickLeave() ? Math.min(sickClosing, rules.getMaxSickLeaveCap()) : 0;
            double compOffCarried = rules.isEnableCompOff() ? Math.min(compOffClosing, rules.getMaxCompOffCap()) : 0;
            double empTotal = casualCarried + sickCarried + compOffCarried;

            CarryForwardPreviewResponse.CarryForwardEmployeeItem empItem = new CarryForwardPreviewResponse.CarryForwardEmployeeItem();
            empItem.setEmployeeId(emp.getId());
            empItem.setEmployeeName(emp.getName());
            empItem.setEmployeeCode(emp.getEmployeeCode());
            empItem.setCasualClosing(casualClosing);
            empItem.setCasualCarried(casualCarried);
            empItem.setSickClosing(sickClosing);
            empItem.setSickCarried(sickCarried);
            empItem.setCompOffClosing(compOffClosing);
            empItem.setCompOffCarried(compOffCarried);
            empItem.setTotalCarried(empTotal);

            items.add(empItem);
            totalDays += empTotal;
        }

        response.setEmployees(items);
        response.setTotalEmployees(items.size());
        response.setTotalDaysCarriedForward(totalDays);
        return response;
    }

    @Transactional
    public CarryForwardPreviewResponse executeCarryForward(CarryForwardRuleDTO rules) {
        CarryForwardPreviewResponse preview = previewCarryForward(rules);
        int toYear = preview.getToYear();

        for (CarryForwardPreviewResponse.CarryForwardEmployeeItem item : preview.getEmployees()) {
            User employee = userRepository.findById(item.getEmployeeId()).orElse(null);
            if (employee == null) continue;

            LeaveBalance targetBalance = leaveBalanceRepository.findByEmployeeIdAndYear(employee.getId(), toYear)
                    .orElseGet(() -> new LeaveBalance(employee, toYear));

            targetBalance.setCasualLeaveCarriedForward(item.getCasualCarried());
            targetBalance.setSickLeaveCarriedForward(item.getSickCarried());
            targetBalance.setCompOffCarriedForward(item.getCompOffCarried());

            leaveBalanceRepository.save(targetBalance);
        }

        return preview;
    }

    private LeaveBalanceSummaryResponse buildEmployeeLeaveSummary(User employee, int year) {
        if (year <= 0) year = LocalDate.now().getYear();

        final int targetYear = year;
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYear(employee.getId(), targetYear)
                .orElseGet(() -> leaveBalanceRepository.save(new LeaveBalance(employee, targetYear)));

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
                double days = Boolean.TRUE.equals(req.getIsHalfDay()) ? 0.5 : (double) (ChronoUnit.DAYS.between(req.getFromDate(), req.getToDate()) + 1);
                LeaveDetailItemDTO detail = new LeaveDetailItemDTO(
                        req.getId(), req.getFromDate(), req.getToDate(), days, req.getIsHalfDay(), req.getHalfDaySession(), req.getReason(), req.getStatus().name()
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
                balance.getLossOfPayGranted(), 0.0, lopConsumed, Math.max(0, balance.getLossOfPayGranted() - lopConsumed)
        );
        lopItem.setBreakdown(lopList);
        items.add(lopItem);

        // 2. Comp - Off
        double compOffTotal = balance.getCompOffGranted() + balance.getCompOffCarriedForward();
        LeaveBalanceItemDTO compOffItem = new LeaveBalanceItemDTO(
                "COMP_OFF", "Comp - Off",
                balance.getCompOffGranted(), balance.getCompOffCarriedForward(), compOffConsumed, Math.max(0, compOffTotal - compOffConsumed)
        );
        compOffItem.setBreakdown(compOffList);
        items.add(compOffItem);

        // 3. Casual Leave
        double casualTotal = balance.getCasualLeaveGranted() + balance.getCasualLeaveCarriedForward();
        LeaveBalanceItemDTO casualItem = new LeaveBalanceItemDTO(
                "CASUAL_LEAVE", "Casual Leave",
                balance.getCasualLeaveGranted(), balance.getCasualLeaveCarriedForward(), casualConsumed, Math.max(0, casualTotal - casualConsumed)
        );
        casualItem.setBreakdown(casualList);
        items.add(casualItem);

        // 4. Sick Leave- Trainee And Interns
        double sickTotal = balance.getSickLeaveGranted() + balance.getSickLeaveCarriedForward();
        LeaveBalanceItemDTO sickItem = new LeaveBalanceItemDTO(
                "SICK_LEAVE", "Sick Leave- Trainee And Interns",
                balance.getSickLeaveGranted(), balance.getSickLeaveCarriedForward(), sickConsumed, Math.max(0, sickTotal - sickConsumed)
        );
        sickItem.setBreakdown(sickList);
        items.add(sickItem);

        // 5. Work From Home
        LeaveBalanceItemDTO wfhItem = new LeaveBalanceItemDTO(
                "WORK_FROM_HOME", "Work From Home",
                balance.getWorkFromHomeGranted(), 0.0, wfhConsumed, Math.max(0, balance.getWorkFromHomeGranted() - wfhConsumed)
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
