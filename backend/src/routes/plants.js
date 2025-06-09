// backend/src/routes/plants.js - Complete Implementation
const express = require('express');
const Joi = require('joi');
const Database = require('../models/Database');

const router = express.Router();

// Validation schemas
const plantSchema = Joi.object({
  common_name: Joi.string().trim().min(1).max(200).required(),
  scientific_name: Joi.string().trim().max(200).optional(),
  category: Joi.string().valid('privacy', 'pollinators', 'vegetables', 'wildlife', 'trees', 'groundcover').required(),
  water_needs: Joi.string().valid('low', 'moderate', 'high').optional(),
  sun_requirements: Joi.string().valid('full-sun', 'partial-sun', 'shade').optional(),
  mature_size: Joi.string().trim().max(100).optional(),
  bloom_time: Joi.string().trim().max(100).optional(),
  native: Joi.boolean().default(false),
  drought_tolerant: Joi.boolean().default(false),
  wildlife_value: Joi.string().trim().max(500).optional(),
  notes: Joi.string().trim().max(1000).optional(),
  recommended: Joi.boolean().default(false)
});

const updatePlantSchema = Joi.object({
  common_name: Joi.string().trim().min(1).max(200).optional(),
  scientific_name: Joi.string().trim().max(200).optional(),
  category: Joi.string().valid('privacy', 'pollinators', 'vegetables', 'wildlife', 'trees', 'groundcover').optional(),
  water_needs: Joi.string().valid('low', 'moderate', 'high').optional(),
  sun_requirements: Joi.string().valid('full-sun', 'partial-sun', 'shade').optional(),
  mature_size: Joi.string().trim().max(100).optional(),
  bloom_time: Joi.string().trim().max(100).optional(),
  native: Joi.boolean().optional(),
  drought_tolerant: Joi.boolean().optional(),
  wildlife_value: Joi.string().trim().max(500).optional(),
  notes: Joi.string().trim().max(1000).optional(),
  recommended: Joi.boolean().optional()
}).min(1);

// GET /api/plants - Get all plants with filtering
router.get('/', async (req, res) => {
  try {
    const { category, water_needs, sun_requirements, native, drought_tolerant, recommended, search } = req.query;
    
    let sql = 'SELECT * FROM plants WHERE 1=1';
    const params = [];

    // Add filters
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (water_needs) {
      sql += ' AND water_needs = ?';
      params.push(water_needs);
    }
    
    if (sun_requirements) {
      sql += ' AND sun_requirements = ?';
      params.push(sun_requirements);
    }
    
    if (native !== undefined) {
      sql += ' AND native = ?';
      params.push(native === 'true' ? 1 : 0);
    }
    
    if (drought_tolerant !== undefined) {
      sql += ' AND drought_tolerant = ?';
      params.push(drought_tolerant === 'true' ? 1 : 0);
    }
    
    if (recommended !== undefined) {
      sql += ' AND recommended = ?';
      params.push(recommended === 'true' ? 1 : 0);
    }
    
    if (search) {
      sql += ' AND (common_name LIKE ? OR scientific_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY category, common_name';

    const plants = await Database.all(sql, params);
    
    // Group by category for frontend convenience
    const grouped = {
      privacy: plants.filter(p => p.category === 'privacy'),
      pollinators: plants.filter(p => p.category === 'pollinators'),
      vegetables: plants.filter(p => p.category === 'vegetables'),
      wildlife: plants.filter(p => p.category === 'wildlife'),
      trees: plants.filter(p => p.category === 'trees'),
      groundcover: plants.filter(p => p.category === 'groundcover')
    };

    res.json({
      success: true,
      data: grouped,
      total: plants.length,
      filters: {
        categories: ['privacy', 'pollinators', 'vegetables', 'wildlife', 'trees', 'groundcover'],
        water_needs: ['low', 'moderate', 'high'],
        sun_requirements: ['full-sun', 'partial-sun', 'shade']
      }
    });
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plants'
    });
  }
});

// GET /api/plants/recommended - Get UC Davis recommended plants
router.get('/recommended', async (req, res) => {
  try {
    const plants = await Database.all(`
      SELECT * FROM plants 
      WHERE recommended = 1 
      ORDER BY category, common_name
    `);

    res.json({
      success: true,
      data: plants,
      total: plants.length
    });
  } catch (error) {
    console.error('Error fetching recommended plants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommended plants'
    });
  }
});

// GET /api/plants/native - Get California native plants
router.get('/native', async (req, res) => {
  try {
    const plants = await Database.all(`
      SELECT * FROM plants 
      WHERE native = 1 
      ORDER BY category, common_name
    `);

    res.json({
      success: true,
      data: plants,
      total: plants.length
    });
  } catch (error) {
    console.error('Error fetching native plants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch native plants'
    });
  }
});

// GET /api/plants/:id - Get specific plant
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plant = await Database.get('SELECT * FROM plants WHERE id = ?', [id]);

    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found'
      });
    }

    res.json({
      success: true,
      data: plant
    });
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant'
    });
  }
});

// POST /api/plants - Create new plant
router.post('/', async (req, res) => {
  try {
    const { error, value } = plantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const result = await Database.run(
      `INSERT INTO plants (
        common_name, scientific_name, category, water_needs, sun_requirements,
        mature_size, bloom_time, native, drought_tolerant, wildlife_value, notes, recommended
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        value.common_name, value.scientific_name, value.category, value.water_needs,
        value.sun_requirements, value.mature_size, value.bloom_time, value.native,
        value.drought_tolerant, value.wildlife_value, value.notes, value.recommended
      ]
    );

    const newPlant = await Database.get(
      'SELECT * FROM plants WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      data: newPlant,
      message: 'Plant created successfully'
    });
  } catch (error) {
    console.error('Error creating plant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create plant'
    });
  }
});

// PUT /api/plants/:id - Update plant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePlantSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if plant exists
    const existing = await Database.get('SELECT * FROM plants WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found'
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
      `UPDATE plants SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedPlant = await Database.get(
      'SELECT * FROM plants WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedPlant,
      message: 'Plant updated successfully'
    });
  } catch (error) {
    console.error('Error updating plant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update plant'
    });
  }
});

// DELETE /api/plants/:id - Delete plant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Database.get('SELECT * FROM plants WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found'
      });
    }

    await Database.run('DELETE FROM plants WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Plant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plant'
    });
  }
});

// POST /api/plants/seed - Seed database with UC Davis recommended plants
router.post('/seed', async (req, res) => {
  try {
    // Check if plants already exist
    const count = await Database.get('SELECT COUNT(*) as count FROM plants');
    if (count.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Plants database already contains data. Use /api/plants/seed/force to override.'
      });
    }

    await seedPlantsDatabase();

    const newCount = await Database.get('SELECT COUNT(*) as count FROM plants');
    
    res.json({
      success: true,
      message: `Successfully seeded ${newCount.count} plants`,
      data: { plantsAdded: newCount.count }
    });
  } catch (error) {
    console.error('Error seeding plants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed plants database'
    });
  }
});

// POST /api/plants/seed/force - Force reseed (clears existing data)
router.post('/seed/force', async (req, res) => {
  try {
    // Clear existing plants
    await Database.run('DELETE FROM plants');
    
    await seedPlantsDatabase();

    const count = await Database.get('SELECT COUNT(*) as count FROM plants');
    
    res.json({
      success: true,
      message: `Successfully reseeded ${count.count} plants`,
      data: { plantsAdded: count.count }
    });
  } catch (error) {
    console.error('Error reseeding plants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reseed plants database'
    });
  }
});

// Helper function to seed plants database
async function seedPlantsDatabase() {
  const defaultPlants = [
    // Privacy/Screening Plants
    {
      common_name: "Ceanothus 'Ray Hartman'",
      scientific_name: "Ceanothus 'Ray Hartman'",
      category: 'privacy',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '12-20 feet tall, 12-20 feet wide',
      bloom_time: 'March-May',
      native: true,
      drought_tolerant: true,
      wildlife_value: 'Excellent for bees and butterflies',
      recommended: true,
      notes: 'Fast-growing native shrub, excellent for screening'
    },
    {
      common_name: 'Toyon',
      scientific_name: 'Heteromeles arbutifolia',
      category: 'privacy',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '8-15 feet tall, 8-10 feet wide',
      bloom_time: 'June-July',
      native: true,
      drought_tolerant: true,
      wildlife_value: 'Berries attract birds, flowers attract bees',
      recommended: true,
      notes: 'California native with red berries in winter'
    },
    
    // Pollinator Plants
    {
      common_name: 'Spanish Lavender',
      scientific_name: 'Lavandula stoechas',
      category: 'pollinators',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '2-3 feet tall, 2-3 feet wide',
      bloom_time: 'Spring through fall',
      native: false,
      drought_tolerant: true,
      wildlife_value: 'Excellent for bees and butterflies',
      recommended: true,
      notes: 'Continuous bloomer, fragrant foliage'
    },
    {
      common_name: 'California Poppy',
      scientific_name: 'Eschscholzia californica',
      category: 'pollinators',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '12-18 inches tall, 12 inches wide',
      bloom_time: 'Spring through fall',
      native: true,
      drought_tolerant: true,
      wildlife_value: 'Attracts beneficial insects',
      recommended: true,
      notes: 'State flower, self-seeding annual'
    },
    {
      common_name: "Salvia 'May Night'",
      scientific_name: "Salvia nemorosa 'May Night'",
      category: 'pollinators',
      water_needs: 'moderate',
      sun_requirements: 'full-sun',
      mature_size: '18-24 inches tall, 12-18 inches wide',
      bloom_time: 'May through September',
      native: false,
      drought_tolerant: true,
      wildlife_value: 'Attracts bees, butterflies, and hummingbirds',
      recommended: true,
      notes: 'Perennial with purple flower spikes'
    },
    
    // Trees
    {
      common_name: 'Coast Live Oak',
      scientific_name: 'Quercus agrifolia',
      category: 'trees',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '20-70 feet tall, 25-90 feet wide',
      bloom_time: 'Spring (catkins)',
      native: true,
      drought_tolerant: true,
      wildlife_value: 'Supports hundreds of insect species, acorns feed wildlife',
      recommended: true,
      notes: 'Iconic California oak, check setback requirements'
    },
    {
      common_name: 'Western Redbud',
      scientific_name: 'Cercis occidentalis',
      category: 'trees',
      water_needs: 'low',
      sun_requirements: 'partial-sun',
      mature_size: '10-18 feet tall, 10-15 feet wide',
      bloom_time: 'March-April',
      native: true,
      drought_tolerant: true,
      wildlife_value: 'Early nectar source, seeds eaten by birds',
      recommended: true,
      notes: 'Beautiful spring flowers before leaves emerge'
    },
    
    // Vegetables/Herbs
    {
      common_name: 'Rosemary',
      scientific_name: 'Rosmarinus officinalis',
      category: 'vegetables',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '2-6 feet tall, 2-4 feet wide',
      bloom_time: 'Winter through spring',
      native: false,
      drought_tolerant: true,
      wildlife_value: 'Flowers attract bees',
      recommended: true,
      notes: 'Culinary herb, evergreen shrub'
    },
    {
      common_name: 'Mediterranean Sage',
      scientific_name: 'Salvia officinalis',
      category: 'vegetables',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '12-24 inches tall, 18-24 inches wide',
      bloom_time: 'Summer',
      native: false,
      drought_tolerant: true,
      wildlife_value: 'Flowers attract pollinators',
      recommended: true,
      notes: 'Culinary herb, silvery foliage'
    },
    
    // Wildlife Plants
    {
      common_name: 'Coyote Brush',
      scientific_name: 'Baccharis pilularis',
      category: 'wildlife',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '3-8 feet tall, 6-12 feet wide',
      bloom_time: 'Fall',
      native: true,
      drought_tolerant: true,
      wildlife_value: 'Important late-season nectar source, nesting habitat',
      recommended: true,
      notes: 'Hardy native shrub, excellent wildlife plant'
    },
    
    // Groundcover
    {
      common_name: 'Ceanothus Groundcover',
      scientific_name: 'Ceanothus griseus horizontalis',
      category: 'groundcover',
      water_needs: 'low',
      sun_requirements: 'full-sun',
      mature_size: '2-3 feet tall, 6-15 feet wide',
      bloom_time: 'March-May',
      native: true,
      drought_tolerant: true,
      wildlife_value: 'Excellent for pollinators',
      recommended: true,
      notes: 'Fast-spreading groundcover with blue flowers'
    }
  ];

  for (const plant of defaultPlants) {
    await Database.run(
      `INSERT INTO plants (
        common_name, scientific_name, category, water_needs, sun_requirements,
        mature_size, bloom_time, native, drought_tolerant, wildlife_value, notes, recommended
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plant.common_name, plant.scientific_name, plant.category, plant.water_needs,
        plant.sun_requirements, plant.mature_size, plant.bloom_time, plant.native,
        plant.drought_tolerant, plant.wildlife_value, plant.notes, plant.recommended
      ]
    );
  }
}

module.exports = router;

