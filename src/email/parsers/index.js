const paystack = require("./paystack");
const bankAlert = require("./bankAlert");
const generic = require("./generic");

// Sender/format-specific parsers are tried first (most reliable); the
// generic keyword parser is the fallback for anything unrecognized.
const parsers = [paystack, bankAlert];

function parseEmail(email) {
  for (const parser of parsers) {
    const result = parser.parse(email);
    if (result) return result;
  }
  return generic.parse(email);
}

module.exports = { parseEmail };
