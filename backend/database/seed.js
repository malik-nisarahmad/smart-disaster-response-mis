/**
 * Database seed script for MySQL
 * Run: node database/seed.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'disaster_response_mis',
  });

  try {
    console.log('Seeding database...');

    // 1. Roles
    const [rolesExist] = await connection.query('SELECT COUNT(*) as cnt FROM roles');
    if (rolesExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO roles (id, name, description) VALUES
        (1, 'Administrator', 'Full system access'),
        (2, 'Emergency Operator', 'Manages emergency reports and dispatch'),
        (3, 'Field Officer', 'Manages rescue teams in the field'),
        (4, 'Warehouse Manager', 'Manages resources and inventory'),
        (5, 'Finance Officer', 'Manages financial transactions and budgets')
      `);
      console.log('  Seeded roles');
    }

    // 2. Users (password = "password123" for all)
    const [usersExist] = await connection.query('SELECT COUNT(*) as cnt FROM users');
    if (usersExist[0].cnt === 0) {
      const hash = await bcrypt.hash('password123', 10);
      await connection.query(`
        INSERT INTO users (id, full_name, email, password_hash, phone, role_id) VALUES
        (1, 'Admin User', 'admin@mis.gov', ?, '555-0001', 1),
        (2, 'Sarah Operator', 'operator@mis.gov', ?, '555-0002', 2),
        (3, 'John Field', 'field@mis.gov', ?, '555-0003', 3),
        (4, 'Maria Warehouse', 'warehouse@mis.gov', ?, '555-0004', 4),
        (5, 'Ahmed Finance', 'finance@mis.gov', ?, '555-0005', 5)
      `, [hash, hash, hash, hash, hash]);
      console.log('  Seeded users');
    }

    // 3. Disaster types
    const [dtExist] = await connection.query('SELECT COUNT(*) as cnt FROM disaster_types');
    if (dtExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO disaster_types (id, name, description, icon) VALUES
        (1, 'Flood', 'Water-related flooding event', 'droplets'),
        (2, 'Earthquake', 'Seismic activity', 'mountain'),
        (3, 'Urban Fire', 'Fire in urban/residential area', 'flame'),
        (4, 'Building Collapse', 'Structural failure', 'building'),
        (5, 'Landslide', 'Land mass movement', 'mountain-snow'),
        (6, 'Storm', 'Severe weather event', 'cloud-lightning'),
        (7, 'Other', 'Other type of disaster', 'alert-triangle')
      `);
      console.log('  Seeded disaster types');
    }

    // 4. Emergency reports
    const [erExist] = await connection.query('SELECT COUNT(*) as cnt FROM emergency_reports');
    if (erExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO emergency_reports (id, reporter_name, reporter_phone, disaster_type_id, severity, latitude, longitude, location_description, description, status, assigned_operator_id) VALUES
        (1, 'Ali Hassan', '555-1001', 1, 'Critical', 33.6844, 73.0479, 'Sector G-10, Islamabad', 'Severe flooding after heavy rain, water level rising', 'In Progress', 2),
        (2, 'Fatima Khan', '555-1002', 3, 'High', 31.5204, 74.3587, 'Mall Road, Lahore', 'Commercial building fire on 3rd floor', 'Acknowledged', 2),
        (3, 'Omar Ali', '555-1003', 2, 'Critical', 34.0151, 71.5249, 'University Town, Peshawar', 'Earthquake tremors, buildings damaged', 'Pending', NULL),
        (4, 'Ayesha Malik', '555-1004', 1, 'Moderate', 24.8607, 67.0011, 'Clifton, Karachi', 'Street flooding, cars stuck', 'In Progress', 2),
        (5, 'Zain Ahmed', '555-1005', 4, 'High', 33.7294, 73.0931, 'Blue Area, Islamabad', 'Partial building collapse after tremor', 'Pending', NULL),
        (6, 'Hira Siddiqui', '555-1006', 3, 'Low', 31.4505, 73.1350, 'Faisalabad', 'Small fire in warehouse, contained', 'Resolved', 2),
        (7, 'Bilal Shah', '555-1007', 1, 'High', 25.3960, 68.3578, 'Hyderabad', 'River overflow threatening residential area', 'Acknowledged', 2),
        (8, 'Nadia Rashid', '555-1008', 2, 'Moderate', 30.1575, 66.9972, 'Quetta', 'Minor earthquake, some wall cracks', 'Pending', NULL)
      `);
      console.log('  Seeded emergency reports');
    }

    // 5. Rescue teams
    const [rtExist] = await connection.query('SELECT COUNT(*) as cnt FROM rescue_teams');
    if (rtExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO rescue_teams (id, team_name, team_type, leader_name, member_count, current_latitude, current_longitude, status) VALUES
        (1, 'Alpha Medical Unit', 'Medical', 'Dr. Kamran', 8, 33.6844, 73.0479, 'Busy'),
        (2, 'Bravo Fire Squad', 'Fire', 'Capt. Rizwan', 10, 31.5204, 74.3587, 'Assigned'),
        (3, 'Charlie Rescue Team', 'Rescue', 'Lt. Imran', 6, 33.7294, 73.0931, 'Available'),
        (4, 'Delta Search Unit', 'Search', 'Sgt. Naveed', 6, 34.0151, 71.5249, 'Available'),
        (5, 'Echo Medical Team', 'Medical', 'Dr. Sana', 7, 24.8607, 67.0011, 'Busy'),
        (6, 'Foxtrot Hazmat', 'Hazmat', 'Maj. Khalid', 5, 33.6000, 73.0500, 'Available'),
        (7, 'Golf Rescue Brigade', 'Rescue', 'Capt. Tariq', 8, 31.5000, 74.3500, 'Off Duty'),
        (8, 'Hotel Fire Response', 'Fire', 'Lt. Farah', 10, 25.3960, 68.3578, 'Available')
      `);
      console.log('  Seeded rescue teams');
    }

    // 6. Warehouses
    const [whExist] = await connection.query('SELECT COUNT(*) as cnt FROM warehouses');
    if (whExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO warehouses (id, name, location, latitude, longitude, manager_id, capacity) VALUES
        (1, 'Central Warehouse Islamabad', 'I-9 Industrial Area, Islamabad', 33.6700, 73.0400, 4, 50000),
        (2, 'Lahore Relief Depot', 'Multan Road, Lahore', 31.4800, 74.3200, 4, 35000),
        (3, 'Karachi South Hub', 'SITE Area, Karachi', 24.8700, 67.0100, 4, 45000),
        (4, 'Peshawar Emergency Store', 'GT Road, Peshawar', 34.0100, 71.5200, 4, 20000)
      `);
      console.log('  Seeded warehouses');
    }

    // 7. Resources
    const [resExist] = await connection.query('SELECT COUNT(*) as cnt FROM resources');
    if (resExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO resources (id, name, category, warehouse_id, quantity, unit, threshold_min) VALUES
        (1, 'Drinking Water Bottles', 'Water', 1, 5000, 'bottles', 500),
        (2, 'Rice Bags (25kg)', 'Food', 1, 800, 'bags', 100),
        (3, 'First Aid Kits', 'Medicine', 1, 300, 'kits', 50),
        (4, 'Emergency Tents', 'Shelter', 1, 150, 'units', 20),
        (5, 'Blankets', 'Shelter', 1, 2000, 'units', 200),
        (6, 'Water Purification Tablets', 'Water', 2, 10000, 'tablets', 1000),
        (7, 'Canned Food Packets', 'Food', 2, 3000, 'packets', 300),
        (8, 'Pain Relief Medicine', 'Medicine', 2, 500, 'boxes', 50),
        (9, 'Portable Generators', 'Equipment', 3, 25, 'units', 5),
        (10, 'Stretchers', 'Equipment', 3, 40, 'units', 10),
        (11, 'Antibiotics', 'Medicine', 3, 200, 'boxes', 30),
        (12, 'Tarpaulins', 'Shelter', 4, 500, 'sheets', 50),
        (13, 'Emergency Rations', 'Food', 4, 45, 'boxes', 50),
        (14, 'IV Fluid Bags', 'Medicine', 1, 35, 'bags', 50),
        (15, 'Rescue Ropes', 'Equipment', 2, 80, 'units', 15)
      `);
      console.log('  Seeded resources');
    }

    // 8. Hospitals
    const [hExist] = await connection.query('SELECT COUNT(*) as cnt FROM hospitals');
    if (hExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO hospitals (id, name, location, latitude, longitude, total_beds, available_beds, icu_beds, available_icu, phone, status) VALUES
        (1, 'PIMS Hospital', 'G-8, Islamabad', 33.6950, 73.0500, 500, 120, 30, 8, '051-9261170', 'Operational'),
        (2, 'Mayo Hospital', 'Anarkali, Lahore', 31.5700, 74.3100, 2200, 350, 50, 15, '042-99211261', 'Operational'),
        (3, 'Jinnah Hospital', 'Rafiqui Shaheed Road, Karachi', 24.8750, 67.0300, 1500, 80, 40, 5, '021-99201300', 'Limited'),
        (4, 'Lady Reading Hospital', 'Hospital Road, Peshawar', 34.0120, 71.5780, 1200, 200, 35, 12, '091-9211430', 'Operational'),
        (5, 'Civil Hospital Quetta', 'Zarghoon Road, Quetta', 30.1980, 67.0100, 600, 300, 15, 10, '081-9202274', 'Operational')
      `);
      console.log('  Seeded hospitals');
    }

    // 9. Financial transactions
    const [ftExist] = await connection.query('SELECT COUNT(*) as cnt FROM financial_transactions');
    if (ftExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO financial_transactions (id, transaction_type, category, amount, donor_name, emergency_id, description, recorded_by, status) VALUES
        (1, 'Donation', 'Individual', 50000.00, 'Aga Khan Foundation', 1, 'Flood relief donation', 5, 'Completed'),
        (2, 'Donation', 'Corporate', 500000.00, 'Engro Corporation', 1, 'Corporate CSR flood relief', 5, 'Completed'),
        (3, 'Expense', 'Logistics', 75000.00, NULL, 1, 'Transport of supplies to flood area', 5, 'Approved'),
        (4, 'Procurement', 'Medical Supplies', 120000.00, NULL, 2, 'Emergency medical supplies for fire victims', 5, 'Pending'),
        (5, 'Donation', 'Government', 2000000.00, 'NDMA Pakistan', NULL, 'Government relief fund allocation', 5, 'Completed'),
        (6, 'Expense', 'Personnel', 45000.00, NULL, 3, 'Rescue team deployment costs', 5, 'Approved'),
        (7, 'Distribution', 'Relief Goods', 30000.00, NULL, 4, 'Distribution of food and water in Karachi', 5, 'Completed'),
        (8, 'Donation', 'Individual', 10000.00, 'Anonymous Donor', 1, 'Individual flood relief donation', 5, 'Completed')
      `);
      console.log('  Seeded financial transactions');
    }

    // 10. Approval requests
    const [apExist] = await connection.query('SELECT COUNT(*) as cnt FROM approval_requests');
    if (apExist[0].cnt === 0) {
      await connection.query(`
        INSERT INTO approval_requests (id, request_type, reference_id, reference_table, requested_by, status, priority, description) VALUES
        (1, 'Resource Distribution', 1, 'resource_allocations', 4, 'Pending', 'Urgent', 'Release 500 water bottles to Sector G-10 flood zone'),
        (2, 'Rescue Deployment', 3, 'rescue_teams', 3, 'Pending', 'High', 'Deploy Charlie Rescue Team to building collapse site'),
        (3, 'Financial Approval', 4, 'financial_transactions', 5, 'Pending', 'Medium', 'Approve procurement of medical supplies for fire victims'),
        (4, 'Resource Distribution', 2, 'resource_allocations', 4, 'Approved', 'High', 'Release 200 rice bags to Lahore relief camp'),
        (5, 'Budget Allocation', 1, 'budgets', 5, 'Pending', 'High', 'Allocate PKR 5M budget for earthquake relief in Peshawar')
      `);
      console.log('  Seeded approval requests');
    }

    console.log('\nDatabase seeded successfully!');
    console.log('\nTest credentials:');
    console.log('  Admin:     admin@mis.gov / password123');
    console.log('  Operator:  operator@mis.gov / password123');
    console.log('  Field:     field@mis.gov / password123');
    console.log('  Warehouse: warehouse@mis.gov / password123');
    console.log('  Finance:   finance@mis.gov / password123');

  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }

  process.exit(0);
}

seedDatabase();
