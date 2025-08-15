import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { acceptInvitationSchema } from '../../schemas/promoter.schema';
import {
  getInvitationDetails,
  acceptInvitation,
  declineInvitation,
} from '../../controllers/public/public-invitation.controller';

const router = Router();

/**
 * @swagger
 * /api/public/invitations/{code}:
 *   get:
 *     summary: Get invitation details
 *     description: Get details about a promoter invitation
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation code
 *     responses:
 *       200:
 *         description: Invitation details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         code:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         message:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                         promoter:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             tier:
 *                               type: string
 *                         commission:
 *                           type: object
 *                           properties:
 *                             rate:
 *                               type: number
 *                             description:
 *                               type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       410:
 *         description: Invitation expired or already used
 */
router.get('/:code', getInvitationDetails);

/**
 * @swagger
 * /api/public/invitations/{code}/accept:
 *   post:
 *     summary: Accept invitation
 *     description: Accept a promoter invitation and register as partner
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - partnerName
 *               - partnerSlug
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email (must match invitation)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               name:
 *                 type: string
 *                 description: User full name
 *               partnerName:
 *                 type: string
 *                 description: Partner store name
 *               partnerSlug:
 *                 type: string
 *                 description: Partner store slug (URL identifier)
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *               description:
 *                 type: string
 *                 description: Store description
 *     responses:
 *       201:
 *         description: Invitation accepted and account created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         partner:
 *                           $ref: '#/components/schemas/Partner'
 *                         token:
 *                           type: string
 *                           description: JWT authentication token
 *       400:
 *         description: Invalid invitation or data
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: User or partner already exists
 *       410:
 *         description: Invitation expired or already used
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/:code/accept', validate(acceptInvitationSchema), acceptInvitation);

/**
 * @swagger
 * /api/public/invitations/{code}/decline:
 *   post:
 *     summary: Decline invitation
 *     description: Decline a promoter invitation
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation code
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for declining
 *     responses:
 *       200:
 *         description: Invitation declined successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       410:
 *         description: Invitation expired or already used
 */
router.post('/:code/decline', declineInvitation);

export default router;