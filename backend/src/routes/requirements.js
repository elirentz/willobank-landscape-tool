const express = require('express');
const Joi = require('joi');
const Database = require('../models/Database');

const router = express.Router();

// Validation schemas
const requirementSchema = Joi.object({
  category: Joi.string().valid('needs', 'wants', 'nice-to-haves').required(),
  description: Joi.string().trim().min(1).max(500).required(),
  priority: Joi.number().integer().min(0).default(0),
  notes: Joi.string().trim().max(1000).allow('').optional()
});

const updateRequirementSchema = Joi.object({
  category: Joi.string().valid('needs', 'wants', 'nice-to-haves').optional(),
  description: Joi.string().trim().min(1).max(500).optional(),
  priority: Joi.number().integer().min(0).optional(),
  completed: Joi.boolean().optional(),
  notes: Joi.string().trim().max(1000).allow('').optional()
});

// GET /api/requirements - Get all requirements
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    let sql = 'SELECT * FROM requirements';
    let params = [];

    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }

    sql += ' ORDER BY category, priority, created_at';

    const requirements = await Database.all(sql, params);
    
    // Group by category for frontend convenience
    const grouped = {
      needs: requirements.filter(r => r.category === 'needs'),
      wants: requirements.filter(r => r.category === 'wants'),
      'nice-to-haves': requirements.filter(r => r.category === 'nice-to-haves')
    };

    res.json({
      success: true,
      data: grouped,
      total: requirements.length
    });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requirements'
    });
  }
});

// GET /api/requirements/:id - Get specific requirement
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = await Database.get('SELECT * FROM requirements WHERE id = ?', [id]);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: 'Requirement not found'
      });
    }

    res.json({
      success: true,
      data: requirement
    });
  } catch (error) {
    console.error('Error fetching requirement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requirement'
    });
  }
});

// POST /api/requirements - Create new requirement
router.post('/', async (req, res) => {
  try {
    const { error, value } = requirementSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const result = await Database.run(
      `INSERT INTO requirements (category, description, priority, notes) 
       VALUES (?, ?, ?, ?)`,
      [value.category, value.description, value.priority, value.notes || null]
    );

    const newRequirement = await Database.get(
      'SELECT * FROM requirements WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      data: newRequirement,
      message: 'Requirement created successfully'
    });
  } catch (error) {
    console.error('Error creating requirement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create requirement'
    });
  }
});

// PUT /api/requirements/:id - Update requirement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateRequirementSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if requirement exists
    const existing = await Database.get('SELECT * FROM requirements WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Requirement not found'
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    Object.keys(value).forEach(key => {
      updates.push(`${key} = ?`);
      values.push(value[key]);
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await Database.run(
      `UPDATE requirements SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedRequirement = await Database.get(
      'SELECT * FROM requirements WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedRequirement,
      message: 'Requirement updated successfully'
    });
  } catch (error) {
    console.error('Error updating requirement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update requirement'
    });
  }
});

// DELETE /api/requirements/:id - Delete requirement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Database.get('SELECT * FROM requirements WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Requirement not found'
      });
    }

    await Database.run('DELETE FROM requirements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Requirement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete requirement'
    });
  }
});

// POST /api/requirements/reorder - Reorder requirements within a category
router.post('/reorder', async (req, res) => {
  try {
    const { category, orderedIds } = req.body;

    if (!category || !Array.isArray(orderedIds)) {
      return res.status(400).json({
        success: false,
        error: 'Category and orderedIds array are required'
      });
    }

    // Update priorities based on order
    for (let i = 0; i < orderedIds.length; i++) {
      await Database.run(
        'UPDATE requirements SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND category = ?',
        [i + 1, orderedIds[i], category]
      );
    }

    res.json({
      success: true,
      message: 'Requirements reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder requirements'
    });
  }
});

module.exports = router;

