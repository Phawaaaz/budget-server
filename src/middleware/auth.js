// TODO(auth): placeholder only. Folio is single-user for now (Fawaz, per
// PRODUCT.md), so there's no real login yet. This just attaches a fixed
// user id so route handlers have a consistent req.user to build on once
// real authentication (and possibly multiple users) is added.
function attachUser(req, res, next) {
  req.user = { id: "fawaz" };
  next();
}

module.exports = { attachUser };
