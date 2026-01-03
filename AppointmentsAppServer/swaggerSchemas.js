/**
 * @openapi
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         business:
 *           type: string
 *         user:
 *           type: string
 *         service:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         time:
 *           type: string
 *         durationMinutes:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [booked, completed, canceled]
 *     Business:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         ownerName:
 *           type: string
 *         ownerPhone:
 *           type: string
 *         businessPhone:
 *           type: string
 *         category:
 *           type: string
 *         address:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *             street:
 *               type: string
 *             buildingNumber:
 *               type: string
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [Point]
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         icon:
 *           type: string
 *         description:
 *           type: string
 *         order:
 *           type: number
 *     OTP:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         phone:
 *           type: string
 *         otp:
 *           type: string
 *     Service:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         business:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         durationMinutes:
 *           type: integer
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         phone:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [client, business_owner, admin]
 *         verified:
 *           type: boolean
 *         businessId:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
