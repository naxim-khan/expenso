-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN "refreshToken" TEXT,
ADD COLUMN "role" "public"."Role" NOT NULL DEFAULT 'USER',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."User" ALTER COLUMN "updatedAt" DROP DEFAULT;
