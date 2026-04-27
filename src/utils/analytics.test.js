import { calculateAnalytics } from "./analytics";

describe("analytics utilities", () => {
  test("counts fully paid students as paid even without explicit payment marker fields", () => {
    const metrics = calculateAnalytics([
      {
        StudentID: "2026-001",
        Name: "Paid Student",
        Program: "BSIS",
        TotalFee: 24000,
        TotalBalance: 0,
        PaymentMode: "installment",
        Downpayment: 0,
        Prelim: 0,
        Midterm: 0,
        PreFinal: 0,
        Finals: 0,
      },
    ]);

    expect(metrics.paidCount).toBe(1);
    expect(metrics.partialCount).toBe(0);
    expect(metrics.unpaidCount).toBe(0);
    expect(metrics.collectionRate).toBe(100);
  });

  test("does not inject full-payment students into installment trend series", () => {
    const metrics = calculateAnalytics([
      {
        StudentID: "2026-002",
        Name: "Installment Student",
        Program: "BSE",
        TotalFee: 10000,
        TotalBalance: 6000,
        PaymentMode: "installment",
        Downpayment: 0,
        Prelim: 2000,
        Midterm: 2000,
        PreFinal: 1000,
        Finals: 1000,
      },
      {
        StudentID: "2026-003",
        Name: "Full Payment Student",
        Program: "BSIS",
        TotalFee: 15000,
        TotalBalance: 0,
        PaymentMode: "full",
        FullPaymentAmount: 15000,
      },
    ]);

    expect(metrics.totalCollected).toBe(19000);
    expect(metrics.periodSeries.map((item) => item.collected)).toEqual([2000, 0, 0, 1000, 1000]);
  });
});
