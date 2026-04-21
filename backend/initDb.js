const bcrypt = require('bcryptjs');
const { initDatabase, dbAsync } = require('./database');

const createAdmin = async () => {
  try {
    // Initialize database tables
    await initDatabase();
    
    // Check if admin already exists
    const existingAdmin = await dbAsync.get('SELECT * FROM users WHERE email = ?', ['kareemeltemsah7@gmail.com']);
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: kareemeltemsah7@gmail.com');
      console.log('Password: temsah1');
      console.log('Role: admin');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('temsah1', salt);

    // Insert admin user
    const result = await dbAsync.run(
      `INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)`,
      ['Kareem Eltemsah', 'kareemeltemsah7@gmail.com', hashedPassword, '+201000000000', 'admin']
    );

    console.log('✅ Admin user created successfully!');
    console.log('ID:', result.id);
    console.log('Email: kareemeltemsah7@gmail.com');
    console.log('Password: temsah1');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
