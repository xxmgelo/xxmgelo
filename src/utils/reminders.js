import { PAYMENT_MODES, getReminderDueDetails } from "./fees";
import { buildPaymentNotificationHtml, formatCurrency } from "./notificationTemplate";

const REMINDER_SUBJECT = "Tuition Fee Payment Reminder - ACLC College of Manila";

const buildInstallmentMessage = (stageLabel, amount) => [
  "Good day,",
  "",
  `This is to inform you that your ${stageLabel} tuition fee payment remains outstanding.`,
  "",
  `The remaining balance for this payment stage is ${formatCurrency(amount)}.`,
  "",
  "We kindly request that you settle this amount at your earliest convenience to avoid any delays in your academic transactions.",
  "",
  "If payment has already been made, please disregard this message and coordinate with the accounting office for verification.",
  "",
  "Thank you.",
  "ACLC Fee Management System",
].join("\n");

const buildRemainingBalanceMessage = (amount) => [
  "Good day,",
  "",
  "This is to inform you that your tuition fee account still reflects an outstanding amount.",
  "",
  `The remaining total balance is ${formatCurrency(amount)}.`,
  "",
  "Please settle this balance at your earliest convenience to avoid delays in your academic transactions.",
  "",
  "If payment has already been made, please disregard this message and coordinate with the accounting office for verification.",
  "",
  "Thank you.",
  "ACLC Fee Management System",
].join("\n");

const buildFullPaymentMessage = (amount) => [
  "Good day,",
  "",
  "This is to inform you that your tuition fee payment remains outstanding.",
  "",
  `The current remaining balance is ${formatCurrency(amount)}.`,
  "",
  "Please settle this amount at your earliest convenience to avoid delays in your academic transactions.",
  "",
  "If payment has already been made, please disregard this message and coordinate with the accounting office for verification.",
  "",
  "Thank you.",
  "ACLC Fee Management System",
].join("\n");

const buildBodyParagraphs = (dueDetails, paymentMode) => {
  if (paymentMode === PAYMENT_MODES.FULL || dueDetails.type === "full") {
    return [
      "This is to inform you that your tuition fee payment remains outstanding.",
      `The current remaining balance is ${formatCurrency(dueDetails.amount)}.`,
      "Please settle this amount at your earliest convenience to avoid delays in your academic transactions.",
      "If payment has already been made, please disregard this message and coordinate with the accounting office for verification.",
    ];
  }

  if (dueDetails.type === "installment_stage") {
    return [
      `This is to inform you that your ${dueDetails.label} tuition fee payment remains outstanding.`,
      `The remaining balance for this payment stage is ${formatCurrency(dueDetails.amount)}.`,
      "Please settle this amount at your earliest convenience to avoid delays in your academic transactions.",
      "If payment has already been made, please disregard this message and coordinate with the accounting office for verification.",
    ];
  }

  return [
    "This is to inform you that your tuition fee account still reflects an outstanding amount.",
    `The remaining total balance is ${formatCurrency(dueDetails.amount)}.`,
    "Please settle this balance at your earliest convenience to avoid delays in your academic transactions.",
    "If payment has already been made, please disregard this message and coordinate with the accounting office for verification.",
  ];
};

export const buildReminderDraft = (student = {}) => {
  const dueDetails = getReminderDueDetails(student);
  const normalizedStudent = dueDetails.student || student;
  const paymentMode = normalizedStudent.PaymentMode;

  let message = buildRemainingBalanceMessage(dueDetails.amount);

  if (paymentMode === PAYMENT_MODES.FULL || dueDetails.type === "full") {
    message = buildFullPaymentMessage(dueDetails.amount);
  } else if (dueDetails.type === "installment_stage") {
    message = buildInstallmentMessage(dueDetails.label, dueDetails.amount);
  }

  const highlightRows =
    dueDetails.type === "installment_stage"
      ? [
        { label: "Payment Stage", value: dueDetails.label },
        { label: "Remaining Balance", value: formatCurrency(dueDetails.amount) },
      ]
      : [
        {
          label: dueDetails.type === "full" ? "Payment Mode" : "Balance Type",
          value: dueDetails.type === "full" ? "Full Payment" : "Remaining Total Balance",
        },
        { label: "Remaining Balance", value: formatCurrency(dueDetails.amount) },
      ];

  const html = buildPaymentNotificationHtml({
    title: "Payment Reminder",
    subtitle: "ACLC Fee Management System",
    notificationIcon: "remindernotif.png",
    notificationIconAlt: "Reminder Notification",
    studentName: normalizedStudent.Name || "Student",
    studentId: normalizedStudent.StudentID || "N/A",
    bodyParagraphs: buildBodyParagraphs(dueDetails, paymentMode),
    highlightRows,
    closing: "Thank you.",
    systemName: "ACLC Fee Management System",
  });

  return {
    subject: REMINDER_SUBJECT,
    message,
    html,
    dueType: dueDetails.type,
    dueField: dueDetails.field,
    dueLabel: dueDetails.label,
    dueAmount: dueDetails.amount,
    dueDetails,
    student: normalizedStudent,
  };
};

export const buildReminderContent = buildReminderDraft;
