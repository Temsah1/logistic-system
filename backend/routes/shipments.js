const express = require('express');
const { body, validationResult } = require('express-validator');
const Shipment = require('../models/Shipment');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all shipments (admin gets all, user gets only their shipments)
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // If user is not admin, only show their shipments
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    const shipments = await Shipment.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Shipment.countDocuments(query);
    
    res.json({
      shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ message: 'Server error while fetching shipments' });
  }
});

// Get single shipment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate('userId', 'name email phone');
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    // Check if user is admin or the shipment owner
    if (req.user.role !== 'admin' && shipment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(shipment);
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ message: 'Server error while fetching shipment' });
  }
});

// Create new shipment
router.post('/', auth, [
  body('origin.address').notEmpty().withMessage('Origin address is required'),
  body('origin.city').notEmpty().withMessage('Origin city is required'),
  body('origin.postalCode').notEmpty().withMessage('Origin postal code is required'),
  body('destination.address').notEmpty().withMessage('Destination address is required'),
  body('destination.city').notEmpty().withMessage('Destination city is required'),
  body('destination.postalCode').notEmpty().withMessage('Destination postal code is required'),
  body('recipient.name').notEmpty().withMessage('Recipient name is required'),
  body('recipient.phone').notEmpty().withMessage('Recipient phone is required'),
  body('package.weight').isFloat({ min: 0.1 }).withMessage('Weight must be at least 0.1 kg'),
  body('package.dimensions.length').isFloat({ min: 1 }).withMessage('Length must be at least 1 cm'),
  body('package.dimensions.width').isFloat({ min: 1 }).withMessage('Width must be at least 1 cm'),
  body('package.dimensions.height').isFloat({ min: 1 }).withMessage('Height must be at least 1 cm'),
  body('package.description').notEmpty().withMessage('Package description is required'),
  body('estimatedDelivery').isISO8601().withMessage('Valid estimated delivery date is required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shipmentData = {
      ...req.body,
      userId: req.user._id,
      estimatedDelivery: new Date(req.body.estimatedDelivery)
    };

    const shipment = new Shipment(shipmentData);
    await shipment.save();

    const populatedShipment = await Shipment.findById(shipment._id).populate('userId', 'name email phone');

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment: populatedShipment
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ message: 'Server error while creating shipment' });
  }
});

// Update shipment (admin only or user updating their own shipment with limited fields)
router.put('/:id', auth, [
  body('status').optional().isIn(['Pending', 'Picked Up', 'In Transit', 'Delivered']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shipment = await Shipment.findById(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isOwner = shipment.userId.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Users can only update notes, admins can update everything
    const allowedUpdates = isAdmin ? ['status', 'notes'] : ['notes'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedShipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    res.json({
      message: 'Shipment updated successfully',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ message: 'Server error while updating shipment' });
  }
});

// Delete shipment (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    await Shipment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ message: 'Server error while deleting shipment' });
  }
});

// Track shipment by tracking number (public endpoint)
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ 
      trackingNumber: req.params.trackingNumber.toUpperCase() 
    }).populate('userId', 'name');

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Return limited information for public tracking
    const publicInfo = {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      recipient: {
        name: shipment.recipient.name
      },
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt
    };

    res.json(publicInfo);
  } catch (error) {
    console.error('Track shipment error:', error);
    res.status(500).json({ message: 'Server error while tracking shipment' });
  }
});

module.exports = router;
