import {Router} from 'express'
import {
    joinQueue,
    leaveQueue,
    getShopQueue,
    nextCustomer
} from '../controllers/queue.controllers.js'
import { verfiyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// customer joins queue
router.post('/:shopId/join', verfiyJWT, joinQueue)
// customer leave queue
router.delete('/:queueId/leave', verfiyJWT , leaveQueue)

// Get active queue for a shop
router.get('/shop/:shopId', getShopQueue)

// shop owner move to next customer
router.post('/:shopId/next', verfiyJWT, nextCustomer);

export default router;