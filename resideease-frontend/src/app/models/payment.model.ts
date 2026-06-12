export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',          label: 'Cash'          },
  { value: 'upi',           label: 'UPI'           },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque',        label: 'Cheque'        },
];

export interface PaymentTransaction {
  id:        string;
  studentId: string;
  hostelId:  string;
  amount:    number;
  method:    PaymentMethod;
  notes?:    string;
  paidAt:    string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id:           string;
    firstName:    string;
    lastName:     string;
    rollNumber:   string;
    roomNumber:   string;
    totalPayment: number;
    paidAmount:   number;
  };
}
