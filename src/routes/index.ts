import express from 'express';
import Logger from '../lib/logger';

const router = express.Router();

/**
 * @swagger
 * /hello:
 *  post:
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
router.post('/hello', (req, res) => {
  const { name } = req.body;
  Logger.error('Error in path /hello');
  res.status(200).json({
    title: 'Hello this is new path',
    name,
  });
});

export default router;
