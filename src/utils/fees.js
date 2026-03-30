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

export const INSTALLMENT_LABELS = {
  Downpayment: "Downpayment",
  Prelim: "Prelim",
  Midterm: "Midterm",
  PreFinal: "Pre-Final",
  Finals: "Finals",
};

const roundCurrency = (value) => Math.round(value * 100) / 100;
const INSTALLMENT_COUNT = INSTALLMENT_FIELDS.length;

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

export const sanitizePaymentMode = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === PAYMENT_MODES.FULL ? PAYMENT_MODES.FULL : PAYMENT_MODES.INSTALLMENT;
};

export const getInstallmentBalances = (student = {}) =>
  INSTALLMENT_FIELDS.reduce((balances, field) => {
    balances[field] = toPositiveAmount(student[field]);
    return balances;
  }, {});

export const sumInstallments = (student = {}) =>
  roundCurrency(
    INSTALLMENT_FIELDS.reduce((total, field) => total + toPositiveAmount(student[field]), 0)
  );

export const getCurrentInstallmentIndex = (student = {}) =>
  INSTALLMENT_FIELDS.findIndex((field) => toPositiveAmount(student[field]) > 0);

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
  const paymentMode = sanitizePaymentMode(student.PaymentMode || student.payment_mode);
  let installmentBalances = getInstallmentBalances(student);
  let totalFee = toPositiveAmount(student.TotalFee ?? student.total_fee);
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
      ...installmentBalances,
      PaymentMode: paymentMode,
      FullPaymentAmount: fullPaymentAmount,
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
    ...installmentBalances,
    PaymentMode: paymentMode,
    FullPaymentAmount: fullPaymentAmount,
    TotalFee: totalFee,
    TotalBalance: nextStageTotal,
  };
};

export const getCollectedAmount = (student = {}) => {
  const normalized = normalizeStudentFinancials(student);
  return roundCurrency(Math.max(normalized.TotalFee - normalized.TotalBalance, 0));
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
    const nextTotalFee = toPositiveAmount(value);
    const nextInstallments = distributeTotalAcrossInstallments(nextTotalFee);

    if (current.PaymentMode === PAYMENT_MODES.FULL) {
      return normalizeStudentFinancials({
        ...current,
        ...nextInstallments,
        TotalFee: nextTotalFee,
      });
    }

    return normalizeStudentFinancials({
      ...current,
      ...nextInstallments,
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
      nextBalances[currentField] = 0;

      if (difference > 0) {
        const nextField = INSTALLMENT_FIELDS[currentIndex + 1];
        nextBalances[nextField] = roundCurrency(nextBalances[nextField] + difference);
      } else if (difference < 0) {
        let excess = Math.abs(difference);

        for (let index = currentIndex + 1; index < INSTALLMENT_FIELDS.length; index += 1) {
          const field = INSTALLMENT_FIELDS[index];
          const reduction = Math.min(nextBalances[field], excess);
          nextBalances[field] = roundCurrency(nextBalances[field] - reduction);
          excess = roundCurrency(excess - reduction);

          if (excess <= 0) {
            break;
          }
        }
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
