import { Router } from 'express';
import placesController from '../controllers/places.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/places/autocomplete:
 *   get:
 *     tags: [Places]
 *     summary: Get location autocomplete suggestions
 *     description: Returns location suggestions based on user input using Google Places Autocomplete API
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: input
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *         description: Search query (minimum 3 characters)
 *         example: "São Paulo"
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Comma-separated list of place types to restrict results
 *         example: "geocode,establishment"
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           default: "BR"
 *         description: Country code to restrict results (ISO 3166-1 Alpha-2)
 *         example: "BR"
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Language for results
 *         example: "pt-BR"
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           default: "br"
 *         description: Region code for results
 *         example: "br"
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
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
 *                     predictions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           place_id:
 *                             type: string
 *                             description: Unique identifier for this place
 *                           description:
 *                             type: string
 *                             description: Full description of the place
 *                           structured_formatting:
 *                             type: object
 *                             properties:
 *                               main_text:
 *                                 type: string
 *                                 description: Main part of the description
 *                               secondary_text:
 *                                 type: string
 *                                 description: Secondary part of the description
 *                           types:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Array of place types
 *                     status:
 *                       type: string
 *                       example: "OK"
 *                 cached:
 *                   type: boolean
 *                   description: Whether result was returned from cache
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid request parameters"
 *                 details:
 *                   type: array
 *                   description: Validation error details (if applicable)
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/autocomplete', placesController.autocomplete.bind(placesController));

/**
 * @swagger
 * /api/places/details:
 *   get:
 *     tags: [Places]
 *     summary: Get detailed information for a specific place
 *     description: Returns comprehensive details for a place using its place ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique place identifier from autocomplete results
 *         example: "ChIJOwg_06VPwokRYv534QaPC8g"
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to include in response
 *         example: "place_id,name,formatted_address,geometry,types"
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Language for results
 *         example: "pt-BR"
 *     responses:
 *       200:
 *         description: Place details
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
 *                     result:
 *                       type: object
 *                       properties:
 *                         place_id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         formatted_address:
 *                           type: string
 *                         address_components:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               long_name:
 *                                 type: string
 *                               short_name:
 *                                 type: string
 *                               types:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                         geometry:
 *                           type: object
 *                           properties:
 *                             location:
 *                               type: object
 *                               properties:
 *                                 lat:
 *                                   type: number
 *                                 lng:
 *                                   type: number
 *                         types:
 *                           type: array
 *                           items:
 *                             type: string
 *                         rating:
 *                           type: number
 *                           description: Business rating (1-5 stars)
 *                           example: 4.5
 *                         user_ratings_total:
 *                           type: integer
 *                           description: Total number of ratings
 *                           example: 127
 *                         photos:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               photo_reference:
 *                                 type: string
 *                                 description: Reference ID for Google Places photo
 *                               height:
 *                                 type: integer
 *                               width:
 *                                 type: integer
 *                           description: Array of available photos
 *                         formatted_phone_number:
 *                           type: string
 *                           description: Phone number in local format
 *                           example: "(11) 1234-5678"
 *                         international_phone_number:
 *                           type: string
 *                           description: Phone number in international format
 *                           example: "+55 11 1234-5678"
 *                         vicinity:
 *                           type: string
 *                           description: Simplified address information
 *                         website:
 *                           type: string
 *                           description: Business website URL
 *                         business_status:
 *                           type: string
 *                           description: Current operational status
 *                           enum: [OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY]
 *                         opening_hours:
 *                           type: object
 *                           properties:
 *                             open_now:
 *                               type: boolean
 *                               description: Whether the place is currently open
 *                             periods:
 *                               type: array
 *                               items:
 *                                 type: object
 *                               description: Opening hours for each day
 *                             weekday_text:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               description: Human-readable opening hours
 *                     status:
 *                       type: string
 *                       example: "OK"
 *                 cached:
 *                   type: boolean
 *                   description: Whether result was returned from cache
 *       400:
 *         description: Invalid request parameters or Google API error
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/details', placesController.details.bind(placesController));

/**
 * @swagger
 * /api/places/nearby:
 *   get:
 *     tags: [Places]
 *     summary: Search for nearby businesses
 *     description: Returns businesses near a specific location using Google Places Nearby Search API
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^-?\d+\.?\d*,-?\d+\.?\d*$'
 *         description: Latitude and longitude separated by comma
 *         example: "-23.5505,-46.6333"
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50000
 *           default: 5000
 *         description: Search radius in meters (max 50km)
 *         example: 5000
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           default: "establishment"
 *         description: Type of place to search for
 *         example: "store"
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Keyword to filter results
 *         example: "restaurant"
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Language for results
 *         example: "pt-BR"
 *     responses:
 *       200:
 *         description: Nearby businesses found
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
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           place_id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           vicinity:
 *                             type: string
 *                           rating:
 *                             type: number
 *                           user_ratings_total:
 *                             type: integer
 *                           geometry:
 *                             type: object
 *                             properties:
 *                               location:
 *                                 type: object
 *                                 properties:
 *                                   lat:
 *                                     type: number
 *                                   lng:
 *                                     type: number
 *                           photos:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 photo_reference:
 *                                   type: string
 *                           types:
 *                             type: array
 *                             items:
 *                               type: string
 *                           business_status:
 *                             type: string
 *                             enum: [OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY]
 *                           price_level:
 *                             type: integer
 *                             minimum: 0
 *                             maximum: 4
 *                     status:
 *                       type: string
 *                       example: "OK"
 *                     next_page_token:
 *                       type: string
 *                       description: Token for pagination (if available)
 *                 cached:
 *                   type: boolean
 *                   description: Whether result was returned from cache
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/nearby', placesController.nearby.bind(placesController));

/**
 * @swagger
 * /api/places/photo:
 *   get:
 *     tags: [Places]
 *     summary: Get Google Places photo URL
 *     description: Generate a URL for accessing a Google Places photo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: photoReference
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo reference from place details
 *       - in: query
 *         name: maxWidth
 *         schema:
 *           type: integer
 *           default: 400
 *         description: Maximum width in pixels
 *       - in: query
 *         name: maxHeight
 *         schema:
 *           type: integer
 *         description: Maximum height in pixels
 *     responses:
 *       200:
 *         description: Photo URL generated
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
 *                     photoUrl:
 *                       type: string
 *                       description: Direct URL to the Google Places photo
 *       400:
 *         description: Photo reference is required
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/photo', placesController.getPhotoUrl.bind(placesController));

/**
 * @swagger
 * /api/places/stats:
 *   get:
 *     tags: [Places]
 *     summary: Get Places API usage statistics
 *     description: Returns cache and API configuration statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API statistics
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
 *                     cache:
 *                       type: object
 *                       properties:
 *                         totalEntries:
 *                           type: integer
 *                         validEntries:
 *                           type: integer
 *                         expiredEntries:
 *                           type: integer
 *                         cacheTimeoutMinutes:
 *                           type: integer
 *                     api:
 *                       type: object
 *                       properties:
 *                         hasApiKey:
 *                           type: boolean
 *                         baseUrl:
 *                           type: string
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/stats', placesController.getStats.bind(placesController));

/**
 * @swagger
 * /api/places/cache:
 *   delete:
 *     tags: [Places]
 *     summary: Clear Places API cache
 *     description: Clears all cached autocomplete and details results (for development)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
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
 *                     message:
 *                       type: string
 *                     previousSize:
 *                       type: integer
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.delete('/cache', placesController.clearCache.bind(placesController));

export default router;