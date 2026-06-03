const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const audits = await prisma.auditRecord.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] });
  return ok(res, audits);
};

exports.getByMonthYear = async (req, res) => {
  const month = parseInt(req.params.month, 10);
  const year  = parseInt(req.params.year,  10);
  const audit = await prisma.auditRecord.findUnique({ where: { month_year: { month, year } } });
  if (!audit) return fail(res, 'Audit record not found', 404);
  return ok(res, audit);
};

exports.publish = async (req, res) => {
  const { month, year, daysInMonth, totalSupplierBill, totalBillableDays, perDayRate, studentCount, rebatedCount, totalStudentBill, rows } = req.body;
  if (month == null || year == null || !rows) return fail(res, 'Missing required fields: month, year, rows');
  const audit = await prisma.auditRecord.upsert({
    where:  { month_year: { month: parseInt(month, 10), year: parseInt(year, 10) } },
    create: { month: parseInt(month, 10), year: parseInt(year, 10), daysInMonth, totalSupplierBill, totalBillableDays, perDayRate, studentCount, rebatedCount, totalStudentBill, rows },
    update: { publishedAt: new Date(), daysInMonth, totalSupplierBill, totalBillableDays, perDayRate, studentCount, rebatedCount, totalStudentBill, rows },
  });
  return ok(res, audit, 'Audit published', 201);
};
