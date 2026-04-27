export const PAYMENT_MODES = {
  FULL: "full",
  INSTALLMENT: "installment",
};

export const INSTALLMENT_FIELDS = [
  "Downpayment",
  "Prelim",
  "Midterm",
  "PreFinal",
  "Finals",
];

export const INSTALLMENT_DATE_FIELDS = {
  Downpayment: "downpayment_date",
  Prelim: "prelim_date",
  Midterm: "midterm_date",
  PreFinal: "prefinal_date",
  Finals: "final_date",
  FullPaymentAmount: "total_balance_date",
};

export const INSTALLMENT_PAID_AMOUNT_FIELDS = {
  Downpayment: "downpayment_paid_amount",
  Prelim: "prelim_paid_amount",
  Midterm: "midterm_paid_amount",
  PreFinal: "prefinal_paid_amount",
  Finals: "final_paid_amount",
  FullPaymentAmount: "total_balance_paid_amount",
};

export const REMINDER_STAGE_DATE_FIELDS = [
  "downpayment_date",
  "prelim_date",
  "midterm_date",
  "prefinal_date",
  "final_date",
  "total_balance_date",
];

export const INSTALLMENT_LABELS = {
  Downpayment: "Downpayment",
  Prelim: "Prelim",
  Midterm: "Midterm",
  PreFinal: "Pre-Final",
  Finals: "Finals",
};

const roundCurrency = (value) => Math.round(value * 100) / 100;
const INSTALLMENT_COUNT = INSTALLMENT_FIELDS.length;
const MAX_DISCOUNT_PERCENT = 100;

const resolveStudentId = (student = {}) =>
  student.StudentID ??
  student.student_id ??
  student.studentId ??
  student.id_number ??
  student.IDNumber ??
  student.IdNumber ??
  student.usn ??
  student.USN ??
  student.student_no ??
  student.StudentNo ??
  student.student_number ??
  student.StudentNumber ??
  "";

export const parseAmount = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return roundCurrency(parsed);
};

const toPositiveAmount = (value) => Math.max(parseAmount(value), 0);
const toDiscountPercent = (value) =>
  Math.min(Math.max(roundCurrency(parseAmount(value)), 0), MAX_DISCOUNT_PERCENT);
const toBooleanFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};
const applyDiscount = (baseTotalFee, discountPercent) =>
  roundCurrency(Math.max(baseTotalFee * (1 - discountPercent / 100), 0));

export const sanitizePaymentMode = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === PAYMENT_MODES.FULL ? PAYMENT_MODES.FULL : PAYMENT_MODES.INSTALLMENT;
};

export const getInstallmentBalances = (student = {}) =>
  INSTALLMENT_FIELDS.reduce((balances, field) => {
    balances[field] = toPositiveAmount(student[field]);
    return balances;
  }, {});

export const getDiscountPercent = (student = {}) =>
  toDiscountPercent(
    student.Discount ??
    student.DiscountPercent ??
    student.discount ??
    student.discount_percent ??
    student["Discount (%)"]
  );

export const sumInstallments = (student = {}) =>
  roundCurrency(
    INSTALLMENT_FIELDS.reduce((total, field) => total + toPositiveAmount(student[field]), 0)
  );

export const getCurrentInstallmentIndex = (student = {}) =>
  INSTALLMENT_FIELDS.findIndex((field) => toPositiveAmount(student[field]) > 0);

export const getReminderDueDetails = (student = {}) => {
  const normalized = normalizeStudentFinancials(student);

  if (normalized.TotalBalance <= 0) {
    return {
      type: "none",
      field: null,
      label: "No Balance Due",
      amount: 0,
      student: normalized,
    };
  }

  if (normalized.PaymentMode === PAYMENT_MODES.FULL) {
    return {
      type: "full",
      field: "TotalBalance",
      label: "Total Balance",
      amount: normalized.TotalBalance,
      student: normalized,
    };
  }

  const rawInstallmentBalances = getInstallmentBalances(student);
  const hasRawInstallmentDue = INSTALLMENT_FIELDS.some((field) => rawInstallmentBalances[field] > 0);
  const rawTotalBalance = toPositiveAmount(student.TotalBalance ?? student.total_balance);

  if (!hasRawInstallmentDue && rawTotalBalance > 0) {
    return {
      type: "remaining_balance",
      field: "TotalBalance",
      label: "Total Remaining Balance",
      amount: normalized.TotalBalance,
      student: normalized,
    };
  }

  const currentIndex = getCurrentInstallmentIndex(normalized);

  if (currentIndex !== -1) {
    const dueField = INSTALLMENT_FIELDS[currentIndex];
    return {
      type: "installment_stage",
      field: dueField,
      label: INSTALLMENT_LABELS[dueField],
      amount: toPositiveAmount(normalized[dueField]),
      student: normalized,
    };
  }

  return {
    type: "remaining_balance",
    field: "TotalBalance",
    label: "Total Remaining Balance",
    amount: normalized.TotalBalance,
    student: normalized,
  };
};

export const getLatestPaymentReminderToken = (student = {}) => {
  const normalized = normalizeStudentFinancials(student);

  const stageDates = [
    { field: "Downpayment", value: normalized.downpayment_date },
    { field: "Prelim", value: normalized.prelim_date },
    { field: "Midterm", value: normalized.midterm_date },
    { field: "PreFinal", value: normalized.prefinal_date },
    { field: "Finals", value: normalized.final_date },
    { field: "FullPaymentAmount", value: normalized.total_balance_date },
  ]
    .map((item) => ({
      ...item,
      timestamp: item.value ? new Date(item.value).getTime() : NaN,
    }))
    .filter((item) => Number.isFinite(item.timestamp));

  if (stageDates.length === 0) {
    return "";
  }

  stageDates.sort((a, b) => a.timestamp - b.timestamp);
  const latest = stageDates[stageDates.length - 1];
  return `${latest.field}:${latest.timestamp}`;
};

export const distributeTotalAcrossInstallments = (total) => {
  const normalizedTotal = toPositiveAmount(total);

  if (normalizedTotal <= 0) {
    return INSTALLMENT_FIELDS.reduce((balances, field) => {
      balances[field] = 0;
      return balances;
    }, {});
  }

  const baseAmount = Math.floor((normalizedTotal / INSTALLMENT_COUNT) * 100) / 100;
  let allocated = 0;

  return INSTALLMENT_FIELDS.reduce((balances, field, index) => {
    const isLastField = index === INSTALLMENT_COUNT - 1;
    const value = isLastField
      ? roundCurrency(normalizedTotal - allocated)
      : baseAmount;

    balances[field] = value;
    allocated = roundCurrency(allocated + value);
    return balances;
  }, {});
};

const fitInstallmentsToTotal = (balances, targetTotal) => {
  const nextBalances = { ...balances };
  let remaining = roundCurrency(targetTotal - sumInstallments(nextBalances));

  if (remaining > 0) {
    nextBalances.Finals = roundCurrency((nextBalances.Finals || 0) + remaining);
    return nextBalances;
  }

  if (remaining < 0) {
    let debtToTrim = Math.abs(remaining);

    [...INSTALLMENT_FIELDS].reverse().forEach((field) => {
      if (debtToTrim <= 0) {
        return;
      }

      const currentValue = nextBalances[field] || 0;
      const reduction = Math.min(currentValue, debtToTrim);
      nextBalances[field] = roundCurrency(currentValue - reduction);
      debtToTrim = roundCurrency(debtToTrim - reduction);
    });
  }

  return nextBalances;
};

export const normalizeStudentFinancials = (student = {}) => {
  const studentId = resolveStudentId(student);
  const gmail = student.Gmail ?? student.gmail ?? student.email ?? "";
  const paymentMode = sanitizePaymentMode(student.PaymentMode || student.payment_mode);
  const canRemind = toBooleanFlag(student.CanRemind ?? student.can_remind ?? false);
  const datePaid = student.date_paid ?? student.DatePaid ?? null;
  const downpaymentDate = student.downpayment_date ?? student.DownpaymentDate ?? null;
  const prelimDate = student.prelim_date ?? student.PrelimDate ?? null;
  const midtermDate = student.midterm_date ?? student.MidtermDate ?? null;
  const prefinalDate = student.prefinal_date ?? student.PreFinalDate ?? student.PreFinal_date ?? null;
  const finalDate = student.final_date ?? student.FinalDate ?? null;
  const totalBalanceDate = student.total_balance_date ?? student.TotalBalanceDate ?? null;
  const downpaymentPaidAmount = student.downpayment_paid_amount ?? student.DownpaymentPaidAmount ?? null;
  const prelimPaidAmount = student.prelim_paid_amount ?? student.PrelimPaidAmount ?? null;
  const midtermPaidAmount = student.midterm_paid_amount ?? student.MidtermPaidAmount ?? null;
  const prefinalPaidAmount = student.prefinal_paid_amount ?? student.PreFinalPaidAmount ?? null;
  const finalPaidAmount = student.final_paid_amount ?? student.FinalPaidAmount ?? null;
  const totalBalancePaidAmount = student.total_balance_paid_amount ?? student.TotalBalancePaidAmount ?? null;
  const discount = getDiscountPercent(student);
  let installmentBalances = getInstallmentBalances(student);
  const rawTotalFee = toPositiveAmount(student.TotalFee ?? student.total_fee);
  let baseTotalFee = toPositiveAmount(
    student.BaseTotalFee ??
    student.base_total_fee ??
    student["Base Total Fee"] ??
    student.OriginalTotalFee ??
    student.original_total_fee
  );
  if (baseTotalFee <= 0) {
    baseTotalFee = rawTotalFee;
  }
  let totalFee = applyDiscount(baseTotalFee, discount);
  if (totalFee <= 0 && rawTotalFee > 0) {
    totalFee = rawTotalFee;
  }
  let fullPaymentAmount = toPositiveAmount(student.FullPaymentAmount ?? student.full_payment_amount);
  const rawTotalBalance = student.TotalBalance ?? student.total_balance;
  const hasExplicitTotalBalance = rawTotalBalance !== undefined && rawTotalBalance !== null && rawTotalBalance !== "";
  const resolvedRawTotalBalance = toPositiveAmount(rawTotalBalance);
  const stageTotal = sumInstallments(installmentBalances);

  if (stageTotal === 0 && totalFee > 0 && (!hasExplicitTotalBalance || resolvedRawTotalBalance > 0)) {
    installmentBalances = distributeTotalAcrossInstallments(totalFee);
  }

  if (paymentMode === PAYMENT_MODES.FULL) {
    totalFee = totalFee > 0 ? totalFee : Math.max(fullPaymentAmount, toPositiveAmount(student.TotalBalance));
    fullPaymentAmount = totalFee > 0 ? Math.min(fullPaymentAmount, totalFee) : fullPaymentAmount;

    return {
      ...student,
      StudentID: studentId,
      Gmail: gmail,
      Downpayment: 0,
      Prelim: 0,
      Midterm: 0,
      PreFinal: 0,
      Finals: 0,
      PaymentMode: paymentMode,
      Discount: discount,
      DiscountPercent: discount,
      BaseTotalFee: baseTotalFee,
      FullPaymentAmount: fullPaymentAmount,
      CanRemind: canRemind,
      date_paid: datePaid,
      DatePaid: datePaid,
      downpayment_date: downpaymentDate,
      prelim_date: prelimDate,
      midterm_date: midtermDate,
      prefinal_date: prefinalDate,
      final_date: finalDate,
      total_balance_date: totalBalanceDate,
      downpayment_paid_amount: downpaymentPaidAmount,
      prelim_paid_amount: prelimPaidAmount,
      midterm_paid_amount: midtermPaidAmount,
      prefinal_paid_amount: prefinalPaidAmount,
      final_paid_amount: finalPaidAmount,
      total_balance_paid_amount: totalBalancePaidAmount,
      TotalFee: totalFee,
      TotalBalance: roundCurrency(Math.max(totalFee - fullPaymentAmount, 0)),
    };
  }

  let totalBalance = toPositiveAmount(student.TotalBalance ?? student.total_balance);
  let nextStageTotal = sumInstallments(installmentBalances);

  totalFee = totalFee > 0 ? totalFee : Math.max(totalBalance, nextStageTotal);
  totalBalance = totalBalance > 0 ? totalBalance : nextStageTotal;

  if (nextStageTotal === 0 && totalBalance > 0) {
    installmentBalances = distributeTotalAcrossInstallments(totalBalance);
    nextStageTotal = sumInstallments(installmentBalances);
  }

  if (totalBalance > 0 && nextStageTotal !== totalBalance) {
    const alignedBalances = fitInstallmentsToTotal(installmentBalances, totalBalance);
    INSTALLMENT_FIELDS.forEach((field) => {
      installmentBalances[field] = alignedBalances[field];
    });
    nextStageTotal = sumInstallments(installmentBalances);
  }

  totalFee = Math.max(totalFee, nextStageTotal);

  return {
    ...student,
    StudentID: studentId,
    Gmail: gmail,
    ...installmentBalances,
    PaymentMode: paymentMode,
    Discount: discount,
    DiscountPercent: discount,
    BaseTotalFee: baseTotalFee,
    FullPaymentAmount: fullPaymentAmount,
    CanRemind: canRemind,
    date_paid: datePaid,
    DatePaid: datePaid,
    downpayment_date: downpaymentDate,
    prelim_date: prelimDate,
    midterm_date: midtermDate,
    prefinal_date: prefinalDate,
    final_date: finalDate,
    total_balance_date: totalBalanceDate,
    downpayment_paid_amount: downpaymentPaidAmount,
    prelim_paid_amount: prelimPaidAmount,
    midterm_paid_amount: midtermPaidAmount,
    prefinal_paid_amount: prefinalPaidAmount,
    final_paid_amount: finalPaidAmount,
    total_balance_paid_amount: totalBalancePaidAmount,
    TotalFee: totalFee,
    TotalBalance: nextStageTotal,
  };
};

export const getCollectedAmount = (student = {}) => {
  const normalized = normalizeStudentFinancials(student);
  return roundCurrency(Math.max(normalized.TotalFee - normalized.TotalBalance, 0));
};

export const getEffectiveTotalFee = (student = {}) => {
  const normalized = normalizeStudentFinancials(student);
  return normalized.TotalFee;
};

export const applyFeeFieldChange = (student, field, value) => {
  const current = normalizeStudentFinancials(student);

  if (field === "PaymentMode") {
    return normalizeStudentFinancials({
      ...current,
      PaymentMode: sanitizePaymentMode(value),
    });
  }

  if (field === "TotalFee") {
    const nextBaseTotalFee = toPositiveAmount(value);
    const discountPercent = getDiscountPercent(current);
    const nextTotalFee = applyDiscount(nextBaseTotalFee, discountPercent);

    if (current.PaymentMode === PAYMENT_MODES.FULL) {
      return normalizeStudentFinancials({
        ...current,
        Downpayment: 0,
        Prelim: 0,
        Midterm: 0,
        PreFinal: 0,
        Finals: 0,
        BaseTotalFee: nextBaseTotalFee,
        TotalFee: nextTotalFee,
        FullPaymentAmount: Math.min(toPositiveAmount(current.FullPaymentAmount), nextTotalFee),
        TotalBalance: roundCurrency(Math.max(nextTotalFee - toPositiveAmount(current.FullPaymentAmount), 0)),
      });
    }

    return normalizeStudentFinancials({
      ...current,
      Downpayment: 0,
      Prelim: 0,
      Midterm: 0,
      PreFinal: 0,
      Finals: 0,
      BaseTotalFee: nextBaseTotalFee,
      TotalFee: nextTotalFee,
      TotalBalance: nextTotalFee,
    });
  }

  if (field === "FullPaymentAmount") {
    return normalizeStudentFinancials({
      ...current,
      FullPaymentAmount: value,
    });
  }

  if (field === "Discount" || field === "DiscountPercent") {
    const nextDiscount = toDiscountPercent(value);
    const nextBaseTotalFee = toPositiveAmount(current.BaseTotalFee ?? current.TotalFee);
    const nextTotalFee = applyDiscount(nextBaseTotalFee, nextDiscount);

    if (current.PaymentMode === PAYMENT_MODES.FULL) {
      return normalizeStudentFinancials({
        ...current,
        Downpayment: 0,
        Prelim: 0,
        Midterm: 0,
        PreFinal: 0,
        Finals: 0,
        BaseTotalFee: nextBaseTotalFee,
        Discount: nextDiscount,
        TotalFee: nextTotalFee,
        FullPaymentAmount: Math.min(toPositiveAmount(current.FullPaymentAmount), nextTotalFee),
        TotalBalance: roundCurrency(Math.max(nextTotalFee - toPositiveAmount(current.FullPaymentAmount), 0)),
      });
    }

    return normalizeStudentFinancials({
      ...current,
      Downpayment: 0,
      Prelim: 0,
      Midterm: 0,
      PreFinal: 0,
      Finals: 0,
      BaseTotalFee: nextBaseTotalFee,
      Discount: nextDiscount,
      TotalFee: nextTotalFee,
      TotalBalance: nextTotalFee,
    });
  }

  if (INSTALLMENT_FIELDS.includes(field)) {
    const nextBalances = getInstallmentBalances(current);
    nextBalances[field] = toPositiveAmount(value);

    return normalizeStudentFinancials({
      ...current,
      ...nextBalances,
      TotalBalance: sumInstallments(nextBalances),
    });
  }

  return normalizeStudentFinancials({
    ...current,
    [field]: value,
  });
};

export const previewPaymentApplication = (student, paymentAmount, overrides = {}) => {
  const source = normalizeStudentFinancials({
    ...student,
    ...overrides,
  });
  const requestedAmount = toPositiveAmount(paymentAmount);
  const availableBalance = source.TotalBalance;
  const appliedAmount = Math.min(requestedAmount, availableBalance);
  const rejectedAmount = roundCurrency(requestedAmount - appliedAmount);

  if (source.PaymentMode === PAYMENT_MODES.FULL) {
    const nextFullPaymentAmount = roundCurrency(source.FullPaymentAmount + appliedAmount);
    const nextStudent = normalizeStudentFinancials({
      ...source,
      FullPaymentAmount: nextFullPaymentAmount,
    });

    return {
      mode: source.PaymentMode,
      requestedAmount,
      appliedAmount,
      rejectedAmount,
      outstandingBefore: source.TotalBalance,
      outstandingAfter: nextStudent.TotalBalance,
      breakdown: [
        {
          field: "FullPaymentAmount",
          label: "Full Payment",
          before: source.FullPaymentAmount,
          applied: appliedAmount,
          after: nextStudent.FullPaymentAmount,
        },
      ],
      nextStudent,
    };
  }

  const nextBalances = getInstallmentBalances(source);
  const breakdown = [];
  const currentIndex = getCurrentInstallmentIndex(nextBalances);

  if (currentIndex !== -1) {
    const currentField = INSTALLMENT_FIELDS[currentIndex];
    const currentDue = nextBalances[currentField];
    const difference = roundCurrency(currentDue - appliedAmount);

    if (currentIndex === INSTALLMENT_FIELDS.length - 1) {
      nextBalances[currentField] = roundCurrency(Math.max(currentDue - appliedAmount, 0));
    } else {
      if (difference > 0) {
        nextBalances[currentField] = 0;
        const nextField = INSTALLMENT_FIELDS[currentIndex + 1];
        nextBalances[nextField] = roundCurrency(nextBalances[nextField] + difference);
      } else if (difference < 0) {
        nextBalances[currentField] = 0;
        let excess = Math.abs(difference);

        for (let index = currentIndex + 1; index < INSTALLMENT_FIELDS.length; index += 1) {
          const fieldName = INSTALLMENT_FIELDS[index];
          const reduction = Math.min(nextBalances[fieldName], excess);
          nextBalances[fieldName] = roundCurrency(nextBalances[fieldName] - reduction);
          excess = roundCurrency(excess - reduction);

          if (excess <= 0) {
            break;
          }
        }
      } else {
        nextBalances[currentField] = 0;
      }
    }
  }

  INSTALLMENT_FIELDS.forEach((field) => {
    breakdown.push({
      field,
      label: INSTALLMENT_LABELS[field],
      before: source[field],
      applied: roundCurrency(source[field] - nextBalances[field]),
      after: nextBalances[field],
    });
  });

  const nextStudent = normalizeStudentFinancials({
    ...source,
    ...nextBalances,
    TotalBalance: sumInstallments(nextBalances),
  });

  return {
    mode: source.PaymentMode,
    requestedAmount,
    appliedAmount,
    rejectedAmount,
    outstandingBefore: source.TotalBalance,
    outstandingAfter: nextStudent.TotalBalance,
    breakdown,
    nextStudent,
  };
};
