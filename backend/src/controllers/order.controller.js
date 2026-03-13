const { Order, Product, User } = require('../models');
const { sequelize } = require('../models');
const mpesaService = require('../services/mpesa.service');
const { sendSMS } = require('../utils/sms');
const { generateOrderNumber } = require('../utils/helpers');

// Create new order
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      productId,
      quantity,
      paymentMethod,
      deliveryAddress,
      deliveryLocation,
      notes
    } = req.body;

    // Get product details with lock
    const product = await Product.findByPk(productId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
      include: [{ model: User, as: 'farmer' }]
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check availability
    if (product.quantity < quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} ${product.unit} available`
      });
    }

    // Calculate total amount
    const totalAmount = product.price * quantity;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      productId,
      buyerId: req.user.id,
      sellerId: product.farmerId,
      quantity,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      deliveryLocation,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    }, { transaction });

    // Reduce product quantity
    product.quantity -= quantity;
    await product.save({ transaction });

    // If payment method is M-Pesa, initiate STK Push
    if (paymentMethod === 'mpesa') {
      try {
        const mpesaResponse = await mpesaService.stkPush(
          req.user.phone,
          totalAmount,
          orderNumber,
          `Payment for ${product.name}`
        );

        if (mpesaResponse.ResponseCode === '0') {
          order.mpesaCheckoutRequestID = mpesaResponse.CheckoutRequestID;
          order.mpesaMerchantRequestID = mpesaResponse.MerchantRequestID;
          await order.save({ transaction });

          await transaction.commit();

          // Send SMS notifications
          await sendSMS(
            req.user.phone,
            `Order ${orderNumber} created. Please complete payment of KES ${totalAmount} on your phone.`
          );

          await sendSMS(
            product.farmer.phone,
            `New order ${orderNumber} for ${quantity} ${product.unit} of ${product.name} is pending payment.`
          );

          return res.json({
            success: true,
            message: 'Order created. Please complete payment on your phone.',
            data: {
              order,
              mpesa: {
                checkoutRequestID: mpesaResponse.CheckoutRequestID,
                merchantRequestID: mpesaResponse.MerchantRequestID
              }
            }
          });
        }
      } catch (mpesaError) {
        console.error('M-Pesa error:', mpesaError);
        // Order created but payment failed
        order.paymentStatus = 'failed';
        await order.save({ transaction });
        await transaction.commit();
        
        return res.status(400).json({
          success: false,
          message: 'Order created but payment initiation failed',
          data: order
        });
      }
    }

    await transaction.commit();

    // Send SMS for cash on delivery
    if (paymentMethod === 'cash') {
      await sendSMS(
        req.user.phone,
        `Order ${orderNumber} created successfully! Total: KES ${totalAmount} (Cash on Delivery)`
      );
      
      await sendSMS(
        product.farmer.phone,
        `New order ${orderNumber} for ${quantity} ${product.unit} of ${product.name} (Cash on Delivery)`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get buyer's orders
exports.getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let whereClause = { buyerId: req.user.id };
    
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'unit', 'images', 'category']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'profileImage']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get seller's orders (for farmers)
exports.getSellerOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let whereClause = { sellerId: req.user.id };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'unit', 'images', 'category']
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate statistics
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0)
    };

    res.json({
      success: true,
      stats,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Product,
          include: [{ model: User, as: 'farmer', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: Product }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is seller or admin
    if (order.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Validate status transitions
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // Update status
    const oldStatus = order.status;
    order.status = status;
    
    // If delivered, update payment status if cash on delivery
    if (status === 'delivered' && order.paymentMethod === 'cash') {
      order.paymentStatus = 'paid';
    }
    
    await order.save();

    // Send SMS notifications
    const statusMessages = {
      'confirmed': 'Your order has been confirmed and is being prepared.',
      'processing': 'Your order is now being processed.',
      'shipped': 'Your order has been shipped and is on the way!',
      'delivered': 'Your order has been delivered. Thank you for shopping with Harvest Circle!',
      'cancelled': 'Your order has been cancelled.'
    };

    if (statusMessages[status]) {
      await sendSMS(
        order.buyer.phone,
        `Order #${order.orderNumber}: ${statusMessages[status]}`
      );
    }

    // If cancelled, restore product quantity
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const product = await Product.findByPk(order.productId);
      if (product) {
        product.quantity += order.quantity;
        await product.save();
      }
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// Cancel order (buyer)
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'seller' },
        { model: Product }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is buyer
    if (order.buyerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled at ${order.status} stage`
      });
    }

    // Update status
    order.status = 'cancelled';
    await order.save();

    // Restore product quantity
    const product = await Product.findByPk(order.productId);
    if (product) {
      product.quantity += order.quantity;
      await product.save();
    }

    // Send notifications
    await sendSMS(
      order.seller.phone,
      `Order #${order.orderNumber} has been cancelled by the buyer.`
    );

    await sendSMS(
      req.user.phone,
      `Order #${order.orderNumber} has been cancelled successfully.`
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// M-Pesa callback
exports.mpesaCallback = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;
    
    const { CheckoutRequestID, ResultCode, ResultDesc, Amount, MpesaReceiptNumber, TransactionDate } = stkCallback;

    // Find order by checkout request ID
    const order = await Order.findOne({
      where: { mpesaCheckoutRequestID: CheckoutRequestID },
      include: [
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' },
        { model: Product }
      ],
      transaction
    });

    if (!order) {
      console.error('Order not found for CheckoutRequestID:', CheckoutRequestID);
      await transaction.rollback();
      return res.json({ ResultCode: 1, ResultDesc: 'Order not found' });
    }

    if (ResultCode === 0) {
      // Payment successful
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.mpesaReceiptNumber = MpesaReceiptNumber;
      order.mpesaTransactionDate = TransactionDate;
      await order.save({ transaction });

      // Send SMS notifications
      await sendSMS(
        order.buyer.phone,
        `Payment received! Your order #${order.orderNumber} is confirmed. Receipt: ${MpesaReceiptNumber}`
      );

      await sendSMS(
        order.seller.phone,
        `Payment received for order #${order.orderNumber}. Please prepare for delivery.`
      );

      await transaction.commit();
      
      console.log(`✅ Payment successful for order ${order.orderNumber}: ${MpesaReceiptNumber}`);
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      order.status = 'payment_failed';
      order.mpesaResultDesc = ResultDesc;
      await order.save({ transaction });

      // Restore product quantity
      const product = await Product.findByPk(order.productId, { transaction });
      if (product) {
        product.quantity += order.quantity;
        await product.save({ transaction });
      }

      // Notify buyer
      await sendSMS(
        order.buyer.phone,
        `Payment failed for order #${order.orderNumber}. Please try again or use a different payment method.`
      );

      await transaction.commit();
      
      console.log(`❌ Payment failed for order ${order.orderNumber}: ${ResultDesc}`);
    }

    // Always respond with success to M-Pesa
    res.json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (error) {
    await transaction.rollback();
    console.error('M-Pesa callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
  }
};

// Get order statistics (for admin)
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const stats = await Order.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
      ],
      group: ['status']
    });

    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        ...whereClause,
        paymentStatus: 'paid'
      }
    });

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totalRevenue,
        totalOrders: stats.reduce((sum, s) => sum + parseInt(s.dataValues.count), 0)
      }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};