// Simple verification code generator
exports.generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store verification code (in-memory for demo - use Redis in production)
const verificationStore = new Map();

exports.storeVerificationCode = (phone, code) => {
  verificationStore.set(phone, {
    code,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
};

exports.validateVerificationCode = (phone, code) => {
  const stored = verificationStore.get(phone);
  if (!stored) return false;
  if (stored.expires < Date.now()) {
    verificationStore.delete(phone);
    return false;
  }
  if (stored.code !== code) return false;
  verificationStore.delete(phone);
  return true;
};

