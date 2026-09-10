const { parseAmount, toDateString } = require("./generic");

function canParse(email) {
  return /paystack/i.test(email.from);
}

function parse(email) {
  if (!canParse(email)) return null;
  const haystack = `${email.subject}\n${email.text}`;
  const amount = parseAmount(haystack);
  if (amount === null) return null;
  const type = /payout|received|deposit/i.test(haystack) ? "in" : "out";
  return {
    merchant: "Paystack",
    amount,
    type,
    date: toDateString(email.date),
    note: email.subject || "",
  };
}

module.exports = { canParse, parse };
