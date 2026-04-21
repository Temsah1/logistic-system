const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { dbAsync } = require('../database');
const { auth, adminAuth } = require('../middleware/auth-sqlite');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const conditions = [];
    
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    
    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      const whereClause = ' AND ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    const users = await dbAsync.all(sql, [...params, parseInt(limit), parseInt(offset)]);
    const countResult = await dbAsync.get(countSql, params);
    
    // Get shipment count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const shipmentCount = await dbAsync.get(
          'SELECT COUNT(*) as count FROM shipments WHERE user_id = ?',
          [user.id]
        );
        return {
          ...user,
          shipmentCount: shipmentCount.count
        };
      })
    );
    
    res.json({
      users: usersWithStats,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get single user by ID (admin only)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await dbAsync.get(
      'SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's shipments
    const shipments = await dbAsync.all(
      `SELECT id, tracking_number, status, origin_city, destination_city, 
              cost, created_at, updated_at 
       FROM shipments WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    
    res.json({
      user: {
        ...user,
        shipments: shipments.map(s => ({
          id: s.id,
          trackingNumber: s.tracking_number,
          status: s.status,
          origin: { city: s.origin_city },
          destination: { city: s.destination_city },
          cost: s.cost,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }))
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user (admin only) - can change role, status, name, phone
router.put('/:id', [
  auth,
  adminAuth,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().trim(),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, role, isActive } = req.body;
    const userId = req.params.id;
    
    // Check if user exists
    const user = await dbAsync.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from demoting themselves
    if (parseInt(userId) === req.userId && role && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot demote yourself from admin' });
    }
    
    // Build update fields
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updates.push('updated_at = datetime(\'now\')');
    params.push(userId);
    
    await dbAsync.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    const updatedUser = await dbAsync.get(
      'SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const user = await dbAsync.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user's shipments first (or reassign them)
    await dbAsync.run('DELETE FROM shipments WHERE user_id = ?', [userId]);
    
    // Delete user
    await dbAsync.run('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'User and associated shipments deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Toggle user active status (admin only)
router.patch('/:id/toggle-status', auth, adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deactivating themselves
    if (parseInt(userId) === req.userId) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }
    
    const user = await dbAsync.get('SELECT is_active FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const newStatus = !user.is_active;
    
    await dbAsync.run(
      'UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [newStatus ? 1 : 0, userId]
    );
    
    res.json({
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: newStatus
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

// Promote/Demote user (admin only)
router.patch('/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be user or admin' });
    }
    
    // Prevent admin from demoting themselves
    if (parseInt(userId) === req.userId && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot demote yourself from admin' });
    }
    
    const user = await dbAsync.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await dbAsync.run(
      'UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [role, userId]
    );
    
    res.json({
      message: `User role changed to ${role} successfully`,
      role
    });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ message: 'Failed to change user role' });
  }
});

module.exports = router;
