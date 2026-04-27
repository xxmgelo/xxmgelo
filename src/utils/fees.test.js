import {
  PAYMENT_MODES,
  applyFeeFieldChange,
  getCollectedAmount,
  getEffectiveTotalFee,
  getReminderDueDetails,
  normalizeStudentFinancials,
  previewPaymentApplication,
} from "./fees";

describe("fee utilities", () => {
  test("normalizes installment balances and keeps total balance in sync", () => {
    const student = normalizeStudentFinancials({
      TotalFee: 5000,
      PaymentMode: PAYMENT_MODES.INSTALLMENT,
      Downpayment: 1000,
      Prelim: 1000,
      Midterm: 1000,
      PreFinal: 1000,
      Finals: 1000,
    });

    expect(student.TotalBalance).toBe(5000);
    expect(getCollectedAmount(student)).toBe(0);
  });

  test("distributes installment payments in order and blocks overpayment", () => {
    const preview = previewPaymentApplication(
      {
        TotalFee: 5000,
        PaymentMode: PAYMENT_MODES.INSTALLMENT,
        Downpayment: 1000,
        Prelim: 1000,
        Midterm: 1000,
        PreFinal: 1000,
        Finals: 1000,
      },
      2600
    );

    expect(preview.appliedAmount).toBe(2600);
    expect(preview.rejectedAmount).toBe(0);
    expect(preview.nextStudent.Downpayment).toBe(0);
    expect(preview.nextStudent.Prelim).toBe(0);
    expect(preview.nextStudent.Midterm).toBe(400);
    expect(preview.nextStudent.PreFinal).toBe(1000);
    expect(preview.nextStudent.Finals).toBe(1000);
    expect(preview.nextStudent.TotalBalance).toBe(2400);

    const overpayment = previewPaymentApplication(preview.nextStudent, 5000);
    expect(overpayment.appliedAmount).toBe(2400);
    expect(overpayment.rejectedAmount).toBe(2600);
    expect(overpayment.nextStudent.TotalBalance).toBe(0);
  });

  test("forwards installment shortfall to the next installment", () => {
    const preview = previewPaymentApplication(
      {
        TotalFee: 24000,
        PaymentMode: PAYMENT_MODES.INSTALLMENT,
        Downpayment: 4800,
        Prelim: 4800,
        Midterm: 4800,
        PreFinal: 4800,
        Finals: 4800,
        TotalBalance: 24000,
      },
      4300
    );

    expect(preview.nextStudent.Downpayment).toBe(0);
    expect(preview.nextStudent.Prelim).toBe(5300);
    expect(preview.nextStudent.Midterm).toBe(4800);
    expect(preview.nextStudent.PreFinal).toBe(4800);
    expect(preview.nextStudent.Finals).toBe(4800);
    expect(preview.nextStudent.TotalBalance).toBe(19700);
  });

  test("reduces the next installment when the current installment is overpaid", () => {
    const preview = previewPaymentApplication(
      {
        TotalFee: 24000,
        PaymentMode: PAYMENT_MODES.INSTALLMENT,
        Downpayment: 4800,
        Prelim: 4800,
        Midterm: 4800,
        PreFinal: 4800,
        Finals: 4800,
        TotalBalance: 24000,
      },
      5300
    );

    expect(preview.nextStudent.Downpayment).toBe(0);
    expect(preview.nextStudent.Prelim).toBe(4300);
    expect(preview.nextStudent.Midterm).toBe(4800);
    expect(preview.nextStudent.PreFinal).toBe(4800);
    expect(preview.nextStudent.Finals).toBe(4800);
    expect(preview.nextStudent.TotalBalance).toBe(18700);
  });

  test("applies full payments directly to the full payment amount", () => {
    const preview = previewPaymentApplication(
      {
        TotalFee: 5000,
        PaymentMode: PAYMENT_MODES.FULL,
        FullPaymentAmount: 1500,
      },
      4000
    );

    expect(preview.appliedAmount).toBe(3500);
    expect(preview.rejectedAmount).toBe(500);
    expect(preview.nextStudent.FullPaymentAmount).toBe(5000);
    expect(preview.nextStudent.TotalBalance).toBe(0);
  });

  test("rebalances installment totals when the admin edits total fee", () => {
    const updated = applyFeeFieldChange(
      {
        TotalFee: 5000,
        PaymentMode: PAYMENT_MODES.INSTALLMENT,
        Downpayment: 1000,
        Prelim: 1000,
        Midterm: 1000,
        PreFinal: 1000,
        Finals: 1000,
      },
      "TotalFee",
      4200
    );

    expect(updated.TotalFee).toBe(4200);
    expect(updated.TotalBalance).toBe(4200);
    expect(updated.Downpayment).toBe(840);
    expect(updated.Prelim).toBe(840);
    expect(updated.Midterm).toBe(840);
    expect(updated.PreFinal).toBe(840);
    expect(updated.Finals).toBe(840);
  });

  test("keeps installment columns cleared for full payment mode", () => {
    const updated = applyFeeFieldChange(
      {
        TotalFee: 0,
        PaymentMode: PAYMENT_MODES.FULL,
        FullPaymentAmount: 0,
      },
      "TotalFee",
      24000
    );

    expect(updated.TotalFee).toBe(24000);
    expect(updated.Downpayment).toBe(0);
    expect(updated.Prelim).toBe(0);
    expect(updated.Midterm).toBe(0);
    expect(updated.PreFinal).toBe(0);
    expect(updated.Finals).toBe(0);
    expect(updated.TotalBalance).toBe(24000);
  });

  test("applies discount to installment total and schedule", () => {
    const updated = applyFeeFieldChange(
      {
        TotalFee: 48000,
        PaymentMode: PAYMENT_MODES.INSTALLMENT,
        Downpayment: 9600,
        Prelim: 9600,
        Midterm: 9600,
        PreFinal: 9600,
        Finals: 9600,
      },
      "Discount",
      50
    );

    expect(updated.Discount).toBe(50);
    expect(updated.BaseTotalFee).toBe(48000);
    expect(updated.TotalFee).toBe(24000);
    expect(updated.TotalBalance).toBe(24000);
    expect(updated.Downpayment).toBe(4800);
    expect(updated.Prelim).toBe(4800);
    expect(updated.Midterm).toBe(4800);
    expect(updated.PreFinal).toBe(4800);
    expect(updated.Finals).toBe(4800);
  });

  test("keeps discount applied when total fee is edited after discount is set", () => {
    const updated = applyFeeFieldChange(
      {
        TotalFee: 24000,
        Discount: 50,
        PaymentMode: PAYMENT_MODES.INSTALLMENT,
        Downpayment: 4800,
        Prelim: 4800,
        Midterm: 4800,
        PreFinal: 4800,
        Finals: 4800,
      },
      "TotalFee",
      50000
    );

    expect(updated.Discount).toBe(50);
    expect(updated.BaseTotalFee).toBe(50000);
    expect(updated.TotalFee).toBe(25000);
    expect(updated.TotalBalance).toBe(25000);
  });

  test("derives effective total fee for display only", () => {
    const effective = getEffectiveTotalFee({
      TotalFee: 48000,
      Discount: 50,
    });

    expect(effective).toBe(24000);
  });

  test("maps alternate API id fields into StudentID for UI display", () => {
    const normalized = normalizeStudentFinancials({
      id_number: "2026-0099",
      Name: "Sample Student",
      Program: "BSIS",
      TotalFee: 10000,
      TotalBalance: 10000,
    });

    expect(normalized.StudentID).toBe("2026-0099");
  });

  test("resolves reminder due to the next unpaid installment stage", () => {
    const due = getReminderDueDetails({
      TotalFee: 24000,
      PaymentMode: PAYMENT_MODES.INSTALLMENT,
      Downpayment: 0,
      Prelim: 4800,
      Midterm: 4800,
      PreFinal: 4800,
      Finals: 4800,
      TotalBalance: 19200,
    });

    expect(due.type).toBe("installment_stage");
    expect(due.field).toBe("Prelim");
    expect(due.label).toBe("Prelim");
    expect(due.amount).toBe(4800);
  });

  test("falls back to total remaining balance when installments are all zero but balance remains", () => {
    const due = getReminderDueDetails({
      TotalFee: 24000,
      PaymentMode: PAYMENT_MODES.INSTALLMENT,
      Downpayment: 0,
      Prelim: 0,
      Midterm: 0,
      PreFinal: 0,
      Finals: 0,
      TotalBalance: 1200,
    });

    expect(due.type).toBe("remaining_balance");
    expect(due.label).toBe("Total Remaining Balance");
    expect(due.amount).toBe(1200);
  });
});
