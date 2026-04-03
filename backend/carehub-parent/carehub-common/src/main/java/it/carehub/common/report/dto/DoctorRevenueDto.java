package it.carehub.common.report.dto;

import java.math.BigDecimal;

public class DoctorRevenueDto {
    private Long doctorId;
    private BigDecimal totalRevenue;
    private Long reportsCount;

    public DoctorRevenueDto() {}

    public DoctorRevenueDto(Long doctorId, BigDecimal totalRevenue, Long reportsCount) {
        this.doctorId = doctorId;
        this.totalRevenue = totalRevenue;
        this.reportsCount = reportsCount;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Long getReportsCount() {
        return reportsCount;
    }

    public void setReportsCount(Long reportsCount) {
        this.reportsCount = reportsCount;
    }
}
