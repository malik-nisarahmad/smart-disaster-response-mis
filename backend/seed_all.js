const db = require('./database/connection');

async function seedAll() {
  try {
    // We already seeded roles and disaster_types. Let's do the rest!
    
    console.log('Seeding warehouses...');
    await db.query(`
        INSERT INTO warehouses (name, location, latitude, longitude, capacity) VALUES
        ('Central Warehouse Islamabad', 'I-9 Industrial Area, Islamabad', 33.6700, 73.0400, 50000),
        ('Lahore Relief Depot', 'Multan Road, Lahore', 31.4800, 74.3200, 35000),
        ('Karachi South Hub', 'SITE Area, Karachi', 24.8700, 67.0100, 45000),
        ('Peshawar Emergency Store', 'GT Road, Peshawar', 34.0100, 71.5200, 20000)
    `);

    console.log('Seeding hospitals...');
    await db.query(`
        INSERT INTO hospitals (name, location, latitude, longitude, total_beds, available_beds, icu_beds, available_icu, phone, status) VALUES
        ('PIMS Hospital', 'G-8, Islamabad', 33.6950, 73.0500, 500, 120, 30, 8, '051-9261170', 'Operational'),
        ('Mayo Hospital', 'Anarkali, Lahore', 31.5700, 74.3100, 2200, 350, 50, 15, '042-99211261', 'Operational'),
        ('Jinnah Hospital', 'Rafiqui Shaheed Road, Karachi', 24.8750, 67.0300, 1500, 80, 40, 5, '021-99201300', 'Limited'),
        ('Lady Reading Hospital', 'Hospital Road, Peshawar', 34.0120, 71.5780, 1200, 200, 35, 12, '091-9211430', 'Operational'),
        ('Civil Hospital Quetta', 'Zarghoon Road, Quetta', 30.1980, 67.0100, 600, 300, 15, 10, '081-9202274', 'Operational')
    `);

    console.log('Seeding rescue teams...');
    await db.query(`
        INSERT INTO rescue_teams (team_name, team_type, leader_name, member_count, current_latitude, current_longitude, status) VALUES
        ('Alpha Medical Unit', 'Medical', 'Dr. Kamran', 8, 33.6844, 73.0479, 'Busy'),
        ('Bravo Fire Squad', 'Fire', 'Capt. Rizwan', 10, 31.5204, 74.3587, 'Assigned'),
        ('Charlie Rescue Team', 'Rescue', 'Lt. Imran', 6, 33.7294, 73.0931, 'Available'),
        ('Delta Search Unit', 'Search', 'Sgt. Naveed', 6, 34.0151, 71.5249, 'Available'),
        ('Echo Medical Team', 'Medical', 'Dr. Sana', 7, 24.8607, 67.0011, 'Busy'),
        ('Foxtrot Hazmat', 'Hazmat', 'Maj. Khalid', 5, 33.6000, 73.0500, 'Available'),
        ('Golf Rescue Brigade', 'Rescue', 'Capt. Tariq', 8, 31.5000, 74.3500, 'Off Duty'),
        ('Hotel Fire Response', 'Fire', 'Lt. Farah', 10, 25.3960, 68.3578, 'Available')
    `);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
}

seedAll();
