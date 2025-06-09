// Enhanced plants.js API with image and detail support
const express = require('express');
const Joi = require('joi');
const Database = require('../models/Database');

const router = express.Router();

// Enhanced validation schemas
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
  recommended: Joi.boolean().default(false),
  // New fields
  image_url: Joi.string().uri().optional(),
  water_description: Joi.string().trim().max(300).optional(),
  sun_description: Joi.string().trim().max(300).optional(),
  care_instructions: Joi.string().trim().max(800).optional(),
  hardiness_zone: Joi.string().trim().max(20).optional(),
  bloom_color: Joi.string().trim().max(100).optional(),
  foliage_type: Joi.string().valid('deciduous', 'evergreen', 'semi-evergreen').optional()
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
  recommended: Joi.boolean().optional(),
  // New fields
  image_url: Joi.string().uri().optional(),
  water_description: Joi.string().trim().max(300).optional(),
  sun_description: Joi.string().trim().max(300).optional(),
  care_instructions: Joi.string().trim().max(800).optional(),
  hardiness_zone: Joi.string().trim().max(20).optional(),
  bloom_color: Joi.string().trim().max(100).optional(),
  foliage_type: Joi.string().valid('deciduous', 'evergreen', 'semi-evergreen').optional()
}).min(1);

// GET /api/plants - Get all plants with enhanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category, water_needs, sun_requirements, native, drought_tolerant, 
      recommended, search, foliage_type, bloom_color 
    } = req.query;
    
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
    
    if (foliage_type) {
      sql += ' AND foliage_type = ?';
      params.push(foliage_type);
    }
    
    if (bloom_color) {
      sql += ' AND bloom_color LIKE ?';
      params.push(`%${bloom_color}%`);
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
      sql += ' AND (common_name LIKE ? OR scientific_name LIKE ? OR notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
        sun_requirements: ['full-sun', 'partial-sun', 'shade'],
        foliage_types: ['deciduous', 'evergreen', 'semi-evergreen']
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

// POST /api/plants - Create new plant with enhanced fields
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
        mature_size, bloom_time, native, drought_tolerant, wildlife_value, 
        notes, recommended, image_url, water_description, sun_description,
        care_instructions, hardiness_zone, bloom_color, foliage_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        value.common_name, value.scientific_name, value.category, value.water_needs,
        value.sun_requirements, value.mature_size, value.bloom_time, value.native,
        value.drought_tolerant, value.wildlife_value, value.notes, value.recommended,
        value.image_url, value.water_description, value.sun_description,
        value.care_instructions, value.hardiness_zone, value.bloom_color, value.foliage_type
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

// PUT /api/plants/:id - Update plant with enhanced fields
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

// Enhanced seeding with images and details
async function seedPlantsDatabase() {
  const defaultPlants = [
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
      notes: 'Fast-growing native shrub, excellent for screening',
      image_url: 'https://images.unsplash.com/photo-1574684891174-df3bbe57e3c7?w=400',
      water_description: 'Drought tolerant once established. Water deeply during first year, then minimal irrigation needed.',
      sun_description: 'Requires full sun (6+ hours daily) for best flowering and growth.',
      care_instructions: 'Prune after flowering to maintain shape. Avoid summer water near trunk.',
      hardiness_zone: '8-10',
      bloom_color: 'Blue to purple',
      foliage_type: 'evergreen'
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
      notes: 'California native with red berries in winter',
      image_url: 'https://images.unsplash.com/photo-1595147389795-37094173bfd8?w=400',
      water_description: 'Very drought tolerant. Water occasionally in first year, then only during extreme drought.',
      sun_description: 'Prefers full sun but tolerates partial shade in hot climates.',
      care_instructions: 'Minimal pruning needed. Remove dead wood in late winter.',
      hardiness_zone: '8-10',
      bloom_color: 'White',
      foliage_type: 'evergreen'
    },
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
      notes: 'Continuous bloomer, fragrant foliage',
      image_url: 'https://images.unsplash.com/photo-1611909023032-2d67c2fe7b53?w=400',
      water_description: 'Low water needs. Allow soil to dry between waterings. Overwatering causes root rot.',
      sun_description: 'Requires full sun (6+ hours) for best flowering and oil production.',
      care_instructions: 'Prune lightly after each flush of blooms. Cut back by 1/3 in late winter.',
      hardiness_zone: '7-9',
      bloom_color: 'Purple with distinctive "rabbit ears"',
      foliage_type: 'evergreen'
    }
    // Add more plants as needed...
  ];

  for (const plant of defaultPlants) {
    await Database.run(
      `INSERT INTO plants (
        common_name, scientific_name, category, water_needs, sun_requirements,
        mature_size, bloom_time, native, drought_tolerant, wildlife_value, 
        notes, recommended, image_url, water_description, sun_description,
        care_instructions, hardiness_zone, bloom_color, foliage_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plant.common_name, plant.scientific_name, plant.category, plant.water_needs,
        plant.sun_requirements, plant.mature_size, plant.bloom_time, plant.native,
        plant.drought_tolerant, plant.wildlife_value, plant.notes, plant.recommended,
        plant.image_url, plant.water_description, plant.sun_description,
        plant.care_instructions, plant.hardiness_zone, plant.bloom_color, plant.foliage_type
      ]
    );
  }
}

// Keep existing routes...
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

// POST /api/plants/seed/force - Enhanced seeding
router.post('/seed/force', async (req, res) => {
  try {
    await Database.run('DELETE FROM plants');
    await seedPlantsDatabase();

    const count = await Database.get('SELECT COUNT(*) as count FROM plants');
    
    res.json({
      success: true,
      message: `Successfully reseeded ${count.count} plants with enhanced data`,
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

module.exports = router;

