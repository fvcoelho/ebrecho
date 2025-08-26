-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "WhatsAppWebhookLog" ADD COLUMN     "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED';

-- CreateIndex
CREATE INDEX "WhatsAppWebhookLog_status_idx" ON "WhatsAppWebhookLog"("status");
