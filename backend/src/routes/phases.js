// backend/src/routes/phases.js - Complete Implementation
const express = require('express');
const Joi = require('joi');
const Database = require('../models/Database');

const router = express.Router();

// Validation schemas
const phaseSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).allow('').optional(),
  start_month: Joi.number().integer().min(1).max(12).optional(),
  end_month: Joi.number().integer().min(1).max(12).optional(),
  order_index: Joi.number().integer().min(0).required(),
  color: Joi.string().trim().optional(),
  icon: Joi.string().trim().optional()
});

const updatePhaseSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(1000).allow('').optional(),
  start_month: Joi.number().integer().min(1).max(12).optional(),
  end_month: Joi.number().integer().min(1).max(12).optional(),
  order_index: Joi.number().integer().min(0).optional(),
  color: Joi.string().trim().optional(),
  icon: Joi.string().trim().optional(),
  completed: Joi.boolean().optional()
}).min(1);

const taskSchema = Joi.object({
  description: Joi.string().trim().min(1).max(500).required(),
  order_index: Joi.number().integer().min(0).required(),
  notes: Joi.string().trim().max(1000).allow('').optional()
});

// GET /api/phases - Get all phases with their tasks
router.get('/', async (req, res) => {
  try {
    const phases = await Database.all(`
      SELECT * FROM phases 
      ORDER BY order_index, created_at
    `);

    // Get tasks for each phase
    for (const phase of phases) {
      const tasks = await Database.all(`
        SELECT * FROM phase_tasks 
        WHERE phase_id = ? 
        ORDER BY order_index, created_at
      `, [phase.id]);
      phase.tasks = tasks;
    }

    res.json({
      success: true,
      data: phases,
      total: phases.length
    });
  } catch (error) {
    console.error('Error fetching phases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch phases'
    });
  }
});

// GET /api/phases/:id - Get specific phase with tasks
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const phase = await Database.get('SELECT * FROM phases WHERE id = ?', [id]);

    if (!phase) {
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    // Get tasks for this phase
    const tasks = await Database.all(`
      SELECT * FROM phase_tasks 
      WHERE phase_id = ? 
      ORDER BY order_index, created_at
    `, [id]);
    
    phase.tasks = tasks;

    res.json({
      success: true,
      data: phase
    });
  } catch (error) {
    console.error('Error fetching phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch phase'
    });
  }
});

// POST /api/phases - Create new phase
router.post('/', async (req, res) => {
  try {
    const { error, value } = phaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const result = await Database.run(
      `INSERT INTO phases (title, description, start_month, end_month, order_index, color, icon) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [value.title, value.description, value.start_month, 
       value.end_month, value.order_index, value.color, value.icon]
    );

    const newPhase = await Database.get(
      'SELECT * FROM phases WHERE id = ?',
      [result.id]
    );

    // Initialize with empty tasks array
    newPhase.tasks = [];

    res.status(201).json({
      success: true,
      data: newPhase,
      message: 'Phase created successfully'
    });
  } catch (error) {
    console.error('Error creating phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create phase'
    });
  }
});

// PUT /api/phases/:id - Update phase
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePhaseSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if phase exists
    const existing = await Database.get('SELECT * FROM phases WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    Object.keys(value).forEach(key => {
      updates.push(`${key} = ?`);
      values.push(value[key]);
    });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await Database.run(
      `UPDATE phases SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedPhase = await Database.get(
      'SELECT * FROM phases WHERE id = ?',
      [id]
    );

    // Get tasks for this phase
    const tasks = await Database.all(`
      SELECT * FROM phase_tasks 
      WHERE phase_id = ? 
      ORDER BY order_index, created_at
    `, [id]);
    
    updatedPhase.tasks = tasks;

    res.json({
      success: true,
      data: updatedPhase,
      message: 'Phase updated successfully'
    });
  } catch (error) {
    console.error('Error updating phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update phase'
    });
  }
});

// DELETE /api/phases/:id - Delete phase and its tasks
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Database.get('SELECT * FROM phases WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    // Delete phase (tasks will be deleted by foreign key cascade)
    await Database.run('DELETE FROM phases WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Phase and all associated tasks deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete phase'
    });
  }
});

// POST /api/phases/:id/tasks - Add task to phase
router.post('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = taskSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if phase exists
    const phase = await Database.get('SELECT * FROM phases WHERE id = ?', [id]);
    if (!phase) {
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    const result = await Database.run(
      `INSERT INTO phase_tasks (phase_id, description, order_index, notes) 
       VALUES (?, ?, ?, ?)`,
      [id, value.description, value.order_index, value.notes]
    );

    const newTask = await Database.get(
      'SELECT * FROM phase_tasks WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      data: newTask,
      message: 'Task added to phase successfully'
    });
  } catch (error) {
    console.error('Error adding task to phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add task to phase'
    });
  }
});

// PUT /api/phases/:phaseId/tasks/:taskId - Update task
router.put('/:phaseId/tasks/:taskId', async (req, res) => {
  try {
    const { phaseId, taskId } = req.params;
    const { error, value } = Joi.object({
      description: Joi.string().trim().min(1).max(500).optional(),
      completed: Joi.boolean().optional(),
      order_index: Joi.number().integer().min(0).optional(),
      notes: Joi.string().trim().max(1000).allow('').optional()
    }).min(1).validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if task exists and belongs to the phase
    const existing = await Database.get(
      'SELECT * FROM phase_tasks WHERE id = ? AND phase_id = ?', 
      [taskId, phaseId]
    );
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found in this phase'
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    Object.keys(value).forEach(key => {
      updates.push(`${key} = ?`);
      values.push(value[key]);
    });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(taskId);

    await Database.run(
      `UPDATE phase_tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedTask = await Database.get(
      'SELECT * FROM phase_tasks WHERE id = ?',
      [taskId]
    );

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
});

// DELETE /api/phases/:phaseId/tasks/:taskId - Delete task
router.delete('/:phaseId/tasks/:taskId', async (req, res) => {
  try {
    const { phaseId, taskId } = req.params;

    const existing = await Database.get(
      'SELECT * FROM phase_tasks WHERE id = ? AND phase_id = ?', 
      [taskId, phaseId]
    );
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found in this phase'
      });
    }

    await Database.run('DELETE FROM phase_tasks WHERE id = ?', [taskId]);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
});

// POST /api/phases/reorder - Reorder phases
router.post('/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({
        success: false,
        error: 'orderedIds array is required'
      });
    }

    // Update order_index based on array position
    for (let i = 0; i < orderedIds.length; i++) {
      await Database.run(
        'UPDATE phases SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [i, orderedIds[i]]
      );
    }

    res.json({
      success: true,
      message: 'Phases reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering phases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder phases'
    });
  }
});

module.exports = router;

