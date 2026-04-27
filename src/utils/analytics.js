import {
  INSTALLMENT_FIELDS,
  INSTALLMENT_LABELS,
  distributeTotalAcrossInstallments,
  getCollectedAmount,
  normalizeStudentFinancials,
} from "./fees";

const PERIOD_KEYS = INSTALLMENT_FIELDS;

const hasPaymentMarker = (student = {}) =>
  Boolean(
    student.date_paid ||
    student.DatePaid ||
    student.downpayment_date ||
    student.prelim_date ||
    student.midterm_date ||
    student.prefinal_date ||
    student.final_date ||
    student.total_balance_date ||
    student.downpayment_paid_amount > 0 ||
    student.prelim_paid_amount > 0 ||
    student.midterm_paid_amount > 0 ||
    student.prefinal_paid_amount > 0 ||
    student.final_paid_amount > 0 ||
    student.total_balance_paid_amount > 0
  );

const classifyPaymentStatus = (student, collectedAmount) => {
  if (student.TotalBalance <= 0) {
    return hasPaymentMarker(student) || student.TotalFee > 0 ? "paid" : "unpaid";
  }

  if (collectedAmount <= 0) {
    return "unpaid";
  }

  return "partial";
};

export function calculateAnalytics(students = []) {
  const metrics = {
    totalStudents: 0,
    totalFees: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    paidCount: 0,
    unpaidCount: 0,
    partialCount: 0,
    overdueCount: 0,
    collectionRate: 0,
    programCounts: {
      BSIS: 0,
      BSE: 0,
      Other: 0,
    },
    perPeriod: PERIOD_KEYS.reduce((accumulator, key) => {
      accumulator[key] = {
        label: INSTALLMENT_LABELS[key],
        scheduled: 0,
        outstanding: 0,
        collected: 0,
      };
      return accumulator;
    }, {}),
    topBalances: [],
  };

  const normalizedStudents = Array.isArray(students)
    ? students.map((student) => normalizeStudentFinancials(student))
    : [];

  normalizedStudents.forEach((student) => {
    metrics.totalStudents += 1;
    metrics.totalFees += student.TotalFee;
    metrics.totalOutstanding += student.TotalBalance;

    const collectedAmount = getCollectedAmount(student);
    metrics.totalCollected += collectedAmount;
    const paymentStatus = classifyPaymentStatus(student, collectedAmount);

    if (paymentStatus === "paid") {
      metrics.paidCount += 1;
    } else if (paymentStatus === "unpaid") {
      metrics.unpaidCount += 1;
      metrics.overdueCount += 1;
    } else {
      metrics.partialCount += 1;
      metrics.overdueCount += 1;
    }

    const programValue = String(student.Program || "").toLowerCase();
    if (programValue.includes("bsis")) {
      metrics.programCounts.BSIS += 1;
    } else if (programValue.includes("bse")) {
      metrics.programCounts.BSE += 1;
    } else {
      metrics.programCounts.Other += 1;
    }

    if (student.PaymentMode !== "full") {
      const scheduledDistribution = distributeTotalAcrossInstallments(student.TotalFee);
      PERIOD_KEYS.forEach((key) => {
        const scheduled = scheduledDistribution[key] || 0;
        const outstanding = student[key] || 0;
        const collected = Math.max(scheduled - outstanding, 0);

        metrics.perPeriod[key].scheduled += scheduled;
        metrics.perPeriod[key].outstanding += outstanding;
        metrics.perPeriod[key].collected += collected;
      });
    }
  });

  metrics.collectionRate = metrics.totalFees > 0
    ? Math.round((metrics.totalCollected / metrics.totalFees) * 100)
    : 0;

  metrics.topBalances = normalizedStudents
    .filter((student) => student.TotalBalance > 0)
    .sort((left, right) => right.TotalBalance - left.TotalBalance)
    .slice(0, 5);

  metrics.periodSeries = PERIOD_KEYS.map((key) => ({
    key,
    label: INSTALLMENT_LABELS[key],
    ...metrics.perPeriod[key],
  }));

  metrics.statusSeries = [
    { key: "paid", label: "Paid", value: metrics.paidCount },
    { key: "partial", label: "Partial", value: metrics.partialCount },
    { key: "unpaid", label: "Unpaid", value: metrics.unpaidCount },
  ];

  metrics.programSeries = Object.entries(metrics.programCounts)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ key, label: key, value }));

  return metrics;
}
