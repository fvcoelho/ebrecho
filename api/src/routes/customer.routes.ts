import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validate.middleware';
import { 
  createCustomerSchema, 
  updateCustomerSchema, 
  customerParamsSchema,
  createAddressSchema,
  updateAddressSchema,
  addressParamsSchema
} from '../schemas/customer.schema';

const router = Router();

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Register a new customer
 *     tags: [Customers]
 *     description: Public endpoint for customer registration
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Customer full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *               phone:
 *                 type: string
 *                 description: Customer phone number
 *               cpf:
 *                 type: string
 *                 description: Customer CPF (Brazilian tax ID)
 *               partnerId:
 *                 type: string
 *                 description: Partner store ID
 *               promoterId:
 *                 type: string
 *                 description: Promoter ID who referred this customer
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', validate(createCustomerSchema), customerController.createCustomer);

/**
 * @swagger
 * /api/customers/{customerId}/addresses:
 *   post:
 *     summary: Add a new address for a customer
 *     tags: [Customers]
 *     description: Public endpoint to add customer address
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - street
 *               - number
 *               - neighborhood
 *               - city
 *               - state
 *               - zipCode
 *             properties:
 *               street:
 *                 type: string
 *                 description: Street name
 *               number:
 *                 type: string
 *                 description: Street number
 *               complement:
 *                 type: string
 *                 description: Address complement
 *               neighborhood:
 *                 type: string
 *                 description: Neighborhood
 *               city:
 *                 type: string
 *                 description: City
 *               state:
 *                 type: string
 *                 description: State code (2 letters)
 *               zipCode:
 *                 type: string
 *                 description: ZIP code
 *               isDefault:
 *                 type: boolean
 *                 description: Set as default address
 *     responses:
 *       201:
 *         description: Address created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:customerId/addresses', 
  validate(customerParamsSchema), 
  validate(createAddressSchema), 
  customerController.createCustomerAddress
);
/**
 * @swagger
 * /api/customers/{customerId}/addresses/{addressId}:
 *   put:
 *     summary: Update a customer address
 *     tags: [Customers]
 *     description: Public endpoint to update customer address
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               street:
 *                 type: string
 *               number:
 *                 type: string
 *               complement:
 *                 type: string
 *               neighborhood:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:customerId/addresses/:addressId', 
  validate(addressParamsSchema), 
  validate(updateAddressSchema), 
  customerController.updateCustomerAddress
);
/**
 * @swagger
 * /api/customers/{customerId}/addresses/{addressId}:
 *   delete:
 *     summary: Delete a customer address
 *     tags: [Customers]
 *     description: Public endpoint to delete customer address
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:customerId/addresses/:addressId', 
  validate(addressParamsSchema), 
  customerController.deleteCustomerAddress
);

// Authenticated routes
router.use(authenticate);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get customers list
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     description: Returns customers filtered by partner for non-admin users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email or phone
 *       - in: query
 *         name: promoterId
 *         schema:
 *           type: string
 *         description: Filter by promoter ID
 *       - in: query
 *         name: hasOrders
 *         schema:
 *           type: boolean
 *         description: Filter customers with/without orders
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', customerController.getCustomers);
/**
 * @swagger
 * /api/customers/stats:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     description: Returns customer statistics for the authenticated partner
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCustomers:
 *                       type: integer
 *                     newCustomersThisMonth:
 *                       type: integer
 *                     activeCustomers:
 *                       type: integer
 *                     customersByMonth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     topCustomers:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', customerController.getCustomerStats);
/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         cpf:
 *                           type: string
 *                         addresses:
 *                           type: array
 *                           items:
 *                             type: object
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', validate(customerParamsSchema), customerController.getCustomerById);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer information
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only - Update customer details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               cpf:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', 
  validate(customerParamsSchema), 
  validate(updateCustomerSchema), 
  authorize(['ADMIN']), 
  customerController.updateCustomer
);

export default router;