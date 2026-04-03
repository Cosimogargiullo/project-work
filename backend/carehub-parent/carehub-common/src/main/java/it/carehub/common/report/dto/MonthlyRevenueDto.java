package it.carehub.common.report.dto;

import java.math.BigDecimal;

public class MonthlyRevenueDto {
    private String month;
    private BigDecimal totalRevenue;
    private Long reportsCount;

    public MonthlyRevenueDto() {}

    public MonthlyRevenueDto(String month, BigDecimal totalRevenue, Long reportsCount) {
        this.month = month;
        this.totalRevenue = totalRevenue;
        this.reportsCount = reportsCount;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
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
