const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

// ── Upsert current subscription ───────────────────────────────────────────────
exports.upsertSubscription = async (req, res) => {
  const { id } = req.params;
  const hostel = await prisma.hostel.findFirst({ where: { id, deletedAt: null } });
  if (!hostel) return fail(res, 'Hostel not found', 404);

  const {
    planName,
    planId       = null,
    status       = 'active',
    billingCycle = null,
    seatLimit,
    staffLimit,
    startsAt,
    endsAt       = null,
    trialEndsAt  = null,
    graceEndsAt  = null,
  } = req.body;

  if (!planName) return fail(res, 'Plan name is required');

  const existing = await prisma.hostelSubscription.findFirst({
    where: { hostelId: id, isCurrent: true },
  });

  const fields = {
    planName,
    planId:      planId ?? null,
    status,
    billingCycle: billingCycle ?? null,
    seatLimit:   seatLimit   != null ? Number(seatLimit)  : null,
    staffLimit:  staffLimit  != null ? Number(staffLimit) : null,
    startsAt:    startsAt    ? new Date(startsAt)    : (existing?.startsAt ?? new Date()),
    endsAt:      endsAt      ? new Date(endsAt)      : null,
    trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
    graceEndsAt: graceEndsAt ? new Date(graceEndsAt) : null,
  };

  let subscription;
  if (existing) {
    subscription = await prisma.hostelSubscription.update({
      where: { id: existing.id },
      data:  fields,
    });
  } else {
    subscription = await prisma.hostelSubscription.create({
      data: { hostelId: id, isCurrent: true, ...fields },
    });
  }

  return ok(res, subscription);
};

// ── List payments ─────────────────────────────────────────────────────────────
exports.listPayments = async (req, res) => {
  const { id } = req.params;
  const hostel = await prisma.hostel.findFirst({ where: { id, deletedAt: null } });
  if (!hostel) return fail(res, 'Hostel not found', 404);

  const payments = await prisma.hostelPayment.findMany({
    where:   { hostelId: id },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, payments);
};

// ── Record payment ────────────────────────────────────────────────────────────
exports.recordPayment = async (req, res) => {
  const { id } = req.params;
  const hostel = await prisma.hostel.findFirst({ where: { id, deletedAt: null } });
  if (!hostel) return fail(res, 'Hostel not found', 404);

  const {
    amount,
    currency      = 'INR',
    paymentMethod = null,
    status        = 'paid',
    paidAt,
    invoiceUrl    = null,
    subscriptionId = null,
  } = req.body;

  if (amount == null || amount === '') return fail(res, 'Amount is required');

  const payment = await prisma.hostelPayment.create({
    data: {
      hostelId:      id,
      amount:        Number(amount),
      currency,
      paymentMethod: paymentMethod ?? null,
      status,
      paidAt:        paidAt ? new Date(paidAt) : null,
      invoiceUrl:    invoiceUrl ?? null,
      subscriptionId: subscriptionId ?? null,
    },
  });
  return ok(res, payment, 'Payment recorded', 201);
};
