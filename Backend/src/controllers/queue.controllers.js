import Queue from '../models/queue.modles.js';
import Shop from '../models/shop.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const joinQueue = asyncHandler(async (req, res) => {
    const {shopId} = req.params;
    const userId = req.user._id;
    const {service} = req.body;

      if (!service?.name || service?.price == null) {
    throw new ApiError(400, 'Service name and price are required');
  }

  // Ensure shop exists and is active
  const shop = await Shop.findById(shopId);
  if (!shop || !shop.isActive) {
    throw new ApiError(404, "Shop not found or inactive") ;
  }

  const existing = await Queue.findOne({
    shop : shopId,
     customer : userId,
     status: {$in: ['wating', 'in progress']}
  });
  
  if (existing) {
    throw new ApiError(409, 'Already in queue')
  }

  // Determine next position
  const last = await Queue.findOne({shop : shopId, status : 'waiting'}).sort({position : -1}).select('position');

  const position = last ? last.position + 1 : 1;

  // estimate start time based on shop's average wait time
  const estimatedStartTime = new Date(
    Date.now() + (position -1) * shop.averageWaitTime * 60000
  );

  const queue = await Queue.create({
    shop : shopId,
    customer : userId,
    service,
    position,
    estimatedStartTime
  })

  return res.status(201).json(
    new ApiResponse(201, {success: true, queue}, "queue add successfully")
  )
})

export const leaveQueue = asyncHandler (async (req, res) => {
  const {queueId} = req.params;
  const userId = req.user._id;

  const queue = await Queue.findById(queueId);
  if (!queue) throw new ApiError(404, 'Queue entry not found');

  // Only owner of the queue entry can leave it
  if (queue.customer.toString() !== userId.toString()) {
    throw new ApiError(403, 'Not your queue entry')
  }

  // Mark as cancelled
  queue.status = 'cancelled';
  await queue.save();

  // reorder remaining waiting customers
  await Queue.updateMany(
    {shop: queue.shop, status: 'waiting', position: {$gt: queue.position}},
    {$inc: {position: -1}}
  );

  return res.status(201).json(
    new ApiResponse(201,{ message: 'Left queue'}, "Leave user successfully")
  )
})

export const getShopQueue = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  const queue = await Queue.find({
    shop: shopId,
    status: {$in: ['waiting', 'in_progress']}
  }).sort({position: 1}).populate('customer', 'fullName'); // adjust fields as needed

  return res.status(201).json(
    new ApiResponse(201, {success : true, queue})
  )

});

export const nextCustomer = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const userId = req.user._id;

  // Only shop owner (or authorized barber logic) should do this.
  const shop = await Shop.findOne({
    _id : shopId,
    owner : userId
  });

  if (!shop) {
    throw new ApiError(403, 'Not shop owner');
  }

  // current in-progress customer if exists
  const current = await Queue.findOne({
    shop: shopId,
    status : 'in_progress'
  });

  if (current) {
    current.status = 'completed';
    await current.save();
  }

  // promote next waiting customer
  const next = await Queue.findOne({
    shop : shopId,
    status : 'waiting'
  }).sort({position : 1});

  if (!next) {
    return res.json({success : true, message : 'No customers in queue'});
  }

  next.status = 'in_progress',
  await next.save();

  return res.status(201).json(new ApiResponse(201, {success : true, next}, "Next customer access successfully"))
  
})