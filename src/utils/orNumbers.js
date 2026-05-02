export const OR_NUMBER_PATTERN = /^OR-\d{4}-\d{6}$/;

const padSequence = (value) => String(value).padStart(6, "0");

export const normalizeOrNumber = (value) => String(value || "").trim().toUpperCase();

export const isValidOrNumber = (value) => OR_NUMBER_PATTERN.test(normalizeOrNumber(value));

export const collectExistingOrNumbers = (cache = {}) => {
  const numbers = new Set();

  Object.values(cache || {}).forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const directOr = normalizeOrNumber(entry.official_receipt);
    if (directOr) {
      numbers.add(directOr);
    }

    const paymentHistory = Array.isArray(entry.payment_history) ? entry.payment_history : [];
    paymentHistory.forEach((item) => {
      const itemOr = normalizeOrNumber(item?.or_number);
      if (itemOr) {
        numbers.add(itemOr);
      }
    });
  });

  return numbers;
};

export const generateNextOrNumber = (existingNumbers, year = new Date().getFullYear()) => {
  const normalizedYear = String(year);
  let maxSequence = 0;

  Array.from(existingNumbers || []).forEach((value) => {
    const normalized = normalizeOrNumber(value);
    const match = normalized.match(/^OR-(\d{4})-(\d{6})$/);
    if (!match || match[1] !== normalizedYear) {
      return;
    }

    maxSequence = Math.max(maxSequence, Number(match[2]) || 0);
  });

  return `OR-${normalizedYear}-${padSequence(maxSequence + 1)}`;
};
