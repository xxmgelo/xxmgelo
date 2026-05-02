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

const buildLineItems = (payment = {}) => {
  const lineItems = Array.isArray(payment.payment_line_items)
    ? payment.payment_line_items.filter((item) => Number(item?.amount_paid) > 0)
    : [];

  if (lineItems.length > 0) {
    return lineItems;
  }

  return [
    {
      label: payment.stage_label || getStageLabelFromField(payment.stage_field, "Payment"),
      amount_paid: toPositiveAmount(payment.stage_amount_paid ?? payment.amount_applied),
      or_number: payment.official_receipt || "",
    },
  ].filter((item) => item.amount_paid > 0);
};

const buildReceiptMessage = ({
  stageLabel,
  amountPaid,
  remainingBalance,
  datePaid,
  paymentBreakdown,
  schoolYear,
  semester,
  lineItems,
}) => {
  const stageGuidance = getStageBalanceGuidance(remainingBalance);
  const paymentLines = (lineItems || [])
    .map((item, index) => [
      `${index + 1}. ${item.label}`,
      `   Amount Paid: ${formatCurrency(item.amount_paid)}`,
      `   OR Number: ${item.or_number || "N/A"}`,
    ].join("\n"))
    .join("\n");

  return [
    "Good day,",
    "",
    "This is to confirm that your recent tuition fee payment has been successfully recorded.",
    "",
    "Payment Received:",
    `Type: ${stageLabel}`,
    `School Year: ${schoolYear || "N/A"}`,
    `Semester: ${semester || "N/A"}`,
    `Amount Paid: ${formatCurrency(amountPaid)}`,
    `Date Paid: ${formatDatePaid(datePaid)}`,
    ...(paymentLines ? ["", "Payment Breakdown:", paymentLines] : []),
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
  const lineItems = buildLineItems(payment);

  if (paymentMode === PAYMENT_MODES.FULL) {
    const amountPaid = toPositiveAmount(payment.amount_applied);
    const remainingBalance = toPositiveAmount(payment.outstanding_after ?? student.TotalBalance);

    return {
      stageLabel: "Full Payment",
      amountPaid,
      remainingBalance,
      datePaid,
      paymentBreakdown,
      lineItems,
      schoolYear: payment.school_year_label || student.school_year_label || "",
      semester: payment.semester || student.Semester || student.semester || "",
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
    lineItems,
    schoolYear: payment.school_year_label || student.school_year_label || "",
    semester: payment.semester || student.Semester || student.semester || "",
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
      `School Year: ${details.schoolYear || "N/A"}`,
      `Semester: ${details.semester || "N/A"}`,
      `Date Paid: ${formatDatePaid(details.datePaid)}`,
      stageGuidance,
      "If you have any questions or concerns regarding your account, please contact the accounting office.",
    ],
    highlightRows: [
      { label: "Payment Type", value: details.stageLabel },
      { label: "School Year", value: details.schoolYear || "N/A" },
      { label: "Semester", value: details.semester || "N/A" },
      { label: "Amount Paid", value: formatCurrency(details.amountPaid) },
      { label: "Date Paid", value: formatDatePaid(details.datePaid) },
      { label: "Total Balance", value: formatCurrency(details.remainingBalance) },
    ],
    breakdownTitle: "Payment Breakdown",
    breakdownRows: details.lineItems.map((item) => ({
      label: `${item.label} (${item.or_number || "No OR"})`,
      value: formatCurrency(item.amount_paid),
    })),
    secondaryBreakdownTitle: "Remaining Balance Breakdown",
    secondaryBreakdownRows: [
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
    lineItems: details.lineItems,
  };
};
