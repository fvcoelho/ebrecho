-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "autoResponseEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "customGreetingTemplate" TEXT;

-- AlterTable
ALTER TABLE "WhatsAppMessage" ADD COLUMN     "autoResponseAt" TIMESTAMP(3),
ADD COLUMN     "autoResponseMessageId" TEXT,
ADD COLUMN     "autoResponseSent" BOOLEAN;

-- CreateIndex
CREATE INDEX "WhatsAppMessage_autoResponseSent_idx" ON "WhatsAppMessage"("autoResponseSent");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_direction_autoResponseSent_idx" ON "WhatsAppMessage"("direction", "autoResponseSent");
