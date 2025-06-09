const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/willowbank.db');
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log(`Connected to SQLite database at ${this.dbPath}`);
          this.createTables()
            .then(() => this.runMigrations())
            .then(() => this.seedDefaultData())
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Requirements table
      `CREATE TABLE IF NOT EXISTS requirements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL CHECK(category IN ('needs', 'wants', 'nice-to-haves')),
        description TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phases table
      `CREATE TABLE IF NOT EXISTS phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_month INTEGER,
        end_month INTEGER,
        order_index INTEGER NOT NULL,
        color TEXT,
        icon TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase tasks table
      `CREATE TABLE IF NOT EXISTS phase_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phase_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        order_index INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (phase_id) REFERENCES phases (id) ON DELETE CASCADE
      )`,

      // Enhanced Plants table with image and detail support
      `CREATE TABLE IF NOT EXISTS plants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        common_name TEXT NOT NULL,
        scientific_name TEXT,
        category TEXT NOT NULL CHECK(category IN ('privacy', 'pollinators', 'vegetables', 'wildlife', 'trees', 'groundcover')),
        water_needs TEXT CHECK(water_needs IN ('low', 'moderate', 'high')),
        sun_requirements TEXT CHECK(sun_requirements IN ('full-sun', 'partial-sun', 'shade')),
        mature_size TEXT,
        bloom_time TEXT,
        native BOOLEAN DEFAULT FALSE,
        drought_tolerant BOOLEAN DEFAULT FALSE,
        wildlife_value TEXT,
        notes TEXT,
        recommended BOOLEAN DEFAULT FALSE,
        image_url TEXT,
        water_description TEXT,
        sun_description TEXT,
        care_instructions TEXT,
        hardiness_zone TEXT,
        bloom_color TEXT,
        foliage_type TEXT CHECK(foliage_type IN ('deciduous', 'evergreen', 'semi-evergreen')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Compliance requirements table
      `CREATE TABLE IF NOT EXISTS compliance_requirements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        requirement_type TEXT NOT NULL CHECK(requirement_type IN ('setback', 'water', 'fence', 'plant', 'permit')),
        jurisdiction TEXT NOT NULL DEFAULT 'Yolo County',
        code_reference TEXT,
        measurement TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'pending')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Project settings table
      `CREATE TABLE IF NOT EXISTS project_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Database migrations tracking table
      `CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      await this.run(tableSQL);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(category)',
      'CREATE INDEX IF NOT EXISTS idx_phases_order ON phases(order_index)',
      'CREATE INDEX IF NOT EXISTS idx_phase_tasks_phase_id ON phase_tasks(phase_id)',
      'CREATE INDEX IF NOT EXISTS idx_plants_category ON plants(category)',
      'CREATE INDEX IF NOT EXISTS idx_plants_native ON plants(native)',
      'CREATE INDEX IF NOT EXISTS idx_plants_drought_tolerant ON plants(drought_tolerant)',
      'CREATE INDEX IF NOT EXISTS idx_plants_recommended ON plants(recommended)',
      'CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_requirements(requirement_type)'
    ];

    for (const indexSQL of indexes) {
      await this.run(indexSQL);
    }
  }

  async runMigrations() {
    const migrations = [
      {
        name: 'add_plant_image_fields',
        sql: `
          ALTER TABLE plants ADD COLUMN image_url TEXT;
          ALTER TABLE plants ADD COLUMN water_description TEXT;
          ALTER TABLE plants ADD COLUMN sun_description TEXT;
          ALTER TABLE plants ADD COLUMN care_instructions TEXT;
          ALTER TABLE plants ADD COLUMN hardiness_zone TEXT;
          ALTER TABLE plants ADD COLUMN bloom_color TEXT;
          ALTER TABLE plants ADD COLUMN foliage_type TEXT CHECK(foliage_type IN ('deciduous', 'evergreen', 'semi-evergreen'));
        `
      }
    ];

    for (const migration of migrations) {
      try {
        // Check if migration has already been run
        const existing = await this.get(
          'SELECT * FROM migrations WHERE migration_name = ?',
          [migration.name]
        );

        if (!existing) {
          console.log(`Running migration: ${migration.name}`);
          
          // Split SQL commands and run each one
          const commands = migration.sql.split(';').filter(cmd => cmd.trim());
          for (const command of commands) {
            if (command.trim()) {
              try {
                await this.run(command);
              } catch (err) {
                // Ignore "duplicate column" errors as table might already have the column
                if (!err.message.includes('duplicate column')) {
                  throw err;
                }
              }
            }
          }

          // Record migration as completed
          await this.run(
            'INSERT INTO migrations (migration_name) VALUES (?)',
            [migration.name]
          );
          
          console.log(`✅ Migration ${migration.name} completed`);
        }
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error);
        // Don't fail the entire initialization for migration errors
      }
    }
  }

  async seedDefaultData() {
    // Check if data already exists
    const requirementCount = await this.get('SELECT COUNT(*) as count FROM requirements');
    if (requirementCount.count > 0) {
      console.log('Database already contains data, skipping seed');
      return;
    }

    console.log('Seeding default data...');

    // Seed default requirements
    const defaultRequirements = [
      { category: 'needs', description: 'Regulatory compliance (setbacks, MWELO)', priority: 1 },
      { category: 'needs', description: 'Privacy screening along road', priority: 2 },
      { category: 'needs', description: 'Drought-tolerant landscaping', priority: 3 },
      { category: 'needs', description: 'Safe play area for children', priority: 4 },
      { category: 'wants', description: 'Native plants for pollinators', priority: 1 },
      { category: 'wants', description: 'Raised beds for vegetables/herbs/fruits', priority: 2 },
      { category: 'wants', description: 'Wildlife habitat and corridors', priority: 3 },
      { category: 'wants', description: 'Low-maintenance design', priority: 4 },
      { category: 'nice-to-haves', description: 'Outdoor entertaining space', priority: 1 },
      { category: 'nice-to-haves', description: 'Seasonal color displays', priority: 2 },
      { category: 'nice-to-haves', description: 'Rain collection system', priority: 3 },
      { category: 'nice-to-haves', description: 'Composting area', priority: 4 }
    ];

    for (const req of defaultRequirements) {
      await this.run(
        'INSERT INTO requirements (category, description, priority) VALUES (?, ?, ?)',
        [req.category, req.description, req.priority]
      );
    }

    // Seed enhanced plants with images and detailed descriptions
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
        notes: 'State flower, self-seeding annual',
        image_url: 'https://images.unsplash.com/photo-1617450365226-9bf5da3b5e62?w=400',
        water_description: 'Extremely drought tolerant. Often thrives with no supplemental water after establishment.',
        sun_description: 'Requires full sun for best flower production. Flowers close in shade.',
        care_instructions: 'Self-seeding annual. Deadhead for continued blooming or let go to seed.',
        hardiness_zone: '6-10',
        bloom_color: 'Orange (classic), also yellow, pink, red varieties',
        foliage_type: 'deciduous'
      },
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
        notes: 'Iconic California oak, check setback requirements',
        image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
        water_description: 'Deep tap root makes it very drought tolerant. Avoid summer water near trunk.',
        sun_description: 'Requires full sun for proper development and acorn production.',
        care_instructions: 'Minimal pruning. Never top or heavily prune. Remove only dead or dangerous branches.',
        hardiness_zone: '8-10',
        bloom_color: 'Green catkins',
        foliage_type: 'evergreen'
      }
    ];

    for (const plant of defaultPlants) {
      await this.run(
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

    console.log('✅ Default data seeded successfully');
  }

  // Utility methods for database operations
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

// Export singleton instance
module.exports = new Database();

