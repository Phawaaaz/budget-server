// Fallback parser: no sender-specific format assumed, just looks for a
// naira amount and a debit/credit keyword anywhere in the subject + body.

const AMOUNT_RE = /(?:₦|NGN|N)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i;
const DEBIT_RE = /\b(debit(?:ed)?|purchase|payment of|charged|deducted|withdrawal)\b/i;
const CREDIT_RE = /\b(credit(?:ed)?|received|deposit|payout|payment received)\b/i;

function parseAmount(text) {
  const match = text.match(AMOUNT_RE);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

function parseType(text) {
  if (DEBIT_RE.test(text)) return "out";
  if (CREDIT_RE.test(text)) return "in";
  return null;
}

function guessMerchant(email) {
  const domainMatch = email.from.match(/@([\w.-]+)/);
  const domain = domainMatch ? domainMatch[1].split(".")[0] : "Unknown sender";
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function toDateString(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function parse(email) {
  const haystack = `${email.subject}\n${email.text}`;
  const amount = parseAmount(haystack);
  const type = parseType(haystack);
  if (amount === null || !type) return null;
  return {
    merchant: guessMerchant(email),
    amount,
    type,
    date: toDateString(email.date),
    note: email.subject || "",
  };
}

module.exports = { parse, parseAmount, parseType, guessMerchant, toDateString };
