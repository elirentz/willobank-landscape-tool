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

      // Plants table
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
      'CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_requirements(requirement_type)'
    ];

    for (const indexSQL of indexes) {
      await this.run(indexSQL);
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

