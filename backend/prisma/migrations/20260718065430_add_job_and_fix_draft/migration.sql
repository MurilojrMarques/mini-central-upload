/*
  Warnings:

  - Added the required column `updatedAt` to the `Draft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Draft" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" SET DEFAULT 'singleton';

-- CreateTable
CREATE TABLE "Job" (
    "idempotencyKey" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("idempotencyKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobId_key" ON "Job"("jobId");
