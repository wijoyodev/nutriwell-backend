import express from 'express';
import multer from 'multer';
import {
  refreshTokenUser,
  loginUser,
  logoutUser,
  resetPasswordUser,
  verificationEmail,
  resetPasswordVerification,
  verifyEmail,
} from '../controllers/auth';
import { getMe, getProfileById, getUserByValue, registerAdmin, registerUser, updateUser } from '../controllers/user';
import { createBanner, deleteBanner, selectBanner, updateBanner } from '../controllers/banner';
import { createProduct, selectProduct, updateProduct } from '../controllers/product';
import { getMyNetworkStat, getMyNetworks, getNetworkDetail, getNetworkList } from '../controllers/network';
import * as validation from '../lib/validation';
import { checkSession, isAdmin } from '../middlewares';
import { createShipment, selectMyShipment, selectShipment, updateShipment } from '../controllers/shipment';
import { createCart, deleteCart, selectCart, updateQuantityCart } from '../controllers/cart';
import {
  createOrder,
  getTracking,
  selectMyOrders,
  selectOrderById,
  selectOrders,
  updateOrder,
  updateOrderWebhook,
} from '../controllers/order';
import { getRates } from '../controllers/courier-rate';
import { getRewards } from '../controllers/reward';
import { createDisbursement, getDisbursement, listBank, updateDisbursement } from '../controllers/disbursement';
import { selectCity, selectDistrict, selectProvince } from '../controllers/address';
import path from 'path';
const router = express.Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_req, file, cb) => {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    cb(null, `img-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// auth
/**
 @swagger
 /verification-email:
 *  post:
 *      summary: Customer
 *      description: verification email for register
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                              example: email@email.com
 *                          referrer_code:
 *                              type: string
 *                              required: false
 *                              example: G08FS
 *      responses:
 *          '200':
 *              description: Email Sent to User
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      status:
 *                                          type: string
 *                                          example: OK
 *          '400':
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError / VerificationEmail
 *          '404':
 *              description: Not Found Referrer Code
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: NotFoundError
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.post('/verification-email', verificationEmail);
router.get('/verification-email/:token', verifyEmail);
/**
 @swagger
 /register:
 *  post:
 *      summary: Customer
 *      description: register new customer
 *      requestBody:
 *          required: true
 *          content:
 *              multipart/form-data:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          full_name:
 *                              type: string
 *                              example: John Doe
 *                          email:
 *                              type: string
 *                              example: email@email.com
 *                          password:
 *                              type: string
 *                              example: 123456
 *                          confirm_password:
 *                              type: string
 *                              example: 123456
 *                          phone_number_country:
 *                              type: string
 *                              example: ID
 *                          phone_number:
 *                              type: string
 *                              example: 89638139125
 *                          gender:
 *                              type: string
 *                              example: male
 *                          date_of_birth:
 *                              type: string
 *                              example: 1996-05-24T17:00:00.000Z
 *                          avatar:
 *                              type: string
 *                              format: binary
 *                              required: false
 *                          referrer_code:
 *                              type: string
 *                              required: false
 *                              example: G08FS
 *                          referrer_id:
 *                              type: string
 *                              required: false
 *                              example: 41
 *      responses:
 *          '201':
 *              description: User Created
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      full_name:
 *                                          type: string
 *                                          example: John Doe
 *                                      email:
 *                                          type: string
 *                                          example: email@email.com
 *                                      token:
 *                                          type: string
 *                                          example: <json web token>
 *                                      refresh_token:
 *                                          type: string
 *                                          example: <json web token>
 *          '400':
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.post('/register', upload.single('avatar'), validation.registerSchema, registerUser);
/**
 @swagger
 *
 * /register/admin:
 *  post:
 *      summary: Admin
 *      description: register new admin
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                              example: Jaka Tingkir
 *                          email:
 *                              type: string
 *                              example: admin@email.com
 *                          password:
 *                              type: string
 *                              example: 123456
 *                          role:
 *                              type: number
 *                              example: 1
 *      responses:
 *          '201':
 *              description: User Created
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      status:
 *                                          type: number
 *                                          example: 1
 *          '400':
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError
 *          '401':
 *              description: Unauthorized
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Unauthorized
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.post('/register/admin', checkSession, isAdmin, validation.registerAdminSchema, registerAdmin);
/**
 @swagger
 /login:
 *  post:
 *      description: login all user (customer/admin)
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          user_account:
 *                              type: string
 *                              example: email@email.com / 089639132314
 *                          password:
 *                              type: string
 *                              example: 123456
 *      responses:
 *          '200':
 *              description: User Created
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      full_name:
 *                                          type: string
 *                                          example: John Doe
 *                                      email:
 *                                          type: string
 *                                          example: email@email.com
 *                                      user_id:
 *                                          type: number
 *                                          example: 39
 *                                      phone_number:
 *                                          type: string
 *                                          example: 09232021323
 *                                      phone_number_country:
 *                                          type: string
 *                                          example: +62
 *                                      gender:
 *                                          type: string
 *                                          example: male
 *                                      avatar_url:
 *                                          type: string
 *                                          example: https://suitable-evidently-caribou.ngrok-free.app/img-1714232680500.png
 *                                      date_of_birth:
 *                                          type: string
 *                                          example: 1996-05-24T17:00:00.000Z
 *                                      token:
 *                                          type: string
 *                                          example: <json web token>
 *                                      refresh_token:
 *                                          type: string
 *                                          example: <json web token>
 *          '400':
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.post('/login', validation.loginSchema, loginUser);
/**
 @swagger
 /reset-password:
 *  post:
 *      description: reset password for user
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                              example: email@email.com
 *      responses:
 *          '200':
 *              description: Reset password request has been processed.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      message:
 *                                          type: string
 *                                          example: Request has been processed
 *          '400':
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.post('/reset-password', resetPasswordUser);
/**
 @swagger
 /reset-password/{token}:
 *  get:
 *      description: reset password verification for user
 *      parameters:
 *          - in: path
 *            name: token
 *            schema:
 *              type: string
 *            required: true
 *            description: reset password token
 *      responses:
 *          '200':
 *              description: Reset password verification return id of user.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      user_id:
 *                                          type: string
 *                                          example: 43
 *          '400':
 *              description: Bad Request / Token Expired
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError / TokenExpiredError
 *          '404':
 *              description: Reset password token not found
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: NotFoundError
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.get('/reset-password/:token', resetPasswordVerification);
/**
 @swagger
 /logout:
 *  post:
 *      description: logout all user (customer and admin)
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                              example: email@email.com
 *                          refresh_token:
 *                              type: string
 *                              example: <json web token>
 *      responses:
 *          '200':
 *              description: session has been deleted.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      status:
 *                                          type: number
 *                                          example: 1
 *                                      email:
 *                                          type: string
 *                                          example: email@email.com
 *          '400':
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.post('/logout', validation.logoutSchema, logoutUser);
/**
 @swagger
 /refresh:
 *  post:
 *      description: refresh token of user
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                              example: email@email.com
 *                          password:
 *                              type: string
 *                              example: 123456
 *      responses:
 *          '200':
 *              description: Access token renewed.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      access_token:
 *                                          type: string
 *                                          example: <json web token>
 *                                      refresh_token:
 *                                          type: string
 *                                          example: <json web token>
 *          '400':
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError
 *          '401':
 *              description: Unauthorized
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Unauthorized
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.post('/refresh', checkSession, validation.refreshTokenSchema, refreshTokenUser);

// users
/**
 @swagger
 /user:
 *  get:
 *      security:
 *        - bearerAuth: []
 *      description: Get all users based on query params
 *      parameters:
 *          - name: userType
 *            description: this is for dashboard side bar purpose, member or admin management
 *            required: false
 *            in: query
 *            schema:
 *              type: string
 *          - name: role
 *            description: role of user
 *            required: false
 *            in: query
 *            schema:
 *              type: number
 *          - name: id
 *            description: id of the user
 *            required: false
 *            in: query
 *            schema:
 *              type: string
 *          - name: email
 *            description: email of the user
 *            required: false
 *            in: query
 *            schema:
 *              type: string
 *          - name: search
 *            description: for dashboard, search based on full text on field 'full_name', 'email', 'code'. For email, don't include the domain (@gmail.com)
 *            required: false
 *            in: query
 *            schema:
 *              type: string
 *          - name: phone_number
 *            description: phone number of the user
 *            required: false
 *            in: query
 *            schema:
 *              type: string
 *          - name: offset
 *            description: for pagination, default to 0
 *            required: false
 *            in: query
 *            schema:
 *              type: string
*          - name: sort
 *            description: sort by created_at, desc / asc
 *            required: false
 *            in: query
 *            schema:
 *              type: string
 *      responses:
 *          '200':
 *              description: Get all users
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              result:
 *                                  type: object
 *                                  properties:
 *                                      data:
 *                                        type: array
 *                                        items:
 *                                          type: object
 *                                          properties:
 *                                              id:
 *                                                  type: number
 *                                                  example: 1
 *                                              code:
 *                                                  type: number
 *                                                  example: CU01
 *                                              role:
 *                                                  type: number
 *                                                  example: 4
 *                                              full_name:
 *                                                  type: string
 *                                                  example: Jaka Tingkir
 *                                              email:
 *                                                  type: string
 *                                                  example: email@email.com
 *                                              phone_number:
 *                                                  type: string
 *                                                  example: 089638139125
 *                                      offset:
 *                                        type: number
 *                                        example: 0
 *                                      limit:
 *                                        type: number
 *                                        example: 10
 *                                      total:
 *                                        type: number  
 *                                        example: 10
 *          '400':
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: BadRequestError
 *          '500':
 *              description: Something Went Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: Error
 */
router.get('/user', checkSession, getUserByValue);
router.get('/user/me', checkSession, getMe);
router.get('/user/:id', checkSession, getProfileById);
router.patch('/user/:id', checkSession, upload.single('avatar'), updateUser);

// networks
router.get('/network', checkSession, getNetworkList);
router.get('/network/status', checkSession, getMyNetworkStat);
router.get('/network/me', checkSession, getMyNetworks);
router.get('/network/:id', checkSession, getNetworkDetail);

// banners
router.get('/banner', checkSession, selectBanner);
router.post('/banner', checkSession, isAdmin, upload.single('banner'), validation.bannerSchema, createBanner);
router.patch('/banner/:id', checkSession, isAdmin, upload.single('banner'), updateBanner);
router.delete('/banner/:id', checkSession, isAdmin, deleteBanner);

// products
router.get('/product', checkSession, selectProduct);
router.post('/product', checkSession, isAdmin, upload.array('product', 8), validation.productSchema, createProduct);
router.patch('/product/:id', checkSession, isAdmin, upload.array('product', 8), updateProduct);

// shipments
router.get('/address', checkSession, selectShipment);
router.get('/address/me', checkSession, selectMyShipment);
router.post('/address', checkSession, validation.shipmentSchema, createShipment);
router.patch('/address', checkSession, updateShipment);

// cart
router.get('/cart', checkSession, selectCart);
router.post('/cart', checkSession, validation.cartSchema, createCart);
router.patch('/cart/:id', checkSession, updateQuantityCart);
router.delete('/cart/:id', checkSession, deleteCart);

// orders
router.get('/order', checkSession, selectOrders);
router.get('/order/me', checkSession, selectMyOrders);
router.get('/order/track/:external_id', checkSession, getTracking);
router.post('/order', checkSession, validation.orderSchema, createOrder);
router.post('/order/webhook', updateOrderWebhook);
router.get('/order/:id', checkSession, selectOrderById);
router.patch('/order/:id', checkSession, isAdmin, updateOrder);

//biteship
router.post('/courier-rates', checkSession, validation.rateSchema, getRates);

// rewards
router.get('/reward', checkSession, getRewards);

// disbursements
router.get('/disbursement', checkSession, getDisbursement);
router.get('/disbursement/bank', checkSession, listBank);
router.post('/disbursement', checkSession, createDisbursement);
router.post('/disbursement/webhook', updateDisbursement);

// address
router.get('/address-list/province', checkSession, selectProvince);
router.get('/address-list/city', checkSession, selectCity);
router.get('/address-list/district', checkSession, selectDistrict);

export default router;
