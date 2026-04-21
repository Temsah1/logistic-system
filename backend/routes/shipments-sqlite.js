const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { dbAsync } = require('../database');
const { auth, adminAuth } = require('../middleware/auth-sqlite');

const router = express.Router();

// Generate tracking number
const generateTrackingNumber = () => {
  return 'BST' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Get all shipments (admin gets all, user gets only their shipments)
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT s.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM shipments s
      JOIN users u ON s.user_id = u.id
    `;
    let countSql = 'SELECT COUNT(*) as total FROM shipments s';
    const params = [];
    const conditions = [];
    
    // If user is not admin, only show their shipments
    if (req.userRole !== 'admin') {
      conditions.push('s.user_id = ?');
      params.push(req.userId);
    }
    
    // Filter by status if provided
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    
    const shipments = await dbAsync.all(sql, [...params, parseInt(limit), parseInt(offset)]);
    const countResult = await dbAsync.get(countSql, params);
    
    // Format shipments
    const formattedShipments = shipments.map(s => ({
      id: s.id,
      trackingNumber: s.tracking_number,
      userId: {
        id: s.user_id,
        name: s.user_name,
        email: s.user_email,
        phone: s.user_phone
      },
      origin: {
        address: s.origin_address,
        city: s.origin_city,
        postalCode: s.origin_postal_code,
        country: s.origin_country
      },
      destination: {
        address: s.destination_address,
        city: s.destination_city,
        postalCode: s.destination_postal_code,
        country: s.destination_country
      },
      recipient: {
        name: s.recipient_name,
        phone: s.recipient_phone,
        email: s.recipient_email
      },
      package: {
        weight: s.package_weight,
        dimensions: {
          length: s.package_length,
          width: s.package_width,
          height: s.package_height
        },
        description: s.package_description
      },
      status: s.status,
      estimatedDelivery: s.estimated_delivery,
      actualDelivery: s.actual_delivery,
      cost: s.cost,
      notes: s.notes,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));
    
    res.json({
      shipments: formattedShipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
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
    const sql = `
      SELECT s.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `;
    
    const shipment = await dbAsync.get(sql, [req.params.id]);
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    // Check if user is admin or the shipment owner
    if (req.userRole !== 'admin' && shipment.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      userId: {
        id: shipment.user_id,
        name: shipment.user_name,
        email: shipment.user_email,
        phone: shipment.user_phone
      },
      origin: {
        address: shipment.origin_address,
        city: shipment.origin_city,
        postalCode: shipment.origin_postal_code,
        country: shipment.origin_country
      },
      destination: {
        address: shipment.destination_address,
        city: shipment.destination_city,
        postalCode: shipment.destination_postal_code,
        country: shipment.destination_country
      },
      recipient: {
        name: shipment.recipient_name,
        phone: shipment.recipient_phone,
        email: shipment.recipient_email
      },
      package: {
        weight: shipment.package_weight,
        dimensions: {
          length: shipment.package_length,
          width: shipment.package_width,
          height: shipment.package_height
        },
        description: shipment.package_description
      },
      status: shipment.status,
      estimatedDelivery: shipment.estimated_delivery,
      actualDelivery: shipment.actual_delivery,
      cost: shipment.cost,
      notes: shipment.notes,
      createdAt: shipment.created_at,
      updatedAt: shipment.updated_at
    });
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

    const trackingNumber = generateTrackingNumber();
    const { origin, destination, recipient, package: pkg, estimatedDelivery, cost, notes } = req.body;
    
    const sql = `
      INSERT INTO shipments (
        tracking_number, user_id, origin_address, origin_city, origin_postal_code, origin_country,
        destination_address, destination_city, destination_postal_code, destination_country,
        recipient_name, recipient_phone, recipient_email, package_weight, package_length,
        package_width, package_height, package_description, estimated_delivery, cost, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await dbAsync.run(sql, [
      trackingNumber,
      req.userId,
      origin.address,
      origin.city,
      origin.postalCode,
      origin.country || 'Egypt',
      destination.address,
      destination.city,
      destination.postalCode,
      destination.country || 'Egypt',
      recipient.name,
      recipient.phone,
      recipient.email || null,
      pkg.weight,
      pkg.dimensions.length,
      pkg.dimensions.width,
      pkg.dimensions.height,
      pkg.description,
      estimatedDelivery,
      cost,
      notes || null
    ]);

    // Get the created shipment with user info
    const newShipment = await dbAsync.get(`
      SELECT s.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment: {
        id: newShipment.id,
        trackingNumber: newShipment.tracking_number,
        userId: {
          id: newShipment.user_id,
          name: newShipment.user_name,
          email: newShipment.user_email,
          phone: newShipment.user_phone
        },
        origin: {
          address: newShipment.origin_address,
          city: newShipment.origin_city,
          postalCode: newShipment.origin_postal_code,
          country: newShipment.origin_country
        },
        destination: {
          address: newShipment.destination_address,
          city: newShipment.destination_city,
          postalCode: newShipment.destination_postal_code,
          country: newShipment.destination_country
        },
        recipient: {
          name: newShipment.recipient_name,
          phone: newShipment.recipient_phone,
          email: newShipment.recipient_email
        },
        package: {
          weight: newShipment.package_weight,
          dimensions: {
            length: newShipment.package_length,
            width: newShipment.package_width,
            height: newShipment.package_height
          },
          description: newShipment.package_description
        },
        status: newShipment.status,
        estimatedDelivery: newShipment.estimated_delivery,
        cost: newShipment.cost,
        notes: newShipment.notes,
        createdAt: newShipment.created_at
      }
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ message: 'Server error while creating shipment' });
  }
});

// Update shipment status with tracking timestamps (admin only)
router.patch('/:id/status', auth, adminAuth, [
  body('status').isIn(['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled', 'On Hold']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shipment = await dbAsync.get('SELECT * FROM shipments WHERE id = ?', [req.params.id]);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const { status, notes } = req.body;
    const now = new Date().toISOString();
    
    const updates = ['status = ?'];
    const params = [status];
    
    // Set timestamp based on status
    if (status === 'Picked Up' && !shipment.picked_up_at) {
      updates.push('picked_up_at = ?');
      params.push(now);
    } else if (status === 'In Transit' && !shipment.in_transit_at) {
      updates.push('in_transit_at = ?');
      params.push(now);
    } else if (status === 'Delivered') {
      if (!shipment.delivered_at) {
        updates.push('delivered_at = ?');
        params.push(now);
      }
      updates.push('actual_delivery = ?');
      params.push(now);
    }
    
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const sql = `UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`;
    await dbAsync.run(sql, params);

    // Get updated shipment
    const updatedShipment = await dbAsync.get(`
      SELECT s.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);

    res.json({
      message: `Shipment status updated to ${status}`,
      shipment: {
        id: updatedShipment.id,
        trackingNumber: updatedShipment.tracking_number,
        status: updatedShipment.status,
        notes: updatedShipment.notes,
        pickedUpAt: updatedShipment.picked_up_at,
        inTransitAt: updatedShipment.in_transit_at,
        deliveredAt: updatedShipment.delivered_at,
        actualDelivery: updatedShipment.actual_delivery,
        updatedAt: updatedShipment.updated_at
      }
    });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res.status(500).json({ message: 'Server error while updating shipment status' });
  }
});

// Get shipment progress tracking
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const shipment = await dbAsync.get(`
      SELECT s.*, u.name as user_name
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check permissions
    const isAdmin = req.userRole === 'admin';
    const isOwner = shipment.user_id === req.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build progress timeline
    const timeline = [];
    const statuses = ['Pending', 'Picked Up', 'In Transit', 'Delivered'];
    const statusTimestamps = {
      'Pending': shipment.created_at,
      'Picked Up': shipment.picked_up_at,
      'In Transit': shipment.in_transit_at,
      'Delivered': shipment.delivered_at || shipment.actual_delivery
    };

    statuses.forEach((status, index) => {
      const timestamp = statusTimestamps[status];
      const isCompleted = statuses.indexOf(shipment.status) >= index;
      const isCurrent = shipment.status === status;

      if (timestamp || isCompleted || isCurrent) {
        timeline.push({
          status,
          timestamp,
          completed: isCompleted,
          current: isCurrent
        });
      }
    });

    // Calculate progress percentage
    const currentIndex = statuses.indexOf(shipment.status);
    const progress = Math.round(((currentIndex + 1) / statuses.length) * 100);

    res.json({
      trackingNumber: shipment.tracking_number,
      currentStatus: shipment.status,
      progress,
      estimatedDelivery: shipment.estimated_delivery,
      actualDelivery: shipment.actual_delivery,
      origin: {
        city: shipment.origin_city,
        address: shipment.origin_address
      },
      destination: {
        city: shipment.destination_city,
        address: shipment.destination_address
      },
      timeline,
      lastUpdated: shipment.updated_at
    });
  } catch (error) {
    console.error('Get shipment progress error:', error);
    res.status(500).json({ message: 'Server error while fetching shipment progress' });
  }
});

// Update shipment
router.put('/:id', auth, [
  body('status').optional().isIn(['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled', 'On Hold']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if shipment exists
    const shipment = await dbAsync.get('SELECT * FROM shipments WHERE id = ?', [req.params.id]);
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check permissions
    const isAdmin = req.userRole === 'admin';
    const isOwner = shipment.user_id === req.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Users can only update notes, admins can update everything
    const allowedUpdates = isAdmin ? ['status', 'notes'] : ['notes'];
    const updates = [];
    const params = [];

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'status') {
          updates.push('status = ?');
          params.push(req.body[key]);
          // If status is Delivered, set actual_delivery
          if (req.body[key] === 'Delivered') {
            updates.push('actual_delivery = ?');
            params.push(new Date().toISOString());
          }
        } else if (key === 'notes') {
          updates.push('notes = ?');
          params.push(req.body[key]);
        }
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const sql = `UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`;
    await dbAsync.run(sql, params);

    // Get updated shipment
    const updatedShipment = await dbAsync.get(`
      SELECT s.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);

    res.json({
      message: 'Shipment updated successfully',
      shipment: {
        id: updatedShipment.id,
        trackingNumber: updatedShipment.tracking_number,
        status: updatedShipment.status,
        notes: updatedShipment.notes,
        actualDelivery: updatedShipment.actual_delivery,
        updatedAt: updatedShipment.updated_at
      }
    });
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ message: 'Server error while updating shipment' });
  }
});

// Delete shipment (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const shipment = await dbAsync.get('SELECT * FROM shipments WHERE id = ?', [req.params.id]);
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    await dbAsync.run('DELETE FROM shipments WHERE id = ?', [req.params.id]);

    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ message: 'Server error while deleting shipment' });
  }
});

// Track shipment by tracking number (public endpoint)
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const sql = `
      SELECT s.*, u.name as user_name
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE UPPER(s.tracking_number) = ?
    `;
    
    const shipment = await dbAsync.get(sql, [req.params.trackingNumber.toUpperCase()]);

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Return limited information for public tracking
    res.json({
      trackingNumber: shipment.tracking_number,
      status: shipment.status,
      origin: {
        address: shipment.origin_address,
        city: shipment.origin_city,
        postalCode: shipment.origin_postal_code,
        country: shipment.origin_country
      },
      destination: {
        address: shipment.destination_address,
        city: shipment.destination_city,
        postalCode: shipment.destination_postal_code,
        country: shipment.destination_country
      },
      recipient: {
        name: shipment.recipient_name
      },
      estimatedDelivery: shipment.estimated_delivery,
      actualDelivery: shipment.actual_delivery,
      createdAt: shipment.created_at,
      updatedAt: shipment.updated_at
    });
  } catch (error) {
    console.error('Track shipment error:', error);
    res.status(500).json({ message: 'Server error while tracking shipment' });
  }
});

module.exports = router;
