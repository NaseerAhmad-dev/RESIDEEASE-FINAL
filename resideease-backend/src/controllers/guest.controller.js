const { prisma } = require('../config/db');
const { generateOtp, generateReceiptNumber, ok, fail } = require('../utils/helpers');

exports.generateOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\d{10}$/.test(phone)) return fail(res, 'A valid 10-digit phone number is required');

  const otp = generateOtp();
  await prisma.otp.upsert({
    where: { phone },
    update: { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    create: { phone, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });

  console.log(`[OTP] ${phone} → ${otp}`);
  const data = process.env.NODE_ENV === 'production' ? {} : { otp };
  return ok(res, data, 'OTP sent to the registered number');
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return fail(res, 'Phone and OTP are required');

  const record = await prisma.otp.findUnique({ where: { phone } });
  if (!record) return fail(res, 'No OTP found for this number. Please request a new one');
  if (Date.now() > record.expiresAt.getTime()) {
    await prisma.otp.delete({ where: { phone } });
    return fail(res, 'OTP has expired. Please request a new one');
  }
  if (record.otp !== String(otp)) return fail(res, 'Invalid OTP');

  await prisma.otp.delete({ where: { phone } });
  return ok(res, { verified: true }, 'OTP verified successfully');
};

exports.register = async (req, res) => {
  const { fullName, phone, aadhaarNumber, feePaid, feeAmount } = req.body;
  if (!fullName || !phone || !aadhaarNumber) {
    return fail(res, 'fullName, phone, and aadhaarNumber are required');
  }
  if (!/^\d{10}$/.test(phone)) return fail(res, 'Invalid phone number');
  if (!/^\d{12}$/.test(aadhaarNumber)) return fail(res, 'Aadhaar number must be 12 digits');

  const settings = await prisma.settings.findFirst();
  const defaultFee = settings?.guestFee ?? 200;

  const guest = await prisma.guest.create({
    data: {
      fullName,
      phone,
      aadhaarNumber,
      feePaid: feePaid || false,
      feeAmount: feeAmount ?? defaultFee,
      receiptNumber: generateReceiptNumber(),
      status: feePaid ? 'paid' : 'otp_verified',
    },
  });
  return ok(res, guest, 'Guest registered successfully', 201);
};

exports.getAll = async (req, res) => {
  const guests = await prisma.guest.findMany();
  return ok(res, guests);
};
