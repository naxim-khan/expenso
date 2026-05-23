-- Add normalized names in a backfill-safe sequence.
ALTER TABLE "public"."Category" ADD COLUMN "normalizedName" TEXT;

UPDATE "public"."Category"
SET "normalizedName" = lower(regexp_replace(btrim("name"), '\s+', ' ', 'g'));

ALTER TABLE "public"."Category" ALTER COLUMN "normalizedName" SET NOT NULL;

DROP INDEX "public"."Category_userId_name_key";

CREATE UNIQUE INDEX "Category_userId_normalizedName_key" ON "public"."Category"("userId", "normalizedName");
