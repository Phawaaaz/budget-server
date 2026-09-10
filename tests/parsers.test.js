const { test } = require("node:test");
const assert = require("node:assert/strict");

const { parseEmail } = require("../src/email/parsers");
const generic = require("../src/email/parsers/generic");
const paystack = require("../src/email/parsers/paystack");
const bankAlert = require("../src/email/parsers/bankAlert");

test("generic parser extracts a debit amount and type", () => {
  const result = generic.parse({
    from: "alerts@randomshop.com",
    subject: "Your purchase receipt",
    text: "Your card was charged N42,500.00 for this purchase.",
    date: "2026-09-04T10:00:00Z",
  });
  assert.deepEqual(result, {
    merchant: "Randomshop",
    amount: 42500,
    type: "out",
    date: "2026-09-04",
    note: "Your purchase receipt",
  });
});

test("generic parser extracts a credit amount and type", () => {
  const result = generic.parse({
    from: "no-reply@someservice.com",
    subject: "Payment received",
    text: "You have received a deposit of ₦180,000.",
    date: "2026-09-02T08:00:00Z",
  });
  assert.equal(result.type, "in");
  assert.equal(result.amount, 180000);
});

test("generic parser returns null when there's no amount or no type keyword", () => {
  assert.equal(
    generic.parse({ from: "a@b.com", subject: "Hello", text: "No money mentioned here.", date: null }),
    null
  );
  assert.equal(
    generic.parse({ from: "a@b.com", subject: "Newsletter", text: "₦5,000 mentioned but no keyword.", date: null }),
    null
  );
});

test("paystack parser only matches paystack senders", () => {
  assert.equal(
    paystack.parse({ from: "hello@otherbank.com", subject: "x", text: "Amount: NGN 1,000", date: null }),
    null
  );
});

test("paystack parser extracts a payout as credit", () => {
  const result = paystack.parse({
    from: "no-reply@paystack.com",
    subject: "Payout of ₦250,000.00 was successful",
    text: "Your payout of ₦250,000.00 has been sent to your bank account.",
    date: "2026-08-25T09:00:00Z",
  });
  assert.deepEqual(result, {
    merchant: "Paystack",
    amount: 250000,
    type: "in",
    date: "2026-08-25",
    note: "Payout of ₦250,000.00 was successful",
  });
});

test("bank alert parser reads structured Amount/Narration lines", () => {
  const result = bankAlert.parse({
    from: "alerts@somebank.com",
    subject: "Debit Alert",
    text: "Amount: NGN 38,500.00\nNarration: Shoprite Ikeja POS purchase\nDate: 06-SEP-2026",
    date: "2026-09-06T12:00:00Z",
  });
  assert.deepEqual(result, {
    merchant: "Shoprite Ikeja POS purchase",
    amount: 38500,
    type: "out",
    date: "2026-09-06",
    note: "Shoprite Ikeja POS purchase",
  });
});

test("bank alert parser recognizes a credit alert", () => {
  const result = bankAlert.parse({
    from: "alerts@somebank.com",
    subject: "Credit Alert",
    text: "Amount: NGN 350,000.00\nNarration: Client payment - September design project",
    date: "2026-09-05T12:00:00Z",
  });
  assert.equal(result.type, "in");
  assert.equal(result.amount, 350000);
});

test("parseEmail tries specific parsers before falling back to generic", () => {
  const paystackResult = parseEmail({
    from: "no-reply@paystack.com",
    subject: "Payment Received",
    text: "You received a payment of ₦50,000.",
    date: "2026-09-01T00:00:00Z",
  });
  assert.equal(paystackResult.merchant, "Paystack");

  const genericResult = parseEmail({
    from: "billing@mtn.com",
    subject: "Data plan renewal",
    text: "Your account was debited N15,000 for your monthly data plan.",
    date: "2026-09-03T00:00:00Z",
  });
  assert.equal(genericResult.merchant, "Mtn");
  assert.equal(genericResult.type, "out");

  assert.equal(
    parseEmail({ from: "newsletter@example.com", subject: "Hi", text: "Just saying hello.", date: null }),
    null
  );
});
