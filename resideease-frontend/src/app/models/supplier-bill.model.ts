export type BillCategory = 'food' | 'maintenance' | 'utilities' | 'cleaning' | 'furniture' | 'other';
export type BillStatus   = 'pending' | 'approved' | 'paid';

export interface SupplierBill {
  id:           string;
  billNumber:   string;
  supplierName: string;
  category:     BillCategory;
  amount:       number;
  billDate:     string;
  description:  string;
  photoData?:   string;   // base64 data-URL
  registeredAt: string;
  status:       BillStatus;
}
