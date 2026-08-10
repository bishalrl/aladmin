/*
  Warnings:

  - You are about to drop the column `image_path` on the `banner_ads` table. All the data in the column will be lost.
  - Added the required column `media_path` to the `banner_ads` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BannerMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "banner_ads" DROP COLUMN "image_path",
ADD COLUMN     "media_path" TEXT NOT NULL,
ADD COLUMN     "media_type" "BannerMediaType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "mime_type" TEXT,
ALTER COLUMN "click_url" DROP NOT NULL;
