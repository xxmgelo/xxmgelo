import { PAYMENT_MODES } from "./fees";
import { buildReminderDraft } from "./reminders";

describe("reminder drafts", () => {
  test("builds professional installment reminder with stage-only balance", () => {
    const draft = buildReminderDraft({
      Name: "Juan Dela Cruz",
      StudentID: "2026-001",
      PaymentMode: PAYMENT_MODES.INSTALLMENT,
      Downpayment: 0,
      Prelim: 4100,
      Midterm: 4800,
      PreFinal: 4800,
      Finals: 4800,
      TotalBalance: 18500,
    });

    expect(draft.subject).toBe("Tuition Fee Payment Reminder - ACLC College of Manila");
    expect(draft.dueType).toBe("installment_stage");
    expect(draft.dueLabel).toBe("Prelim");
    expect(draft.message).toContain("This is to inform you that your Prelim tuition fee payment remains outstanding.");
    expect(draft.message).toContain("The remaining balance for this payment stage is");
    expect(draft.message).not.toContain("friendly reminder");
    expect(draft.html).toContain("Payment Reminder");
    expect(draft.html).toContain("Payment Stage");
    expect(draft.html).toContain("Prelim");
    expect(draft.html).toContain("remindernotif.png");
    expect(draft.html).toContain("font-family:'Inter'");
  });

  test("falls back to remaining total balance only when all stages are cleared", () => {
    const draft = buildReminderDraft({
      Name: "Maria Santos",
      StudentID: "2026-002",
      PaymentMode: PAYMENT_MODES.INSTALLMENT,
      Downpayment: 0,
      Prelim: 0,
      Midterm: 0,
      PreFinal: 0,
      Finals: 0,
      TotalBalance: 1200,
    });

    expect(draft.dueType).toBe("remaining_balance");
    expect(draft.message).toContain("The remaining total balance is");
    expect(draft.message).not.toContain("Total Fee");
  });
});
