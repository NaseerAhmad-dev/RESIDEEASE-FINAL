function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateCouponNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `M${date}${rand}`;
}

function generateReceiptNumber() {
  return 'GR-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message = 'Error', status = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = {
  generateId,
  generateCouponNumber,
  generateReceiptNumber,
  generateOtp,
  todayString,
  ok,
  fail,
};
