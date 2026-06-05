-- Normalize Hostel schema: extract location, owners, settings, subscriptions, payments, audit logs

-- ─── 1. Add new core columns to Hostel ───────────────────────────────────────

ALTER TABLE "Hostel"
  ADD COLUMN "slug"       TEXT,
  ADD COLUMN "code"       TEXT,
  ADD COLUMN "hostelType" TEXT NOT NULL DEFAULT 'mixed',
  ADD COLUMN "isActive"   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deletedAt"  TIMESTAMP(3);

-- Back-fill slug and code from existing rows so we can add UNIQUE constraints
UPDATE "Hostel"
SET
  "slug" = LOWER(REGEXP_REPLACE(TRIM("name"), '\s+', '-', 'g')),
  "code" = UPPER(SUBSTRING(REGEXP_REPLACE(TRIM("name"), '[^a-zA-Z0-9]', '', 'g'), 1, 6))
WHERE "slug" IS NULL;

-- Ensure uniqueness before adding constraints (append id suffix on collision)
UPDATE "Hostel" h
SET "slug" = h."slug" || '-' || SUBSTRING(h."id", 1, 4)
WHERE (SELECT COUNT(*) FROM "Hostel" h2 WHERE h2."slug" = h."slug" AND h2."id" <> h."id") > 0;

UPDATE "Hostel" h
SET "code" = SUBSTRING(h."code" || UPPER(SUBSTRING(h."id", 1, 4)), 1, 8)
WHERE (SELECT COUNT(*) FROM "Hostel" h2 WHERE h2."code" = h."code" AND h2."id" <> h."id") > 0;

ALTER TABLE "Hostel"
  ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "code" SET NOT NULL,
  ADD CONSTRAINT "Hostel_slug_key" UNIQUE ("slug"),
  ADD CONSTRAINT "Hostel_code_key" UNIQUE ("code");

-- Migrate isActive from status column
UPDATE "Hostel" SET "isActive" = false WHERE "status" = 'inactive';

-- ─── 2. CreateTable HostelLocation ───────────────────────────────────────────

CREATE TABLE "HostelLocation" (
    "id"           TEXT NOT NULL,
    "hostelId"     TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city"         TEXT,
    "state"        TEXT,
    "pincode"      TEXT,
    "country"      TEXT NOT NULL DEFAULT 'India',
    "latitude"     DOUBLE PRECISION,
    "longitude"    DOUBLE PRECISION,

    CONSTRAINT "HostelLocation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HostelLocation_hostelId_key" UNIQUE ("hostelId")
);

-- Migrate existing location data
INSERT INTO "HostelLocation" ("id", "hostelId", "addressLine1", "city", "latitude", "longitude")
SELECT
  'loc_' || SUBSTRING("id", 1, 20),
  "id",
  "address",
  "city",
  "lat",
  "lng"
FROM "Hostel"
WHERE "address" IS NOT NULL OR "city" IS NOT NULL OR "lat" IS NOT NULL OR "lng" IS NOT NULL;

-- ─── 3. CreateTable HostelOwner ──────────────────────────────────────────────

CREATE TABLE "HostelOwner" (
    "id"        TEXT NOT NULL,
    "hostelId"  TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "email"     TEXT,
    "phone"     TEXT,
    "altPhone"  TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelOwner_pkey" PRIMARY KEY ("id")
);

-- Migrate existing contact data as the primary owner record
INSERT INTO "HostelOwner" ("id", "hostelId", "name", "email", "phone", "isPrimary")
SELECT
  'own_' || SUBSTRING("id", 1, 20),
  "id",
  COALESCE("name", 'Unknown'),
  COALESCE("adminEmail", "email"),
  "phone",
  true
FROM "Hostel"
WHERE "phone" IS NOT NULL OR "email" IS NOT NULL OR "adminEmail" IS NOT NULL;

-- ─── 4. CreateTable HostelSettings ───────────────────────────────────────────

CREATE TABLE "HostelSettings" (
    "id"               TEXT NOT NULL,
    "hostelId"         TEXT NOT NULL,
    "totalSeats"       INTEGER,
    "totalRooms"       INTEGER,
    "hasMess"          BOOLEAN NOT NULL DEFAULT false,
    "messType"         TEXT,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "logoUrl"          TEXT,
    "website"          TEXT,
    "description"      TEXT,
    "timezone"         TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "featureOverrides" JSONB,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HostelSettings_hostelId_key" UNIQUE ("hostelId")
);

-- Migrate website and description
INSERT INTO "HostelSettings" ("id", "hostelId", "website", "description")
SELECT
  'cfg_' || SUBSTRING("id", 1, 20),
  "id",
  "website",
  "description"
FROM "Hostel"
WHERE "website" IS NOT NULL OR "description" IS NOT NULL;

-- ─── 5. CreateTable HostelSubscription ───────────────────────────────────────

CREATE TABLE "HostelSubscription" (
    "id"           TEXT NOT NULL,
    "hostelId"     TEXT NOT NULL,
    "planId"       TEXT,
    "planName"     TEXT NOT NULL,
    "status"       TEXT NOT NULL DEFAULT 'active',
    "billingCycle" TEXT,
    "seatLimit"    INTEGER,
    "staffLimit"   INTEGER,
    "startsAt"     TIMESTAMP(3) NOT NULL,
    "endsAt"       TIMESTAMP(3),
    "trialEndsAt"  TIMESTAMP(3),
    "graceEndsAt"  TIMESTAMP(3),
    "isCurrent"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelSubscription_pkey" PRIMARY KEY ("id")
);

-- ─── 6. CreateTable HostelPayment ────────────────────────────────────────────

CREATE TABLE "HostelPayment" (
    "id"             TEXT NOT NULL,
    "hostelId"       TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount"         DOUBLE PRECISION NOT NULL,
    "currency"       TEXT NOT NULL DEFAULT 'INR',
    "status"         TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod"  TEXT,
    "paidAt"         TIMESTAMP(3),
    "invoiceUrl"     TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelPayment_pkey" PRIMARY KEY ("id")
);

-- ─── 7. CreateTable HostelAuditLog ───────────────────────────────────────────

CREATE TABLE "HostelAuditLog" (
    "id"        TEXT NOT NULL,
    "hostelId"  TEXT NOT NULL,
    "actorId"   TEXT,
    "actorRole" TEXT,
    "action"    TEXT NOT NULL,
    "payload"   JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelAuditLog_pkey" PRIMARY KEY ("id")
);

-- ─── 8. AddForeignKeys ───────────────────────────────────────────────────────

ALTER TABLE "HostelLocation"
  ADD CONSTRAINT "HostelLocation_hostelId_fkey"
  FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HostelOwner"
  ADD CONSTRAINT "HostelOwner_hostelId_fkey"
  FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HostelSettings"
  ADD CONSTRAINT "HostelSettings_hostelId_fkey"
  FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HostelSubscription"
  ADD CONSTRAINT "HostelSubscription_hostelId_fkey"
  FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HostelPayment"
  ADD CONSTRAINT "HostelPayment_hostelId_fkey"
  FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HostelPayment"
  ADD CONSTRAINT "HostelPayment_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "HostelSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HostelAuditLog"
  ADD CONSTRAINT "HostelAuditLog_hostelId_fkey"
  FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── 9. Drop migrated columns from Hostel ────────────────────────────────────

ALTER TABLE "Hostel"
  DROP COLUMN "address",
  DROP COLUMN "city",
  DROP COLUMN "lat",
  DROP COLUMN "lng",
  DROP COLUMN "phone",
  DROP COLUMN "email",
  DROP COLUMN "website",
  DROP COLUMN "description",
  DROP COLUMN "adminEmail",
  DROP COLUMN "status";
