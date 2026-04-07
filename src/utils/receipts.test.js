import { PAYMENT_MODES } from "./fees";
import { buildPaymentReceiptDraft } from "./receipts";

describe("payment receipt drafts", () => {
  test("builds professional installment payment confirmation", () => {
    const draft = buildPaymentReceiptDraft(
      {
        Name: "Juan Dela Cruz",
        StudentID: "2026-001",
        PaymentMode: PAYMENT_MODES.INSTALLMENT,
      },
      {
        mode: PAYMENT_MODES.INSTALLMENT,
        stage_label: "Prelim",
        stage_amount_paid: 2000,
        stage_amount_remaining: 4100,
        amount_applied: 2000,
      }
    );

    expect(draft.subject).toBe("Payment Confirmation - ACLC Fee Management System");
    expect(draft.message).toContain("This is to confirm that your recent tuition fee payment has been successfully recorded.");
    expect(draft.message).toContain("Stage: Prelim");
    expect(draft.message).toContain("Amount Paid:");
    expect(draft.message).toContain("Remaining Balance:");
    expect(draft.message).toContain("Please ensure that the remaining balance is settled within the required period.");
    expect(draft.message).not.toContain("Requested Amount");
    expect(draft.message).not.toContain("Applied Amount");
    expect(draft.message).not.toContain("Outstanding Before");
    expect(draft.message).not.toContain("Outstanding After");
    expect(draft.html).toContain("Payment Details");
    expect(draft.html).toContain("Prelim");
    expect(draft.html).toContain("receivednotif.png");
    expect(draft.html).toContain("font-family:'Inter'");
  });

  test("uses completion message when stage remaining balance is zero", () => {
    const draft = buildPaymentReceiptDraft(
      {
        Name: "Ana Reyes",
        StudentID: "2026-002",
        PaymentMode: PAYMENT_MODES.INSTALLMENT,
      },
      {
        mode: PAYMENT_MODES.INSTALLMENT,
        stage_label: "Prelim",
        stage_amount_paid: 6100,
        stage_amount_remaining: 0,
      }
    );

    expect(draft.message).toContain("This payment completes the required amount for this stage.");
    expect(draft.html).toContain("This payment completes the required amount for this stage.");
  });
});
