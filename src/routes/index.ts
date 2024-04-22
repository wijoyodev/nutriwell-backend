import express from 'express';
import multer from 'multer';
import { refreshTokenUser, loginUser, logoutUser, resetPasswordUser } from '../controllers/auth';
import { getUserByValue, registerAdmin, registerUser, updateUser } from '../controllers/user';
import { loginSchema, logoutSchema, refreshTokenSchema, registerAdminSchema, registerSchema } from '../lib/validation';
import { checkSession } from '../middlewares';

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
router.post('/register/admin', registerAdminSchema, registerAdmin);
router.post('/login', loginSchema, loginUser);
router.get('/refresh', checkSession, refreshTokenSchema, refreshTokenUser);
router.post('/logout', checkSession, logoutSchema, logoutUser);
router.post('/reset-password', resetPasswordUser);

// users
router.get('/user', checkSession, getUserByValue);
router.patch('/user', checkSession, updateUser);

export default router;
