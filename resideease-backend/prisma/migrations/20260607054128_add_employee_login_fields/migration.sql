-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "hostelId" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'staff';

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
