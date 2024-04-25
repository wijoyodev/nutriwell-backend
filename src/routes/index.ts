import express from 'express';
import multer from 'multer';
import { refreshTokenUser, loginUser, logoutUser, resetPasswordUser } from '../controllers/auth';
import { getMyProfile, getUserByValue, registerAdmin, registerUser, updateUser } from '../controllers/user';
import { createBanner, deleteBanner, selectBanner, updateBanner } from '../controllers/banner';
import { createProduct, selectProduct, updateProduct } from '../controllers/product';
import { getNetworkList } from '../controllers/network';
import {
  bannerSchema,
  loginSchema,
  logoutSchema,
  productSchema,
  refreshTokenSchema,
  registerAdminSchema,
  registerSchema,
  shipmentSchema,
} from '../lib/validation';
import { checkSession, isAdmin } from '../middlewares';
import { createShipment, selectShipment, updateShipment } from '../controllers/shipment';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, `${__dirname}/../uploads`),
  filename: (_req, file, cb) => {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    cb(null, `img-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });
/**
 * @swagger
 * /hello:
 *  get:
 *      summary: to get hello
 *      description: to get spesific hello by body data
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                              example: Bambang
 *      responses:
 *          '200':
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              title:
 *                                  type: string
 *                                  example: Hello this is new path
 *                              name:
 *                                  type: string
 *                                  example: Bambang
 */
router.get('/hello', (req, res) => {
  const { name } = req.body;
  res.status(200).json({
    title: 'Hello this is new path',
    name,
  });
});

// auth
router.post('/register', upload.single('avatar'), registerSchema, registerUser);
router.post('/login', loginSchema, loginUser);
router.post('/reset-password', resetPasswordUser);
router.post('/register/admin', checkSession, isAdmin, registerAdminSchema, registerAdmin);
router.get('/refresh', checkSession, refreshTokenSchema, refreshTokenUser);
router.post('/logout', checkSession, logoutSchema, logoutUser);

// users
router.get('/user', checkSession, getUserByValue);
router.get('/user/me', checkSession, getMyProfile);
router.patch('/user', checkSession, updateUser);

// networks
router.get('/network', checkSession, getNetworkList);

// banners
router.get('/banner', checkSession, selectBanner);
router.post('/banner', checkSession, isAdmin, upload.single('banner'), bannerSchema, createBanner);
router.patch('/banner/:id', checkSession, isAdmin, upload.single('banner'), updateBanner);
router.delete('/banner/:id', checkSession, isAdmin, deleteBanner);

// products
router.get('/product', checkSession, selectProduct);
router.post('/product', checkSession, isAdmin, upload.array('product', 8), productSchema, createProduct);
router.patch('/product/:id', checkSession, isAdmin, upload.array('product', 8), updateProduct);

// shipments
router.get('/address', checkSession, selectShipment);
router.post('/address', checkSession, isAdmin, shipmentSchema, createShipment);
router.patch('/address', checkSession, isAdmin, updateShipment);

export default router;
