const { dbAsync } = require('./database');

// Generate tracking number
const generateTrackingNumber = () => {
  return 'BST' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Sample data for realistic shipments
const cities = [
  { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { city: 'Alexandria', country: 'Egypt', lat: 31.2001, lng: 29.9187 },
  { city: 'Giza', country: 'Egypt', lat: 30.0131, lng: 31.2089 },
  { city: 'Sharm El-Sheikh', country: 'Egypt', lat: 27.9158, lng: 34.3299 },
  { city: 'Luxor', country: 'Egypt', lat: 25.6872, lng: 32.6396 },
  { city: 'Aswan', country: 'Egypt', lat: 24.0889, lng: 32.8998 },
  { city: 'Hurghada', country: 'Egypt', lat: 27.2579, lng: 33.8116 },
  { city: 'Port Said', country: 'Egypt', lat: 31.2565, lng: 32.2841 },
  { city: 'Mansoura', country: 'Egypt', lat: 31.0364, lng: 31.3807 },
  { city: 'Tanta', country: 'Egypt', lat: 30.7865, lng: 31.0004 }
];

const statuses = ['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled', 'On Hold'];

const recipientNames = [
  'Ahmed Hassan', 'Mohamed Ali', 'Sara Ahmed', 'Fatima Omar', 'Khaled Ibrahim',
  'Nour El-Din', 'Yasmine Mahmoud', 'Omar Farouk', 'Layla Saeed', 'Amr Diab',
  'Hana Moustafa', 'Karim El-Sayed', 'Dina Fouad', 'Tamer Hosny', 'Mona Zaki'
];

const packageTypes = ['Electronics', 'Clothing', 'Documents', 'Food', 'Medical', 'Fragile', 'Heavy'];

const notesList = [
  'Handle with care - fragile items inside',
  'Urgent delivery required',
  'Customer requested evening delivery',
  'Leave at reception if not available',
  'Call before delivery',
  'Perishable items - expedite',
  'High value shipment - signature required',
  'VIP customer - priority handling',
  '',
  'Requires special handling equipment'
];

async function seedShipments() {
  try {
    console.log('🌱 Seeding database with 15 test shipments...\n');

    // Get existing users
    const users = await dbAsync.all('SELECT id, name, email FROM users');
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      return;
    }

    console.log(`Found ${users.length} user(s):`);
    users.forEach(u => console.log(`  - ${u.name} (${u.email})`));
    console.log();

    const shipments = [];
    const now = new Date();

    // Create 15 shipments with varied conditions
    for (let i = 0; i < 15; i++) {
      const user = users[i % users.length]; // Distribute among users
      const origin = cities[Math.floor(Math.random() * cities.length)];
      let destination = cities[Math.floor(Math.random() * cities.length)];
      
      // Ensure origin and destination are different
      while (destination.city === origin.city) {
        destination = cities[Math.floor(Math.random() * cities.length)];
      }

      // Weight varies from 0.5kg to 25kg
      const weight = parseFloat((Math.random() * 24.5 + 0.5).toFixed(2));
      
      // Dimensions vary
      const length = Math.floor(Math.random() * 50 + 10);
      const width = Math.floor(Math.random() * 40 + 10);
      const height = Math.floor(Math.random() * 30 + 5);
      
      // Cost calculation based on weight and distance
      const baseCost = 50;
      const weightCost = weight * 8;
      const distanceCost = Math.random() * 50;
      const cost = Math.round(baseCost + weightCost + distanceCost);

      // Random status with weighted distribution
      const statusRandom = Math.random();
      let status;
      if (statusRandom < 0.20) status = 'Pending';
      else if (statusRandom < 0.35) status = 'Picked Up';
      else if (statusRandom < 0.55) status = 'In Transit';
      else if (statusRandom < 0.85) status = 'Delivered';
      else if (statusRandom < 0.95) status = 'On Hold';
      else status = 'Cancelled';

      // Create dates based on status
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // 0-30 days ago
      
      let pickedUpAt = null;
      let inTransitAt = null;
      let deliveredAt = null;
      let estimatedDelivery = new Date(createdAt);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

      if (status !== 'Pending') {
        pickedUpAt = new Date(createdAt);
        pickedUpAt.setHours(pickedUpAt.getHours() + Math.floor(Math.random() * 24) + 4);
      }
      
      if (status === 'In Transit' || status === 'Delivered') {
        inTransitAt = new Date(pickedUpAt);
        inTransitAt.setHours(inTransitAt.getHours() + Math.floor(Math.random() * 48) + 12);
      }
      
      if (status === 'Delivered') {
        deliveredAt = new Date(inTransitAt);
        deliveredAt.setHours(deliveredAt.getHours() + Math.floor(Math.random() * 48) + 12);
      }

      const postalCodes = ['11511', '21500', '12556', '46619', '85951', '81110', '84511', '42511', '35511', '31511'];
      const streetTypes = ['St', 'Ave', 'Blvd', 'Rd', 'Way'];
      
      const shipment = {
        userId: user.id,
        trackingNumber: generateTrackingNumber(),
        status,
        originAddress: `${Math.floor(Math.random() * 200) + 1} ${streetTypes[Math.floor(Math.random() * streetTypes.length)]}, ${origin.city}`,
        originCity: origin.city,
        originPostalCode: postalCodes[Math.floor(Math.random() * postalCodes.length)],
        originCountry: origin.country,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationAddress: `${Math.floor(Math.random() * 200) + 1} ${streetTypes[Math.floor(Math.random() * streetTypes.length)]}, ${destination.city}`,
        destinationCity: destination.city,
        destinationPostalCode: postalCodes[Math.floor(Math.random() * postalCodes.length)],
        destinationCountry: destination.country,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        recipientName: recipientNames[i],
        recipientPhone: `+201${Math.floor(Math.random() * 9 + 1)}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        recipientEmail: `${recipientNames[i].toLowerCase().replace(/\s/g, '.')}@example.com`,
        weight,
        dimensions: { length, width, height },
        packageType: packageTypes[Math.floor(Math.random() * packageTypes.length)],
        packageDescription: `${packageTypes[Math.floor(Math.random() * packageTypes.length)]} shipment containing ${['electronics', 'clothing', 'documents', 'food items', 'medical supplies'][Math.floor(Math.random() * 5)]}`,
        cost,
        notes: notesList[Math.floor(Math.random() * notesList.length)],
        createdAt: createdAt.toISOString(),
        pickedUpAt: pickedUpAt ? pickedUpAt.toISOString() : null,
        inTransitAt: inTransitAt ? inTransitAt.toISOString() : null,
        deliveredAt: deliveredAt ? deliveredAt.toISOString() : null,
        estimatedDelivery: estimatedDelivery.toISOString()
      };

      shipments.push(shipment);
    }

    // Insert shipments into database
    let inserted = 0;
    for (const s of shipments) {
      try {
        await dbAsync.run(`
          INSERT INTO shipments (
            user_id, tracking_number, status,
            origin_address, origin_city, origin_postal_code, origin_country, origin_lat, origin_lng,
            destination_address, destination_city, destination_postal_code, destination_country, destination_lat, destination_lng,
            recipient_name, recipient_phone, recipient_email,
            package_weight, package_length, package_width, package_height,
            weight, dimensions_length, dimensions_width, dimensions_height, package_type, package_description,
            cost, notes,
            created_at, picked_up_at, in_transit_at, delivered_at, estimated_delivery
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          s.userId, s.trackingNumber, s.status,
          s.originAddress, s.originCity, s.originPostalCode, s.originCountry, s.originLat, s.originLng,
          s.destinationAddress, s.destinationCity, s.destinationPostalCode, s.destinationCountry, s.destinationLat, s.destinationLng,
          s.recipientName, s.recipientPhone, s.recipientEmail,
          s.weight, s.dimensions.length, s.dimensions.width, s.dimensions.height,
          s.weight, s.dimensions.length, s.dimensions.width, s.dimensions.height, s.packageType, s.packageDescription,
          s.cost, s.notes,
          s.createdAt, s.pickedUpAt, s.inTransitAt, s.deliveredAt, s.estimatedDelivery
        ]);
        inserted++;
        
        console.log(`✅ Shipment ${inserted}/15: ${s.trackingNumber}`);
        console.log(`   From: ${s.originCity} → To: ${s.destinationCity}`);
        console.log(`   Status: ${s.status} | Weight: ${s.weight}kg | Cost: $${s.cost}`);
        console.log(`   Recipient: ${s.recipientName} (${s.recipientPhone})`);
        console.log(`   User: ${users.find(u => u.id === s.userId).name}\n`);
      } catch (err) {
        console.error(`❌ Failed to insert shipment ${s.trackingNumber}:`, err.message);
      }
    }

    // Print summary
    const statusCounts = {};
    for (const s of shipments) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    }

    console.log('\n📊 Summary:');
    console.log('='.repeat(50));
    console.log(`Total shipments created: ${inserted}/15`);
    console.log('\nStatus Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    const totalValue = shipments.reduce((sum, s) => sum + s.cost, 0);
    const totalWeight = shipments.reduce((sum, s) => sum + s.weight, 0);
    
    console.log(`\nTotal Shipment Value: $${totalValue}`);
    console.log(`Total Weight: ${totalWeight.toFixed(2)}kg`);
    console.log(`Average Cost: $${(totalValue / inserted).toFixed(2)}`);
    console.log('='.repeat(50));
    console.log('\n✨ Seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedShipments().then(() => {
    console.log('\nPress Ctrl+C to exit');
    setTimeout(() => process.exit(0), 1000);
  });
}

module.exports = { seedShipments };
