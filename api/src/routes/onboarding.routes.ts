import { Router } from 'express';
import * as onboardingController from '../controllers/onboarding.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { completePartnerRegistrationSchema } from '../schemas/onboarding.schema';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /api/onboarding/status:
 *   get:
 *     summary: Get onboarding status for current user
 *     description: Check if the user has completed onboarding and needs to setup a partner store
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isComplete:
 *                       type: boolean
 *                       description: Whether onboarding is complete
 *                       example: false
 *                     requiresPartnerSetup:
 *                       type: boolean
 *                       description: Whether user needs to setup partner store
 *                       example: true
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "user-123"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john@example.com"
 *                         role:
 *                           type: string
 *                           enum: [ADMIN, PARTNER_ADMIN, PARTNER_USER, PROMOTER, PARTNER_PROMOTER, CUSTOMER]
 *                           example: "PARTNER_ADMIN"
 *                         partnerId:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                     partner:
 *                       type: object
 *                       nullable: true
 *                       description: Partner details if user has a partner
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/status', onboardingController.getOnboardingStatus as any);

/**
 * @swagger
 * /api/onboarding/complete-partner:
 *   post:
 *     summary: Complete partner registration
 *     description: Create a partner store for a PARTNER_ADMIN user
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - document
 *               - documentType
 *               - hasPhysicalStore
 *             properties:
 *               name:
 *                 type: string
 *                 description: Partner store name
 *                 example: "Fashion Store"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Partner business email
 *                 example: "store@example.com"
 *               phone:
 *                 type: string
 *                 description: Partner phone number
 *                 example: "+5511999999999"
 *               document:
 *                 type: string
 *                 description: Business document (CNPJ or CPF)
 *                 example: "12.345.678/0001-90"
 *               documentType:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *                 description: Type of document
 *                 example: "CNPJ"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Store description
 *                 example: "Premium second-hand fashion store"
 *               hasPhysicalStore:
 *                 type: boolean
 *                 description: Whether partner has a physical store
 *                 example: true
 *               address:
 *                 type: object
 *                 description: Required if hasPhysicalStore is true
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "Rua Example"
 *                   number:
 *                     type: string
 *                     example: "123"
 *                   complement:
 *                     type: string
 *                     nullable: true
 *                     example: "Apt 45"
 *                   neighborhood:
 *                     type: string
 *                     example: "Centro"
 *                   city:
 *                     type: string
 *                     example: "São Paulo"
 *                   state:
 *                     type: string
 *                     example: "SP"
 *                   zipCode:
 *                     type: string
 *                     example: "01310-100"
 *     responses:
 *       200:
 *         description: Partner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cadastro do parceiro concluído com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     partner:
 *                       $ref: '#/components/schemas/Partner'
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: New JWT token with updated user data
 *                       example: "eyJhbGciOiJIUzI1NiIs..."
 *       400:
 *         description: Validation error or partner already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               alreadyHasPartner:
 *                 value:
 *                   success: false
 *                   error: "Usuário já possui um parceiro associado"
 *               duplicatePartner:
 *                 value:
 *                   success: false
 *                   error: "Já existe um parceiro com este documento ou email"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only PARTNER_ADMIN users can create partners
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Apenas usuários PARTNER_ADMIN podem criar parceiros"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/complete-partner',
  validate(completePartnerRegistrationSchema),
  onboardingController.completePartnerRegistration as any
);

export default router;