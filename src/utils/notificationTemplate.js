const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const resolveAssetUrl = (fileName) => {
  return fileName;
};

const buildInfoRow = (label, value) => `
  <tr>
    <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 120px;">${escapeHtml(label)}</td>
    <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${escapeHtml(value)}</td>
  </tr>
`;

const buildHighlightRow = (label, value) => `
  <tr>
    <td style="padding: 6px 0; color: #374151; font-size: 13px; width: 170px;">${escapeHtml(label)}</td>
    <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${escapeHtml(value)}</td>
  </tr>
`;

export const formatCurrency = (amount) => currencyFormatter.format(Number(amount || 0));

export const buildPaymentNotificationHtml = ({
  title = "Payment Notification",
  subtitle = "ACLC Fee Management System",
  notificationIcon = "",
  notificationIconAlt = "Notification",
  headerCentered = false,
  headerShowLogo = true,
  studentName = "",
  studentId = "",
  bodyParagraphs = [],
  highlightRows = [],
  breakdownRows = [],
  closing = "Thank you.",
  closingPlacement = "footer",
  systemName = "ACLC Fee Management System",
  footerShowLogo = false,
  footerCenteredBrand = false,
}) => {
  const safeParagraphs = (bodyParagraphs || []).filter(Boolean);
  const safeHighlights = (highlightRows || []).filter((row) => row && row.label);
  const safeBreakdownRows = (breakdownRows || []).filter((row) => row && row.label);
  const logoUrl = resolveAssetUrl("aclclogo.png");
  const iconUrl = notificationIcon ? resolveAssetUrl(notificationIcon) : "";
  const shouldRenderClosingInBody = closingPlacement === "body";
  const footerAlign = footerCenteredBrand ? "center" : "left";
  const footerBrandGap = footerShowLogo ? "6px" : "0";
  const footerLogoMargin = footerCenteredBrand ? `0 auto ${footerBrandGap} auto` : `0 0 ${footerBrandGap} 0`;
  const headerHtml = headerCentered
    ? `
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="text-align:center;">
                  ${iconUrl
      ? `<img src="${escapeHtml(iconUrl)}" alt="${escapeHtml(notificationIconAlt)}" width="36" height="36" style="display:block; margin:0 auto 10px auto; border:0; width:36px; height:36px;" />`
      : ""}
                  ${headerShowLogo
      ? `<img src="${escapeHtml(logoUrl)}" alt="ACLC Logo" width="44" height="44" style="display:block; margin:0 auto 10px auto; border:0; width:44px; height:44px;" />`
      : ""}
                  <div style="font-size:22px; font-weight:700; color:#111827; line-height:1.2;">${escapeHtml(title)}</div>
                  <div style="font-size:13px; color:#6b7280; margin-top:4px;">${escapeHtml(subtitle)}</div>
                </td>
              </tr>
            </table>
          `
    : `
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width:56px; vertical-align:middle;">
                  ${headerShowLogo
      ? `<img src="${escapeHtml(logoUrl)}" alt="ACLC Logo" width="44" height="44" style="display:block; border:0; width:44px; height:44px;" />`
      : ""}
                </td>
                <td style="vertical-align:middle;">
                  <div style="font-size:18px; font-weight:700; color:#111827; line-height:1.2;">${escapeHtml(title)}</div>
                  <div style="font-size:12px; color:#6b7280; margin-top:4px;">${escapeHtml(subtitle)}</div>
                </td>
                <td style="width:40px; vertical-align:middle; text-align:right;">
                  ${iconUrl
      ? `<img src="${escapeHtml(iconUrl)}" alt="${escapeHtml(notificationIconAlt)}" width="28" height="28" style="display:inline-block; border:0; width:28px; height:28px;" />`
      : ""}
                </td>
              </tr>
            </table>
          `;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0; padding:0; background:#f3f4f6; font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px; width:100%; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
        <tr>
          <td style="padding:20px 24px; background:#ffffff; border-bottom:1px solid #e5e7eb;">
            ${headerHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:22px 24px 10px 24px;">
            ${safeParagraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#111827;">${escapeHtml(paragraph)}</p>`
    )
    .join("")}
            ${shouldRenderClosingInBody
    ? `<p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#111827;">${escapeHtml(closing)}</p>`
    : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 10px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px;">
              <tr><td style="font-size:12px; font-weight:700; color:#374151; padding:0 0 8px 0;">Student Information</td></tr>
              ${buildInfoRow("Student Name", studentName || "N/A")}
              ${buildInfoRow("Student ID", studentId || "N/A")}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 14px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eef6ff; border:1px solid #bfd9ff; border-radius:10px; padding:12px;">
              <tr><td style="font-size:12px; font-weight:700; color:#1e3a8a; padding:0 0 8px 0;">Payment Details</td></tr>
              ${safeHighlights.map((row) => buildHighlightRow(row.label, row.value)).join("")}
            </table>
          </td>
        </tr>
        ${safeBreakdownRows.length > 0 ? `
        <tr>
          <td style="padding:0 24px 14px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:12px;">
              <tr><td style="font-size:12px; font-weight:700; color:#334155; padding:0 0 8px 0;">Balance Breakdown</td></tr>
              ${safeBreakdownRows.map((row) => buildHighlightRow(row.label, row.value)).join("")}
            </table>
          </td>
        </tr>
        ` : ""}
        <tr>
          <td style="padding:8px 24px 22px 24px; border-top:1px solid #e5e7eb;">
            ${shouldRenderClosingInBody
    ? ""
    : `<p style="margin:12px 0 6px 0; font-size:14px; line-height:1.6; color:#111827;">${escapeHtml(closing)}</p>`}
            <div style="text-align:${footerAlign}; margin-top:12px;">
              ${footerShowLogo
    ? `<img src="${escapeHtml(logoUrl)}" alt="ACLC Logo" width="34" height="34" style="display:block; margin:${footerLogoMargin}; border:0; width:34px; height:34px;" />`
    : ""}
              <p style="margin:0; font-size:13px; font-weight:700; color:#111827;">${escapeHtml(systemName)}</p>
            </div>
            <p style="margin:8px 0 0 0; font-size:11px; color:#6b7280; text-align:${footerAlign};">This is a system-generated notification. For payment verification, please contact the accounting office.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
};
