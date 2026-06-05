-- DropForeignKey
ALTER TABLE "HostelAuditLog" DROP CONSTRAINT "HostelAuditLog_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "HostelLocation" DROP CONSTRAINT "HostelLocation_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "HostelOwner" DROP CONSTRAINT "HostelOwner_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "HostelSettings" DROP CONSTRAINT "HostelSettings_hostelId_fkey";

-- AddForeignKey
ALTER TABLE "HostelLocation" ADD CONSTRAINT "HostelLocation_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelOwner" ADD CONSTRAINT "HostelOwner_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelSettings" ADD CONSTRAINT "HostelSettings_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAuditLog" ADD CONSTRAINT "HostelAuditLog_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
