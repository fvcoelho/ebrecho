-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PARTNER_ADMIN', 'PARTNER_USER', 'PROMOTER', 'PARTNER_PROMOTER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CPF', 'CNPJ');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RESERVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PromoterTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('DIRECT', 'BULK', 'PUBLIC', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FLASH_SALE', 'SHOWCASE', 'SPOTLIGHT', 'SEASONAL', 'REGIONAL');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'PARTICIPATED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('INVITATION_BONUS', 'ONGOING_SALES', 'EVENT_BONUS', 'TIER_BONUS');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'DISPUTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'CASH');

-- CreateEnum
CREATE TYPE "PixTransactionStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppMessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'TEMPLATE', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "WhatsAppTemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "WhatsAppConversationState" AS ENUM ('WAITING_FIRST_MESSAGE', 'AUTO_RESPONDED', 'HUMAN_RESPONDED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "emailVerifyExpires" TIMESTAMP(3),
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasPhysicalStore" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT,
    "publicDescription" TEXT,
    "isPublicActive" BOOLEAN NOT NULL DEFAULT true,
    "publicBanner" TEXT,
    "publicLogo" TEXT,
    "whatsappNumber" TEXT,
    "whatsappName" TEXT,
    "whatsappBusinessVerified" BOOLEAN NOT NULL DEFAULT false,
    "whatsappApiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappPhoneNumberId" TEXT,
    "autoResponseEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customGreetingTemplate" TEXT,
    "publicEmail" TEXT,
    "businessHours" JSONB,
    "socialLinks" JSONB,
    "pixKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "sku" TEXT,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "size" TEXT,
    "color" TEXT,
    "condition" "ProductCondition" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
    "slug" TEXT,
    "isPublicVisible" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publicTags" TEXT[],
    "partnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "processedUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "blobId" TEXT,
    "uploadMethod" TEXT NOT NULL DEFAULT 'local',
    "aiEnhanced" BOOLEAN NOT NULL DEFAULT false,
    "enhancementProvider" TEXT,
    "enhancementVersion" TEXT,
    "qualityScore" DECIMAL(3,2),
    "processingCost" DECIMAL(8,4),
    "enhancementRequestId" TEXT,
    "enhancedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIEnhancementUsage" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enhancementType" TEXT NOT NULL,
    "imagesProcessed" INTEGER NOT NULL,
    "totalCost" DECIMAL(10,4) NOT NULL,
    "requestId" TEXT,
    "batchId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIEnhancementUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promoter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.0200,
    "tier" "PromoterTier" NOT NULL DEFAULT 'BRONZE',
    "invitationQuota" INTEGER NOT NULL DEFAULT 10,
    "invitationsUsed" INTEGER NOT NULL DEFAULT 0,
    "totalCommissionsEarned" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalPartnersInvited" INTEGER NOT NULL DEFAULT 0,
    "successfulInvitations" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "territory" TEXT,
    "specialization" TEXT,
    "phone" TEXT,
    "whatsappNumber" TEXT,
    "pixKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promoter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerInvitation" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "invitationCode" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "targetPhone" TEXT,
    "targetName" TEXT,
    "targetBusinessName" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "personalizedMessage" TEXT,
    "invitationType" "InvitationType" NOT NULL DEFAULT 'DIRECT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "resultingPartnerId" TEXT,
    "commissionAmount" DECIMAL(10,2),
    "commissionPercentage" DECIMAL(5,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bannerImage" TEXT,
    "eventType" "EventType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "targetCategories" TEXT[],
    "targetRegions" TEXT[],
    "discountPercentage" DECIMAL(5,2),
    "minDiscountPercentage" DECIMAL(5,2),
    "maxParticipants" INTEGER,
    "participationFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "commissionBonus" DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    "participationRequirements" JSONB,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "landingPageUrl" TEXT,
    "socialHashtag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "invitedByPromoterId" TEXT NOT NULL,
    "invitationSentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "participationStatus" "ParticipationStatus" NOT NULL DEFAULT 'INVITED',
    "productsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "salesDuringEvent" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "ordersDuringEvent" INTEGER NOT NULL DEFAULT 0,
    "commissionEarned" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "performanceRating" DECIMAL(3,2),
    "feedback" TEXT,
    "participationFeePaid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "bonusEarned" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoterCommission" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "referenceId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "percentage" DECIMAL(5,4) NOT NULL,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoterCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrechoBusiness" (
    "id" TEXT NOT NULL,
    "googlePlaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formattedAddress" TEXT NOT NULL,
    "streetNumber" TEXT,
    "route" TEXT,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "phoneNumber" TEXT,
    "website" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "rating" DECIMAL(2,1),
    "reviewCount" INTEGER,
    "priceLevel" INTEGER,
    "categories" TEXT[],
    "isOpenNow" BOOLEAN,
    "photos" TEXT[],
    "profileImage" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "dataSource" TEXT NOT NULL DEFAULT 'google-places',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BrechoBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrechoBusinessHours" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT,
    "closeTime" TEXT,
    "isClosedAllDay" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BrechoBusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrechoSearchResult" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "searchCenter" JSONB NOT NULL,
    "searchRadius" INTEGER NOT NULL,
    "filtersApplied" JSONB,
    "distanceFromCenter" DECIMAL(8,2),
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrechoSearchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrechoMapView" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "centerLat" DECIMAL(10,8) NOT NULL,
    "centerLng" DECIMAL(11,8) NOT NULL,
    "zoom" INTEGER NOT NULL,
    "mapType" TEXT NOT NULL DEFAULT 'roadmap',
    "filters" JSONB,
    "visibleLayers" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrechoMapView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrechoExportRequest" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "searchCriteria" JSONB NOT NULL,
    "fields" TEXT[],
    "deliveryMethod" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "recordCount" INTEGER,
    "fileSize" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "expiresAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrechoExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "cpf" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "preferredPayment" "PaymentMethod",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "nickname" TEXT,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total" DECIMAL(10,2) NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "billingAddress" JSONB,
    "notes" TEXT,
    "trackingCode" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "productSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" "WhatsAppMessageType" NOT NULL,
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'SENT',
    "textContent" TEXT,
    "mediaId" TEXT,
    "mediaUrl" TEXT,
    "fileName" TEXT,
    "caption" TEXT,
    "templateName" TEXT,
    "templateLanguage" TEXT,
    "templateParams" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "conversationId" TEXT,
    "contextMessageId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "autoResponseSent" BOOLEAN,
    "autoResponseAt" TIMESTAMP(3),
    "autoResponseMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "WhatsAppTemplateStatus" NOT NULL DEFAULT 'PENDING',
    "headerText" TEXT,
    "bodyText" TEXT NOT NULL,
    "footerText" TEXT,
    "buttonConfig" JSONB,
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppWebhookLog" (
    "id" TEXT NOT NULL,
    "webhookType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "state" "WhatsAppConversationState" NOT NULL DEFAULT 'WAITING_FIRST_MESSAGE',
    "lastAutoResponseId" TEXT,
    "lastAutoResponseAt" TIMESTAMP(3),
    "lastHumanResponseId" TEXT,
    "lastHumanResponseAt" TIMESTAMP(3),
    "lastInboundMessageId" TEXT,
    "lastInboundMessageAt" TIMESTAMP(3),
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "totalAutoResponses" INTEGER NOT NULL DEFAULT 0,
    "totalHumanResponses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "browser" TEXT,
    "city" TEXT,
    "country" TEXT,
    "device" TEXT,
    "headers" JSONB,
    "language" TEXT,
    "os" TEXT,
    "region" TEXT,
    "colorDepth" INTEGER,
    "screenResolution" TEXT,
    "timezone" TEXT,
    "viewport" TEXT,
    "partnerId" TEXT,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "title" TEXT,
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerId" TEXT,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "elementId" TEXT,
    "elementText" TEXT,
    "elementType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerId" TEXT,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_partnerId_idx" ON "User"("partnerId");

-- CreateIndex
CREATE INDEX "User_emailVerifyToken_idx" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_document_key" ON "Partner"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "Partner_email_idx" ON "Partner"("email");

-- CreateIndex
CREATE INDEX "Partner_document_idx" ON "Partner"("document");

-- CreateIndex
CREATE INDEX "Partner_slug_idx" ON "Partner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Address_partnerId_key" ON "Address"("partnerId");

-- CreateIndex
CREATE INDEX "Address_partnerId_idx" ON "Address"("partnerId");

-- CreateIndex
CREATE INDEX "Product_partnerId_idx" ON "Product"("partnerId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_isPublicVisible_idx" ON "Product"("isPublicVisible");

-- CreateIndex
CREATE INDEX "Product_viewCount_idx" ON "Product"("viewCount");

-- CreateIndex
CREATE UNIQUE INDEX "Product_partnerId_sku_key" ON "Product"("partnerId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_partnerId_slug_key" ON "Product"("partnerId", "slug");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_order_idx" ON "ProductImage"("order");

-- CreateIndex
CREATE INDEX "ProductImage_aiEnhanced_idx" ON "ProductImage"("aiEnhanced");

-- CreateIndex
CREATE INDEX "ProductImage_uploadMethod_idx" ON "ProductImage"("uploadMethod");

-- CreateIndex
CREATE INDEX "ProductImage_enhancementProvider_idx" ON "ProductImage"("enhancementProvider");

-- CreateIndex
CREATE INDEX "AIEnhancementUsage_partnerId_idx" ON "AIEnhancementUsage"("partnerId");

-- CreateIndex
CREATE INDEX "AIEnhancementUsage_provider_idx" ON "AIEnhancementUsage"("provider");

-- CreateIndex
CREATE INDEX "AIEnhancementUsage_enhancementType_idx" ON "AIEnhancementUsage"("enhancementType");

-- CreateIndex
CREATE INDEX "AIEnhancementUsage_createdAt_idx" ON "AIEnhancementUsage"("createdAt");

-- CreateIndex
CREATE INDEX "AIEnhancementUsage_batchId_idx" ON "AIEnhancementUsage"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Promoter_userId_key" ON "Promoter"("userId");

-- CreateIndex
CREATE INDEX "Promoter_userId_idx" ON "Promoter"("userId");

-- CreateIndex
CREATE INDEX "Promoter_tier_idx" ON "Promoter"("tier");

-- CreateIndex
CREATE INDEX "Promoter_territory_idx" ON "Promoter"("territory");

-- CreateIndex
CREATE INDEX "Promoter_isActive_idx" ON "Promoter"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerInvitation_invitationCode_key" ON "PartnerInvitation"("invitationCode");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerInvitation_resultingPartnerId_key" ON "PartnerInvitation"("resultingPartnerId");

-- CreateIndex
CREATE INDEX "PartnerInvitation_promoterId_idx" ON "PartnerInvitation"("promoterId");

-- CreateIndex
CREATE INDEX "PartnerInvitation_invitationCode_idx" ON "PartnerInvitation"("invitationCode");

-- CreateIndex
CREATE INDEX "PartnerInvitation_status_idx" ON "PartnerInvitation"("status");

-- CreateIndex
CREATE INDEX "PartnerInvitation_targetEmail_idx" ON "PartnerInvitation"("targetEmail");

-- CreateIndex
CREATE INDEX "PartnerInvitation_expiresAt_idx" ON "PartnerInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "Event_promoterId_idx" ON "Event"("promoterId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Event_isPublic_idx" ON "Event"("isPublic");

-- CreateIndex
CREATE INDEX "Event_isFeatured_idx" ON "Event"("isFeatured");

-- CreateIndex
CREATE INDEX "EventParticipant_eventId_idx" ON "EventParticipant"("eventId");

-- CreateIndex
CREATE INDEX "EventParticipant_partnerId_idx" ON "EventParticipant"("partnerId");

-- CreateIndex
CREATE INDEX "EventParticipant_invitedByPromoterId_idx" ON "EventParticipant"("invitedByPromoterId");

-- CreateIndex
CREATE INDEX "EventParticipant_participationStatus_idx" ON "EventParticipant"("participationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipant_eventId_partnerId_key" ON "EventParticipant"("eventId", "partnerId");

-- CreateIndex
CREATE INDEX "PromoterCommission_promoterId_idx" ON "PromoterCommission"("promoterId");

-- CreateIndex
CREATE INDEX "PromoterCommission_partnerId_idx" ON "PromoterCommission"("partnerId");

-- CreateIndex
CREATE INDEX "PromoterCommission_commissionType_idx" ON "PromoterCommission"("commissionType");

-- CreateIndex
CREATE INDEX "PromoterCommission_status_idx" ON "PromoterCommission"("status");

-- CreateIndex
CREATE INDEX "PromoterCommission_periodStart_periodEnd_idx" ON "PromoterCommission"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "BrechoBusiness_googlePlaceId_key" ON "BrechoBusiness"("googlePlaceId");

-- CreateIndex
CREATE INDEX "BrechoBusiness_googlePlaceId_idx" ON "BrechoBusiness"("googlePlaceId");

-- CreateIndex
CREATE INDEX "BrechoBusiness_city_state_idx" ON "BrechoBusiness"("city", "state");

-- CreateIndex
CREATE INDEX "BrechoBusiness_latitude_longitude_idx" ON "BrechoBusiness"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "BrechoBusiness_rating_idx" ON "BrechoBusiness"("rating");

-- CreateIndex
CREATE INDEX "BrechoBusiness_reviewCount_idx" ON "BrechoBusiness"("reviewCount");

-- CreateIndex
CREATE INDEX "BrechoBusiness_isActive_idx" ON "BrechoBusiness"("isActive");

-- CreateIndex
CREATE INDEX "BrechoBusiness_lastUpdated_idx" ON "BrechoBusiness"("lastUpdated");

-- CreateIndex
CREATE INDEX "BrechoBusinessHours_businessId_idx" ON "BrechoBusinessHours"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BrechoBusinessHours_businessId_dayOfWeek_key" ON "BrechoBusinessHours"("businessId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "BrechoSearchResult_searchId_idx" ON "BrechoSearchResult"("searchId");

-- CreateIndex
CREATE INDEX "BrechoSearchResult_businessId_idx" ON "BrechoSearchResult"("businessId");

-- CreateIndex
CREATE INDEX "BrechoSearchResult_promoterId_idx" ON "BrechoSearchResult"("promoterId");

-- CreateIndex
CREATE INDEX "BrechoSearchResult_searchedAt_idx" ON "BrechoSearchResult"("searchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrechoMapView_shareToken_key" ON "BrechoMapView"("shareToken");

-- CreateIndex
CREATE INDEX "BrechoMapView_promoterId_idx" ON "BrechoMapView"("promoterId");

-- CreateIndex
CREATE INDEX "BrechoMapView_shareToken_idx" ON "BrechoMapView"("shareToken");

-- CreateIndex
CREATE INDEX "BrechoMapView_isPublic_idx" ON "BrechoMapView"("isPublic");

-- CreateIndex
CREATE INDEX "BrechoExportRequest_promoterId_idx" ON "BrechoExportRequest"("promoterId");

-- CreateIndex
CREATE INDEX "BrechoExportRequest_status_idx" ON "BrechoExportRequest"("status");

-- CreateIndex
CREATE INDEX "BrechoExportRequest_createdAt_idx" ON "BrechoExportRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_cpf_key" ON "Customer"("cpf");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_cpf_idx" ON "Customer"("cpf");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_partnerId_idx" ON "Order"("partnerId");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Wishlist_customerId_idx" ON "Wishlist"("customerId");

-- CreateIndex
CREATE INDEX "Wishlist_productId_idx" ON "Wishlist"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_customerId_productId_key" ON "Wishlist"("customerId", "productId");

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

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_messageId_key" ON "WhatsAppMessage"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_partnerId_idx" ON "WhatsAppMessage"("partnerId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_messageId_idx" ON "WhatsAppMessage"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_fromNumber_idx" ON "WhatsAppMessage"("fromNumber");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_toNumber_idx" ON "WhatsAppMessage"("toNumber");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_conversationId_idx" ON "WhatsAppMessage"("conversationId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_timestamp_idx" ON "WhatsAppMessage"("timestamp");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_status_idx" ON "WhatsAppMessage"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_autoResponseSent_idx" ON "WhatsAppMessage"("autoResponseSent");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_direction_autoResponseSent_idx" ON "WhatsAppMessage"("direction", "autoResponseSent");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_partnerId_idx" ON "WhatsAppTemplate"("partnerId");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_status_idx" ON "WhatsAppTemplate"("status");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_category_idx" ON "WhatsAppTemplate"("category");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_templateId_idx" ON "WhatsAppTemplate"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_partnerId_name_language_key" ON "WhatsAppTemplate"("partnerId", "name", "language");

-- CreateIndex
CREATE INDEX "WhatsAppWebhookLog_webhookType_idx" ON "WhatsAppWebhookLog"("webhookType");

-- CreateIndex
CREATE INDEX "WhatsAppWebhookLog_processed_idx" ON "WhatsAppWebhookLog"("processed");

-- CreateIndex
CREATE INDEX "WhatsAppWebhookLog_status_idx" ON "WhatsAppWebhookLog"("status");

-- CreateIndex
CREATE INDEX "WhatsAppWebhookLog_createdAt_idx" ON "WhatsAppWebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_partnerId_idx" ON "WhatsAppConversation"("partnerId");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_phoneNumber_idx" ON "WhatsAppConversation"("phoneNumber");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_state_idx" ON "WhatsAppConversation"("state");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_lastAutoResponseAt_idx" ON "WhatsAppConversation"("lastAutoResponseAt");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_lastHumanResponseAt_idx" ON "WhatsAppConversation"("lastHumanResponseAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConversation_partnerId_phoneNumber_key" ON "WhatsAppConversation"("partnerId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_sessionId_idx" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_partnerId_idx" ON "UserSession"("partnerId");

-- CreateIndex
CREATE INDEX "UserSession_ipAddress_idx" ON "UserSession"("ipAddress");

-- CreateIndex
CREATE INDEX "UserSession_createdAt_idx" ON "UserSession"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");

-- CreateIndex
CREATE INDEX "PageView_partnerId_idx" ON "PageView"("partnerId");

-- CreateIndex
CREATE INDEX "PageView_page_idx" ON "PageView"("page");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_sessionId_idx" ON "UserActivity"("sessionId");

-- CreateIndex
CREATE INDEX "UserActivity_partnerId_idx" ON "UserActivity"("partnerId");

-- CreateIndex
CREATE INDEX "UserActivity_page_idx" ON "UserActivity"("page");

-- CreateIndex
CREATE INDEX "UserActivity_elementType_idx" ON "UserActivity"("elementType");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "UserActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEnhancementUsage" ADD CONSTRAINT "AIEnhancementUsage_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promoter" ADD CONSTRAINT "Promoter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerInvitation" ADD CONSTRAINT "PartnerInvitation_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerInvitation" ADD CONSTRAINT "PartnerInvitation_resultingPartnerId_fkey" FOREIGN KEY ("resultingPartnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_invitedByPromoterId_fkey" FOREIGN KEY ("invitedByPromoterId") REFERENCES "Promoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoterCommission" ADD CONSTRAINT "PromoterCommission_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoterCommission" ADD CONSTRAINT "PromoterCommission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrechoBusinessHours" ADD CONSTRAINT "BrechoBusinessHours_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BrechoBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrechoSearchResult" ADD CONSTRAINT "BrechoSearchResult_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BrechoBusiness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrechoSearchResult" ADD CONSTRAINT "BrechoSearchResult_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrechoMapView" ADD CONSTRAINT "BrechoMapView_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrechoExportRequest" ADD CONSTRAINT "BrechoExportRequest_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

