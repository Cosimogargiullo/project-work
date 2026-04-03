package it.carehub.common.report.dto;

import java.math.BigDecimal;

public class AnalyticsOverviewDto {
    private BigDecimal totalRevenue;
    private Long reportsCount;
    private BigDecimal averageCost;

    public AnalyticsOverviewDto() {}

    public AnalyticsOverviewDto(BigDecimal totalRevenue, Long reportsCount, BigDecimal averageCost) {
        this.totalRevenue = totalRevenue;
        this.reportsCount = reportsCount;
        this.averageCost = averageCost;
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

    public BigDecimal getAverageCost() {
        return averageCost;
    }

    public void setAverageCost(BigDecimal averageCost) {
        this.averageCost = averageCost;
    }
}
