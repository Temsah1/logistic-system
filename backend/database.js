const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'logistics.db');

// Configure SQLite for better performance and concurrency
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    // Enable WAL mode for better concurrency
    db.run('PRAGMA journal_mode = WAL', (err) => {
      if (err) console.error('Error enabling WAL mode:', err.message);
      else console.log('WAL mode enabled for better concurrency');
    });
    
    // Optimize SQLite settings
    db.run('PRAGMA synchronous = NORMAL');
    db.run('PRAGMA cache_size = -64000'); // 64MB cache
    db.run('PRAGMA temp_store = MEMORY');
    db.run('PRAGMA mmap_size = 268435456'); // 256MB memory-mapped I/O
  }
});

// Promisify database methods
const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create users table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if is_active column exists, add if not
    try {
      await dbAsync.get('SELECT is_active FROM users LIMIT 1');
    } catch (e) {
      await dbAsync.run('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
      console.log('Added is_active column to users table');
    }

    // Create shipments table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_number TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        origin_address TEXT NOT NULL,
        origin_city TEXT NOT NULL,
        origin_postal_code TEXT,
        origin_country TEXT DEFAULT 'Egypt',
        origin_lat REAL,
        origin_lng REAL,
        destination_address TEXT NOT NULL,
        destination_city TEXT NOT NULL,
        destination_postal_code TEXT,
        destination_country TEXT DEFAULT 'Egypt',
        destination_lat REAL,
        destination_lng REAL,
        recipient_name TEXT NOT NULL,
        recipient_phone TEXT NOT NULL,
        recipient_email TEXT,
        package_weight REAL NOT NULL,
        package_length REAL NOT NULL,
        package_width REAL NOT NULL,
        package_height REAL NOT NULL,
        weight REAL,
        dimensions_length REAL,
        dimensions_width REAL,
        dimensions_height REAL,
        package_type TEXT,
        package_description TEXT,
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled', 'On Hold')),
        estimated_delivery DATETIME NOT NULL,
        picked_up_at DATETIME,
        in_transit_at DATETIME,
        delivered_at DATETIME,
        actual_delivery DATETIME,
        cost REAL NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Add new columns to existing shipments table if they don't exist
    const columns = [
      { name: 'picked_up_at', type: 'DATETIME' },
      { name: 'in_transit_at', type: 'DATETIME' },
      { name: 'delivered_at', type: 'DATETIME' },
      { name: 'weight', type: 'REAL' },
      { name: 'dimensions_length', type: 'REAL' },
      { name: 'dimensions_width', type: 'REAL' },
      { name: 'dimensions_height', type: 'REAL' },
      { name: 'package_type', type: 'TEXT' },
      { name: 'origin_lat', type: 'REAL' },
      { name: 'origin_lng', type: 'REAL' },
      { name: 'destination_lat', type: 'REAL' },
      { name: 'destination_lng', type: 'REAL' }
    ];

    for (const col of columns) {
      try {
        await dbAsync.get(`SELECT ${col.name} FROM shipments LIMIT 1`);
      } catch (e) {
        await dbAsync.run(`ALTER TABLE shipments ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} column to shipments table`);
      }
    }

    // Create indexes for better query performance
    try {
      await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id)');
      await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number)');
      await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)');
      await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at)');
      await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = { db, dbAsync, initDatabase };
