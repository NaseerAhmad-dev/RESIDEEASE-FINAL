require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STUDENTS = [
  { firstName: 'Amir',     lastName: 'Wani',    email: 'amir.wani@university.edu',      phone: '9419001234', rollNumber: 'CS2021001', gender: 'male',   department: 'Computer Science',       currentSemester: '5th Semester', checkInDate: '2025-08-01', residenceExpiry: '2026-07-31', roomNumber: '101', selectedRoom: 'Triple Sharing', roomPrice: 3800, maintenanceCharge: 400, securityDeposit: 1500, messFee: 3200, totalPayment: 8900,  paidAmount: 8900,  paymentStatus: 'paid',    lastPaymentDate: '2025-08-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Zara',     lastName: 'Rather',  email: 'zara.rather@university.edu',     phone: '9419005678', rollNumber: 'EC2021045', gender: 'female', department: 'Electronics & Comm.',    currentSemester: '3rd Semester', checkInDate: '2025-07-15', residenceExpiry: '2026-06-30', roomNumber: '104', selectedRoom: 'Double Sharing', roomPrice: 5500, maintenanceCharge: 500, securityDeposit: 2000, messFee: 3200, totalPayment: 11200, paidAmount: 11200, paymentStatus: 'paid',    lastPaymentDate: '2025-07-15', residencyAccount: 'university', status: 'active' },
  { firstName: 'Bilal',    lastName: 'Lone',    email: 'bilal.lone@university.edu',      phone: '9797009999', rollNumber: 'CE2021003', gender: 'male',   department: 'Civil Engg.',            currentSemester: '7th Semester', checkInDate: '2025-11-01', residenceExpiry: '2026-10-31', roomNumber: '108', selectedRoom: 'Single',         roomPrice: 8000, maintenanceCharge: 600, securityDeposit: 3000, messFee: 3200, totalPayment: 14800, paidAmount: 14800, paymentStatus: 'paid',    lastPaymentDate: '2025-11-01', residencyAccount: 'residency',  status: 'active' },
  { firstName: 'Hina',     lastName: 'Bhat',    email: 'hina.bhat@university.edu',       phone: '9906112345', rollNumber: 'MA2022067', gender: 'female', department: 'Mathematics',            currentSemester: '2nd Semester', checkInDate: '2025-08-01', residenceExpiry: '2026-07-31', roomNumber: '113', selectedRoom: 'Double Sharing', roomPrice: 5500, maintenanceCharge: 500, securityDeposit: 2000, messFee: 3200, totalPayment: 11200, paidAmount: 8000,  paymentStatus: 'partial',  lastPaymentDate: '2025-09-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Umar',     lastName: 'Mir',     email: 'umar.mir@university.edu',        phone: '9419078901', rollNumber: 'ME2020012', gender: 'male',   department: 'Mechanical Engg.',       currentSemester: '6th Semester', checkInDate: '2024-08-01', residenceExpiry: '2025-07-31', roomNumber: '117', selectedRoom: 'Triple Sharing', roomPrice: 3800, maintenanceCharge: 400, securityDeposit: 1500, messFee: 3200, totalPayment: 8900,  paidAmount: 5400,  paymentStatus: 'overdue',  lastPaymentDate: '2024-10-15', residencyAccount: 'university', status: 'expired' },
  { firstName: 'Sana',     lastName: 'Malik',   email: 'sana.malik@university.edu',      phone: '9622034521', rollNumber: 'CS2023089', gender: 'female', department: 'Computer Science',       currentSemester: '1st Semester', checkInDate: '2025-11-15', residenceExpiry: '2026-11-14', roomNumber: '202', selectedRoom: 'Single',         roomPrice: 8000, maintenanceCharge: 600, securityDeposit: 3000, messFee: 3200, totalPayment: 14800, paidAmount: 3000,  paymentStatus: 'partial',  lastPaymentDate: '2025-11-10', residencyAccount: 'residency',  status: 'pending' },
  { firstName: 'Tariq',    lastName: 'Shah',    email: 'tariq.shah@university.edu',      phone: '9419056712', rollNumber: 'PH2019034', gender: 'male',   department: 'Physics',                currentSemester: '4th Semester', checkInDate: '2024-08-01', residenceExpiry: '2026-01-31', roomNumber: '205', selectedRoom: 'Triple Sharing', roomPrice: 3800, maintenanceCharge: 400, securityDeposit: 1500, messFee: 3200, totalPayment: 8900,  paidAmount: 8900,  paymentStatus: 'paid',    lastPaymentDate: '2025-02-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Ruqaiya',  lastName: 'Ganie',   email: 'ruqaiya.ganie@university.edu',   phone: '9906098765', rollNumber: 'BT2023056', gender: 'female', department: 'Biotechnology',          currentSemester: '2nd Semester', checkInDate: '2025-08-01', residenceExpiry: '2026-07-31', roomNumber: '210', selectedRoom: 'Double Sharing', roomPrice: 5500, maintenanceCharge: 500, securityDeposit: 2000, messFee: 3200, totalPayment: 11200, paidAmount: 11200, paymentStatus: 'paid',    lastPaymentDate: '2025-08-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Faisal',   lastName: 'Dar',     email: 'faisal.dar@university.edu',      phone: '9419023456', rollNumber: 'CH2020078', gender: 'male',   department: 'Chemistry',              currentSemester: '8th Semester', checkInDate: '2024-08-01', residenceExpiry: '2025-12-31', roomNumber: '215', selectedRoom: 'Single',         roomPrice: 8000, maintenanceCharge: 600, securityDeposit: 3000, messFee: 3200, totalPayment: 14800, paidAmount: 9200,  paymentStatus: 'overdue',  lastPaymentDate: '2024-12-01', residencyAccount: 'residency',  status: 'expired' },
  { firstName: 'Nadia',    lastName: 'Najar',   email: 'nadia.najar@university.edu',     phone: '9797045678', rollNumber: 'DS2022091', gender: 'female', department: 'Data Science',           currentSemester: '3rd Semester', checkInDate: '2025-01-01', residenceExpiry: '2026-12-31', roomNumber: '219', selectedRoom: 'Triple Sharing', roomPrice: 3800, maintenanceCharge: 400, securityDeposit: 1500, messFee: 3200, totalPayment: 8900,  paidAmount: 8900,  paymentStatus: 'paid',    lastPaymentDate: '2025-01-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Imran',    lastName: 'Parray',  email: 'imran.parray@university.edu',    phone: '9419067890', rollNumber: 'IT2021023', gender: 'male',   department: 'Information Technology', currentSemester: '5th Semester', checkInDate: '2025-08-01', residenceExpiry: '2026-07-31', roomNumber: '303', selectedRoom: 'Triple Sharing', roomPrice: 3800, maintenanceCharge: 400, securityDeposit: 1500, messFee: 3200, totalPayment: 8900,  paidAmount: 5700,  paymentStatus: 'partial',  lastPaymentDate: '2025-10-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Asiya',    lastName: 'Khanday', email: 'asiya.khanday@university.edu',   phone: '9906134567', rollNumber: 'CS2022112', gender: 'female', department: 'Computer Science',       currentSemester: '4th Semester', checkInDate: '2025-06-01', residenceExpiry: '2026-05-31', roomNumber: '309', selectedRoom: 'Double Sharing', roomPrice: 5500, maintenanceCharge: 500, securityDeposit: 2000, messFee: 3200, totalPayment: 11200, paidAmount: 11200, paymentStatus: 'paid',    lastPaymentDate: '2025-06-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Waseem',   lastName: 'Bhat',    email: 'waseem.bhat@university.edu',     phone: '9622056789', rollNumber: 'EE2023034', gender: 'male',   department: 'Electrical Engg.',       currentSemester: '1st Semester', checkInDate: '2025-11-01', residenceExpiry: '2026-10-31', roomNumber: '314', selectedRoom: 'Triple Sharing', roomPrice: 3800, maintenanceCharge: 400, securityDeposit: 1500, messFee: 3200, totalPayment: 8900,  paidAmount: 8900,  paymentStatus: 'paid',    lastPaymentDate: '2025-11-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Lubna',    lastName: 'Sofi',    email: 'lubna.sofi@university.edu',      phone: '9419089012', rollNumber: 'AR2019056', gender: 'female', department: 'Architecture',           currentSemester: '8th Semester', checkInDate: '2024-01-01', residenceExpiry: '2025-08-31', roomNumber: '318', selectedRoom: 'Single',         roomPrice: 8000, maintenanceCharge: 600, securityDeposit: 3000, messFee: 3200, totalPayment: 14800, paidAmount: 14800, paymentStatus: 'paid',    lastPaymentDate: '2024-08-01', residencyAccount: 'residency',  status: 'active' },
  { firstName: 'Adil',     lastName: 'Magray',  email: 'adil.magray@university.edu',     phone: '9797078901', rollNumber: 'AE2022078', gender: 'male',   department: 'Aerospace Engg.',        currentSemester: '2nd Semester', checkInDate: '2025-08-01', residenceExpiry: '2026-07-31', roomNumber: '401', selectedRoom: 'Triple Sharing', roomPrice: 3800, maintenanceCharge: 400, securityDeposit: 1500, messFee: 3200, totalPayment: 8900,  paidAmount: 4500,  paymentStatus: 'partial',  lastPaymentDate: '2025-10-15', residencyAccount: 'university', status: 'active' },
  { firstName: 'Shaheena', lastName: 'Wani',    email: 'shaheena.wani@university.edu',   phone: '9906167890', rollNumber: 'ECO2022045', gender: 'female', department: 'Economics',             currentSemester: '3rd Semester', checkInDate: '2025-08-01', residenceExpiry: '2026-07-31', roomNumber: '406', selectedRoom: 'Double Sharing', roomPrice: 5500, maintenanceCharge: 500, securityDeposit: 2000, messFee: 3200, totalPayment: 11200, paidAmount: 11200, paymentStatus: 'paid',    lastPaymentDate: '2025-08-01', residencyAccount: 'university', status: 'checked_out' },
  { firstName: 'Junaid',   lastName: 'Mir',     email: 'junaid.mir@university.edu',      phone: '9419012345', rollNumber: 'EN2020067', gender: 'male',   department: 'Environmental Engg.',    currentSemester: '6th Semester', checkInDate: '2024-08-01', residenceExpiry: '2026-07-31', roomNumber: '412', selectedRoom: 'Single',         roomPrice: 8000, maintenanceCharge: 600, securityDeposit: 3000, messFee: 3200, totalPayment: 14800, paidAmount: 14800, paymentStatus: 'paid',    lastPaymentDate: '2025-08-01', residencyAccount: 'residency',  status: 'active' },
  { firstName: 'Rafia',    lastName: 'Rather',  email: 'rafia.rather@university.edu',    phone: '9622089012', rollNumber: 'MBA2022089', gender: 'female', department: 'MBA',                   currentSemester: '4th Semester', checkInDate: '2025-08-01', residenceExpiry: '2026-07-31', roomNumber: '416', selectedRoom: 'Double Sharing', roomPrice: 5500, maintenanceCharge: 500, securityDeposit: 2000, messFee: 3200, totalPayment: 11200, paidAmount: 2000,  paymentStatus: 'partial',  lastPaymentDate: '2025-08-05', residencyAccount: 'university', status: 'pending' },
  { firstName: 'Mudasir',  lastName: 'Lone',    email: 'mudasir.lone@university.edu',    phone: '9797090123', rollNumber: 'PH2021056', gender: 'male',   department: 'Pharmacy',               currentSemester: '5th Semester', checkInDate: '2025-02-01', residenceExpiry: '2026-01-31', roomNumber: '502', selectedRoom: 'Triple Sharing', roomPrice: 3800, maintenanceCharge: 400, securityDeposit: 1500, messFee: 3200, totalPayment: 8900,  paidAmount: 8900,  paymentStatus: 'paid',    lastPaymentDate: '2025-02-01', residencyAccount: 'university', status: 'active' },
  { firstName: 'Fareeda',  lastName: 'Bhat',    email: 'fareeda.bhat@university.edu',    phone: '9906190123', rollNumber: 'DS2020111', gender: 'female', department: 'Data Science',           currentSemester: '7th Semester', checkInDate: '2024-08-01', residenceExpiry: '2025-12-31', roomNumber: '507', selectedRoom: 'Double Sharing', roomPrice: 5500, maintenanceCharge: 500, securityDeposit: 2000, messFee: 3200, totalPayment: 11200, paidAmount: 7000,  paymentStatus: 'overdue',  lastPaymentDate: '2024-11-01', residencyAccount: 'university', status: 'expired' },
];

const ROOMS = [
  { roomNumber: '101', floor: 1, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '104', floor: 1, type: 'double', capacity: 2, price: 5500, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
  { roomNumber: '108', floor: 1, type: 'single', capacity: 1, price: 8000, status: 'active',      amenities: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'] },
  { roomNumber: '113', floor: 1, type: 'double', capacity: 2, price: 5500, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
  { roomNumber: '117', floor: 1, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '120', floor: 1, type: 'single', capacity: 1, price: 8000, status: 'active',      amenities: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'] },
  { roomNumber: '202', floor: 2, type: 'single', capacity: 1, price: 8000, status: 'active',      amenities: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'] },
  { roomNumber: '205', floor: 2, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '210', floor: 2, type: 'double', capacity: 2, price: 5500, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
  { roomNumber: '215', floor: 2, type: 'single', capacity: 1, price: 8000, status: 'active',      amenities: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'] },
  { roomNumber: '219', floor: 2, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '223', floor: 2, type: 'double', capacity: 2, price: 5500, status: 'maintenance', amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
  { roomNumber: '303', floor: 3, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '309', floor: 3, type: 'double', capacity: 2, price: 5500, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
  { roomNumber: '314', floor: 3, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '318', floor: 3, type: 'single', capacity: 1, price: 8000, status: 'active',      amenities: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'] },
  { roomNumber: '321', floor: 3, type: 'single', capacity: 1, price: 8000, status: 'active',      amenities: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'] },
  { roomNumber: '401', floor: 4, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '406', floor: 4, type: 'double', capacity: 2, price: 5500, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
  { roomNumber: '412', floor: 4, type: 'single', capacity: 1, price: 8000, status: 'active',      amenities: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'] },
  { roomNumber: '416', floor: 4, type: 'double', capacity: 2, price: 5500, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
  { roomNumber: '420', floor: 4, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '502', floor: 5, type: 'triple', capacity: 3, price: 3800, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan'] },
  { roomNumber: '507', floor: 5, type: 'double', capacity: 2, price: 5500, status: 'active',      amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
  { roomNumber: '512', floor: 5, type: 'double', capacity: 2, price: 5500, status: 'maintenance', amenities: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'] },
];

function ago(days) { return new Date(Date.now() - days * 86400000); }
function exp(days) { return new Date(Date.now() + days * 86400000).toISOString().split('T')[0]; }

const NOTICES = [
  { title: 'Water Supply Disruption – Urgent', content: 'Due to an emergency repair in the main pipeline, water supply will be suspended from 10:00 PM tonight until 6:00 AM tomorrow. Please store water accordingly.', category: 'maintenance', priority: 'urgent', isPinned: true, expiresAt: exp(1), createdAt: ago(0) },
  { title: 'End Semester Examination Schedule', content: 'The end semester examinations will commence from 10th June 2026. All students are advised to collect their hall tickets from the administrative office before 5th June.', category: 'academic', priority: 'important', isPinned: true, expiresAt: exp(25), createdAt: ago(2) },
  { title: 'Fire Drill – This Saturday', content: 'A mandatory fire drill will be conducted this Saturday at 10:00 AM. All hostel residents must participate. Please assemble at the designated muster point near the main gate.', category: 'hostel', priority: 'urgent', isPinned: true, expiresAt: exp(4), createdAt: ago(1) },
  { title: 'Fee Payment – Last Date Reminder', content: 'This is a reminder that the last date for fee payment for the current semester is 31st May 2026. Students with pending dues are advised to clear their payments immediately.', category: 'general', priority: 'important', isPinned: false, expiresAt: exp(15), createdAt: ago(3) },
  { title: 'Elevator Under Maintenance', content: 'The elevator in Block B will be under maintenance from 18th to 20th May. Students residing on floors 3–5 are requested to use the staircase during this period.', category: 'maintenance', priority: 'normal', isPinned: false, expiresAt: exp(5), createdAt: ago(4) },
  { title: 'Library Extended Hours', content: 'The hostel library will remain open until midnight (12:00 AM) from 15th May to 15th June to support students during exam preparation.', category: 'academic', priority: 'normal', isPinned: false, expiresAt: exp(30), createdAt: ago(5) },
  { title: 'Visiting Hours Updated', content: 'With effect from 1st June, visiting hours for guests will be 10:00 AM – 6:00 PM on weekdays and 9:00 AM – 8:00 PM on weekends.', category: 'hostel', priority: 'normal', isPinned: false, createdAt: ago(7) },
  { title: 'Welcome – New Residents', content: 'The hostel management warmly welcomes all new residents for the academic year 2025–26. An orientation session will be held on 25th May at 3:00 PM in the common hall.', category: 'general', priority: 'normal', isPinned: false, createdAt: ago(10) },
];

const MAINTENANCE_REQUESTS = [
  { ticketNumber: 'TKT-1001', studentName: 'Aanya Sharma',  rollNumber: 'CSE-221', roomNumber: '204', category: 'plumbing',   title: 'Tap leaking in washroom',        description: 'The hot water tap in the attached washroom has been dripping continuously since two days.',   priority: 'high',   status: 'open',        raisedAt: ago(1) },
  { ticketNumber: 'TKT-1002', studentName: 'Rohan Mehta',   rollNumber: 'CSE-221', roomNumber: '112', category: 'plumbing',   title: 'Clogged drain in bathroom',      description: 'Water is not draining properly in the bathroom. The floor stays wet after showering.',         priority: 'urgent', status: 'in-progress', raisedAt: ago(2) },
  { ticketNumber: 'TKT-1003', studentName: 'Priya Nair',    rollNumber: 'ECE-310', roomNumber: '301', category: 'electrical', title: 'Room light not working',         description: 'The ceiling light in the room stopped working. The bulb has been replaced but still no power.', priority: 'high',   status: 'resolved',    raisedAt: ago(5), resolvedAt: ago(3) },
  { ticketNumber: 'TKT-1004', studentName: 'Kiran Verma',   rollNumber: 'ME-405',  roomNumber: '408', category: 'appliance',  title: 'Room fan making loud noise',     description: 'The ceiling fan produces a rattling sound at medium and high speeds.',                          priority: 'medium', status: 'open',        raisedAt: ago(3) },
  { ticketNumber: 'TKT-1005', studentName: 'Suresh Babu',   rollNumber: 'CS-118',  roomNumber: '105', category: 'carpentry',  title: 'Wardrobe door hinge broken',     description: 'The hinge on the wardrobe door is broken. The door cannot be closed properly.',                priority: 'low',    status: 'open',        raisedAt: ago(4) },
  { ticketNumber: 'TKT-1006', studentName: 'Divya Patel',   rollNumber: 'IT-207',  roomNumber: '212', category: 'cleaning',   title: 'Common area not cleaned',        description: 'The corridor on the second floor has not been cleaned for the past three days.',                priority: 'medium', status: 'resolved',    raisedAt: ago(6), resolvedAt: ago(1) },
  { ticketNumber: 'TKT-1007', studentName: 'Arjun Singh',   rollNumber: 'CE-312',  roomNumber: '315', category: 'electrical', title: 'Power socket not working',       description: 'The 5A power socket near the study desk is dead. Unable to charge devices.',                  priority: 'high',   status: 'in-progress', raisedAt: ago(2) },
  { ticketNumber: 'TKT-1008', studentName: 'Meera Iyer',    rollNumber: 'CS-223',  roomNumber: '220', category: 'other',      title: 'Window latch broken',            description: 'The window latch in the room is broken and the window cannot be locked.',                      priority: 'medium', status: 'closed',      raisedAt: ago(10), resolvedAt: ago(7) },
];

const SUPPLIER_BILLS = [
  { billNumber: 'INV-2026-001', supplierName: 'Al-Noor Grocery Mart',    category: 'food',        amount: 18500, billDate: '2026-05-14', description: 'Monthly grocery supply — rice, dal, vegetables, oil',              registeredAt: new Date('2026-05-14T10:30:00'), status: 'paid' },
  { billNumber: 'INV-2026-002', supplierName: 'City Electricals',         category: 'utilities',   amount: 6200,  billDate: '2026-05-15', description: 'Electricity bill for hostel block A & B — April cycle',              registeredAt: new Date('2026-05-15T09:00:00'), status: 'approved' },
  { billNumber: 'INV-2026-003', supplierName: 'Khan Plumbing Works',      category: 'maintenance', amount: 3400,  billDate: '2026-05-16', description: 'Water pipe repair and bathroom fixture replacement — east wing',     registeredAt: new Date('2026-05-16T14:15:00'), status: 'pending' },
  { billNumber: 'INV-2026-004', supplierName: 'Clean Pro Services',       category: 'cleaning',    amount: 4800,  billDate: '2026-05-17', description: 'Deep cleaning of mess area and common rooms — weekly service',       registeredAt: new Date('2026-05-17T11:00:00'), status: 'pending' },
  { billNumber: 'INV-2026-005', supplierName: 'Modern Furniture House',   category: 'furniture',   amount: 22000, billDate: '2026-05-18', description: '4 study tables and 8 chairs for new rooms in block C',               registeredAt: new Date('2026-05-18T16:30:00'), status: 'pending' },
];

const ROLES = [
  { name: 'super_admin', description: 'Super administrator — initial hostel onboarding, user management, full access' },
  { name: 'admin',       description: 'Full system access — manage users, settings, and all modules' },
  { name: 'manager',     description: 'Hostel manager — notices, mess, rebates, supplier bills, audit' },
  { name: 'office',      description: 'Office staff — room management and student records' },
  { name: 'student',     description: 'Student — limited to own profile and general features' },
];

async function seed() {
  console.log('Clearing existing data...');
  await prisma.messEnrollment.deleteMany();
  await prisma.rebateRequest.deleteMany();
  await prisma.studentNotification.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.room.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.supplierBill.deleteMany();
  await prisma.auditRecord.deleteMany();
  // Hostel child tables first (FK order), then hostel itself
  await prisma.adminNotification.deleteMany();
  await prisma.hostelAuditLog.deleteMany();
  await prisma.hostelPayment.deleteMany();
  await prisma.hostelSubscription.deleteMany();
  await prisma.hostelOwner.deleteMany();
  await prisma.hostelLocation.deleteMany();
  await prisma.hostelSettings.deleteMany();
  await prisma.hostel.deleteMany();

  console.log('Seeding roles...');
  for (const r of ROLES) {
    await prisma.role.create({ data: r });
  }
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
  const managerRole    = await prisma.role.findUnique({ where: { name: 'manager' } });

  console.log('Seeding hostel...');
  const hostel = await prisma.hostel.create({
    data: {
      name:       'Maple Residency',
      slug:       'maple-residency',
      code:       'MAPLE',
      hostelType: 'mixed',
      isActive:   true,
      location: {
        create: {
          addressLine1: '123 College Road',
          addressLine2: 'University District',
          city:    'Srinagar',
          state:   'Jammu & Kashmir',
          pincode: '190001',
          country: 'India',
          latitude:  34.0837,
          longitude: 74.7973,
        },
      },
      owners: {
        create: {
          name:      'Hostel Administration',
          email:     'admin@resideease.com',
          phone:     '+91-9876543210',
          isPrimary: true,
        },
      },
      settings: {
        create: {
          totalSeats:       60,
          totalRooms:       25,
          hasMess:          true,
          messType:         'veg',
          noticePeriodDays: 30,
          website:          'www.resideease.com',
          description:      'A premium student hostel facility',
          timezone:         'Asia/Kolkata',
        },
      },
    },
  });

  console.log('Seeding super admin...');
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.user.create({
    data: { username: 'superadmin', email: 'superadmin@resideease.com', password: superAdminPassword, roleId: superAdminRole.id, name: 'Super Admin' },
  });

  console.log('Seeding manager...');
  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.create({
    data: { username: 'manager', email: 'manager@resideease.com', password: managerPassword, roleId: managerRole.id, name: 'Mess Manager', hostelId: hostel.id },
  });

  console.log('Seeding students...');
  await prisma.student.createMany({ data: STUDENTS });

  console.log('Seeding settings...');
  await prisma.settings.create({
    data: {
      hostel: { name: 'SA Hostel Zakura', address: '123 College Road, University District', phone: '+91-9876543210', email: 'admin@resideease.com', website: 'www.resideease.com', description: 'A premium student hostel facility' },
      rooms:  [{ id: 'single', label: 'Single Room', price: 8500, enabled: true }, { id: 'double', label: 'Double Sharing', price: 5500, enabled: true }, { id: 'triple', label: 'Triple Sharing', price: 3800, enabled: true }],
      meals:  [{ id: 'full-board', label: 'Full Board', price: 3200, enabled: true }, { id: 'half-board', label: 'Half Board', price: 2100, enabled: true }, { id: 'breakfast-only', label: 'Breakfast Only', price: 900, enabled: true }, { id: 'no-mess', label: 'No Mess Plan', price: 0, enabled: true }],
      dietaryOptions: ['Vegetarian', 'Vegan', 'Jain', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'High Protein', 'Low Carb', 'No Nuts'],
      system: { allowOnlineBooking: true, requireApproval: false, maintenanceMode: false, notificationsEnabled: true },
      guestFee: 200,
    },
  });

  console.log('Seeding rooms...');
  await prisma.room.createMany({ data: ROOMS });

  console.log('Seeding notices...');
  for (const n of NOTICES) {
    await prisma.notice.create({ data: n });
  }

  console.log('Seeding maintenance requests...');
  for (const r of MAINTENANCE_REQUESTS) {
    await prisma.maintenanceRequest.create({ data: r });
  }

  console.log('Seeding supplier bills...');
  for (const b of SUPPLIER_BILLS) {
    await prisma.supplierBill.create({ data: b });
  }

  console.log('Seeding admin notifications...');
  await prisma.adminNotification.createMany({
    data: [
      { type: 'info',    title: 'New student registered',    message: 'Aanya Sharma completed onboarding for Room 204.',            isRead: false },
      { type: 'success', title: 'Payment received',          message: '₹12,500 received from Rohan Mehta (Roll: CSE-221).',         isRead: false },
      { type: 'warning', title: 'Maintenance request',       message: 'Room 112 reported a plumbing issue. Assign a technician.',    isRead: false },
      { type: 'info',    title: 'Mess enrollment updated',   message: '14 students switched to vegetarian plan for next month.',     isRead: true  },
      { type: 'success', title: 'Room checkout',             message: 'Priya Nair (Room 301) has checked out successfully.',         isRead: true  },
    ],
  });

  console.log('\nSeeded successfully.');
  console.log('Super Admin login → username: superadmin  password: superadmin123');
  console.log('Manager login     → username: manager     password: manager123');
  console.log('Student login     → rollNumber + phone (e.g. CS2021001 / 9419001234)');
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error(err.message);
  prisma.$disconnect();
  process.exit(1);
});
