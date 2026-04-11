import { PAYMENT_MODES } from "./fees";
import { buildPaymentNotificationHtml, formatCurrency } from "./notificationTemplate";

const RECEIPT_SUBJECT = "Payment Confirmation - ACLC Fee Management System";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "2-digit",
  year: "numeric",
});

const toPositiveAmount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

const getStageBalanceGuidance = (remainingBalance) =>
  remainingBalance <= 0
    ? "This payment completes the required amount for this stage."
    : "Please ensure that the remaining balance is settled within the required period.";

const formatDatePaid = (value) => {
  if (!value) {
    return "N/A";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return dateFormatter.format(parsedDate);
};

const getStageLabelFromField = (stageField, fallback = "Installment") => {
  switch (stageField) {
    case "Downpayment":
      return "Downpayment";
    case "Prelim":
      return "Prelim";
    case "Midterm":
      return "Midterm";
    case "PreFinal":
      return "Pre-Final";
    case "Finals":
      return "Finals";
    case "FullPaymentAmount":
      return "Full Payment";
    default:
      return fallback;
  }
};

const buildReceiptMessage = ({ stageLabel, amountPaid, remainingBalance, datePaid, paymentBreakdown }) => {
  const stageGuidance = getStageBalanceGuidance(remainingBalance);

  return [
    "Good day,",
    "",
    "This is to confirm that your recent tuition fee payment has been successfully recorded.",
    "",
    "Payment Received:",
    `Type: ${stageLabel}`,
    `Amount Paid: ${formatCurrency(amountPaid)}`,
    `Date Paid: ${formatDatePaid(datePaid)}`,
    "",
    "Remaining Balance Breakdown:",
    `Prelim: ${formatCurrency(paymentBreakdown?.Prelim ?? 0)}`,
    `Midterm: ${formatCurrency(paymentBreakdown?.Midterm ?? 0)}`,
    `Prefinal: ${formatCurrency(paymentBreakdown?.PreFinal ?? 0)}`,
    `Final: ${formatCurrency(paymentBreakdown?.Finals ?? 0)}`,
    "",
    "Your payment has been applied to the specified installment stage.",
    "",
    stageGuidance,
    "",
    "If you have any questions or concerns regarding your account, please contact the accounting office.",
    "",
    "Thank you.",
    "ACLC Fee Management System",
  ].join("\n");
};

const getReceiptStageDetails = (student = {}, payment = {}) => {
  const paymentMode = payment.mode || student.PaymentMode;
  const datePaid = payment.date_paid ?? student.date_paid ?? null;
  const paymentBreakdown = {
    Prelim: student.Prelim ?? 0,
    Midterm: student.Midterm ?? 0,
    PreFinal: student.PreFinal ?? 0,
    Finals: student.Finals ?? 0,
  };

  if (paymentMode === PAYMENT_MODES.FULL) {
    const amountPaid = toPositiveAmount(payment.amount_applied);
    const remainingBalance = toPositiveAmount(payment.outstanding_after ?? student.TotalBalance);

    return {
      stageLabel: "Full Payment",
      amountPaid,
      remainingBalance,
      datePaid,
      paymentBreakdown,
    };
  }

  const stageLabel = getStageLabelFromField(payment.stage_field, payment.stage_label || "Installment");
  const amountPaid = toPositiveAmount(payment.stage_amount_paid ?? payment.amount_applied);
  const remainingBalance = toPositiveAmount(
    payment.stage_amount_remaining ?? payment.outstanding_after ?? student.TotalBalance
  );

  return {
    stageLabel,
    amountPaid,
    remainingBalance,
    datePaid,
    paymentBreakdown,
  };
};

export const buildPaymentReceiptDraft = (student = {}, payment = {}) => {
  const details = getReceiptStageDetails(student, payment);
  const stageGuidance = getStageBalanceGuidance(details.remainingBalance);
  const message = buildReceiptMessage(details);
  const html = buildPaymentNotificationHtml({
    title: "Payment Received",
    subtitle: "ACLC Fee Management System",
    notificationIcon: "receivednotif.png",
    notificationIconAlt: "Payment Received Notification",
    headerCentered: true,
    headerShowLogo: false,
    studentName: student.Name || "Student",
    studentId: student.StudentID || "N/A",
    bodyParagraphs: [
      "This is to confirm that your recent tuition fee payment has been successfully recorded.",
      "Your payment has been applied to the specified installment stage.",
      `Date Paid: ${formatDatePaid(details.datePaid)}`,
      stageGuidance,
      "If you have any questions or concerns regarding your account, please contact the accounting office.",
    ],
    highlightRows: [
      { label: "Payment Type", value: details.stageLabel },
      { label: "Amount Paid", value: formatCurrency(details.amountPaid) },
      { label: "Date Paid", value: formatDatePaid(details.datePaid) },
      { label: "Total Balance", value: formatCurrency(details.remainingBalance) },
    ],
    breakdownRows: [
      { label: "Prelim", value: formatCurrency(details.paymentBreakdown?.Prelim ?? 0) },
      { label: "Midterm", value: formatCurrency(details.paymentBreakdown?.Midterm ?? 0) },
      { label: "Prefinal", value: formatCurrency(details.paymentBreakdown?.PreFinal ?? 0) },
      { label: "Final", value: formatCurrency(details.paymentBreakdown?.Finals ?? 0) },
    ],
    closing: "Thank you.",
    closingPlacement: "body",
    systemName: "ACLC Fee Management System",
    footerShowLogo: true,
    footerCenteredBrand: true,
  });

  return {
    subject: RECEIPT_SUBJECT,
    message,
    html,
    stageLabel: details.stageLabel,
    amountPaid: details.amountPaid,
    remainingBalance: details.remainingBalance,
    datePaid: details.datePaid,
    paymentBreakdown: details.paymentBreakdown,
  };
};
