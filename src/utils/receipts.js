import { PAYMENT_MODES } from "./fees";
import { buildPaymentNotificationHtml, formatCurrency } from "./notificationTemplate";

const RECEIPT_SUBJECT = "Payment Confirmation - ACLC Fee Management System";

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

const buildReceiptMessage = ({ stageLabel, amountPaid, remainingBalance }) => {
  const stageGuidance = getStageBalanceGuidance(remainingBalance);

  return [
    "Good day,",
    "",
    "This is to confirm that your recent tuition fee payment has been successfully recorded.",
    "",
    "Payment Details:",
    `Stage: ${stageLabel}`,
    `Amount Paid: ${formatCurrency(amountPaid)}`,
    `Remaining Balance: ${formatCurrency(remainingBalance)}`,
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

  if (paymentMode === PAYMENT_MODES.FULL) {
    const amountPaid = toPositiveAmount(payment.amount_applied);
    const remainingBalance = toPositiveAmount(payment.outstanding_after ?? student.TotalBalance);

    return {
      stageLabel: "Full Payment",
      amountPaid,
      remainingBalance,
    };
  }

  const stageLabel = payment.stage_label || "Installment";
  const amountPaid = toPositiveAmount(payment.stage_amount_paid ?? payment.amount_applied);
  const remainingBalance = toPositiveAmount(
    payment.stage_amount_remaining ?? payment.outstanding_after ?? student.TotalBalance
  );

  return {
    stageLabel,
    amountPaid,
    remainingBalance,
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
      stageGuidance,
      "If you have any questions or concerns regarding your account, please contact the accounting office.",
    ],
    highlightRows: [
      { label: "Stage", value: details.stageLabel },
      { label: "Amount Paid", value: formatCurrency(details.amountPaid) },
      { label: "Remaining Balance", value: formatCurrency(details.remainingBalance) },
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
  };
};
