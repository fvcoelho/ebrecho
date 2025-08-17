-- CreateEnum
CREATE TYPE "PixTransactionStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "pixKey" TEXT;

-- CreateTable
CREATE TABLE "PixTransaction" (
    "id" TEXT NOT NULL,
    "transactionCode" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "merchantName" TEXT NOT NULL,
    "merchantCity" TEXT NOT NULL,
    "status" "PixTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "customerId" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "pixPayload" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "PixTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PixTransaction_transactionCode_key" ON "PixTransaction"("transactionCode");

-- CreateIndex
CREATE UNIQUE INDEX "PixTransaction_orderId_key" ON "PixTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PixTransaction_transactionCode_idx" ON "PixTransaction"("transactionCode");

-- CreateIndex
CREATE INDEX "PixTransaction_partnerId_idx" ON "PixTransaction"("partnerId");

-- CreateIndex
CREATE INDEX "PixTransaction_productId_idx" ON "PixTransaction"("productId");

-- CreateIndex
CREATE INDEX "PixTransaction_status_idx" ON "PixTransaction"("status");

-- CreateIndex
CREATE INDEX "PixTransaction_createdAt_idx" ON "PixTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "PixTransaction_customerId_idx" ON "PixTransaction"("customerId");

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
