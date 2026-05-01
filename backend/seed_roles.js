const db = require('./database/connection');

async function seedDisasters() {
  try {
    const query = `
      INSERT INTO disaster_types (name, description, icon) VALUES
      ('Flood', 'Water-related flooding event', 'droplets'),
      ('Earthquake', 'Seismic activity', 'mountain'),
      ('Urban Fire', 'Fire in urban/residential area', 'flame'),
      ('Building Collapse', 'Structural failure', 'building'),
      ('Landslide', 'Land mass movement', 'mountain-snow'),
      ('Storm', 'Severe weather event', 'cloud-lightning'),
      ('Other', 'Other type of disaster', 'alert-triangle')
    `;
    await db.query(query);
    console.log('Disaster types inserted successfully.');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Violation of UNIQUE KEY constraint')) {
       console.log('Disaster types already exist.');
       process.exit(0);
    }
    console.error('Error inserting disaster types:', error.message);
    process.exit(1);
  }
}

seedDisasters();
