// Structured bank debit/credit alert emails commonly use labelled lines,
// e.g. "Amount: NGN 38,500.00" / "Narration: Shoprite Ikeja POS purchase".
// This parser looks for that structure rather than a specific sender, since
// several Nigerian banks use near-identical alert templates.

const { toDateString } = require("./generic");

const AMOUNT_LINE_RE = /Amount:\s*(?:₦|NGN)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i;
const NARRATION_RE = /Narration:\s*(.+)/i;
const TYPE_RE = /\b(debit|credit)(?:ed)?\b/i;

function canParse(email) {
  return AMOUNT_LINE_RE.test(email.text) && TYPE_RE.test(`${email.subject}\n${email.text}`);
}

function parse(email) {
  if (!canParse(email)) return null;
  const amountMatch = email.text.match(AMOUNT_LINE_RE);
  const typeMatch = `${email.subject}\n${email.text}`.match(TYPE_RE);
  if (!amountMatch || !typeMatch) return null;

  const narrationMatch = email.text.match(NARRATION_RE);
  const note = narrationMatch ? narrationMatch[1].trim() : email.subject || "";
  const merchant = note.split(/\s{2,}|\/|-{2,}/)[0].trim() || "Bank alert";

  return {
    merchant,
    amount: Number(amountMatch[1].replace(/,/g, "")),
    type: typeMatch[1].toLowerCase() === "credit" ? "in" : "out",
    date: toDateString(email.date),
    note,
  };
}

module.exports = { canParse, parse };
