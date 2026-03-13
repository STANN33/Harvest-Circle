const { Product, User } = require('../models');
const { sequelize } = require('../models');
const { calculateDistance, formatLocationForDB } = require('../utils/location');

// List a new product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      quantity,
      unit,
      price,
      harvestDate,
      expiryDate,
      location
    } = req.body;

    // Get farmer ID from authenticated user
    const farmerId = req.user.id;

    // Format location for database
    const locationPoint = formatLocationForDB(location.lat, location.lng);

    const product = await Product.create({
      name,
      category,
      description,
      quantity,
      unit,
      price,
      harvestDate,
      expiryDate,
      location: locationPoint,
      farmerId,
      status: 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list product',
      error: error.message
    });
  }
};

// Get all products (with filters)
exports.getProducts = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 50, // Default radius in km
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'distance',
      farmerId
    } = req.query;

    let whereClause = {
      status: 'available'
    };

    // Apply category filter
    if (category) {
      whereClause.category = category;
    }

    // Apply price filters
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = minPrice;
      if (maxPrice) whereClause.price[Op.lte] = maxPrice;
    }

    // Apply search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by farmer ID
    if (farmerId) {
      whereClause.farmerId = farmerId;
    }

    // Get products with farmer details
    let products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'farmer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'location', 'verified', 'profileImage']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // If location provided, calculate distances and filter by radius
    if (lat && lng) {
      products = products.map(product => {
        const productData = product.toJSON();
        
        // Calculate distance if product has location
        if (product.location && product.location.coordinates) {
          const [productLng, productLat] = product.location.coordinates;
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            productLat,
            productLng
          );
          productData.distance = distance;
        }
        
        return productData;
      });

      // Filter by radius
      products = products.filter(p => !p.distance || p.distance <= radius);

      // Sort by distance if requested
      if (sortBy === 'distance') {
        products.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }
    }

    // Sort by price if requested
    if (sortBy === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    }

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: User,
          as: 'farmer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'location', 'verified', 'profileImage']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns this product
    if (product.farmerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Update location if provided
    if (updates.location) {
      updates.location = formatLocationForDB(updates.location.lat, updates.location.lng);
    }

    await product.update(updates);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns this product
    if (product.farmerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};