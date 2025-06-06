import mqtt from 'mqtt';
import pkg from 'pg';
const { Pool } = pkg;

// Environment variables
const mqttUrl = process.env.MQTT_URL;
const mqttTopic = process.env.MQTT_TOPIC;
const dbUrl = process.env.POSTGRES_URL;

// Setup PostgreSQL connection pool
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Connect to MQTT broker
const client = mqtt.connect(mqttUrl);

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  client.subscribe(mqttTopic, err => {
    if (err) {
      console.error('❌ Subscription failed:', err.message);
    } else {
      console.log(`📡 Subscribed to topic: ${mqttTopic}`);
    }
  });
});

client.on('message', async (topic, message) => {
  try {
    const { waterLevel, batteryVoltage } = JSON.parse(message.toString());

    const result = await pool.query(
      'INSERT INTO sensor_readings (water_level, battery_voltage) VALUES ($1, $2) RETURNING *',
      [waterLevel, batteryVoltage]
    );

    console.log('✅ Saved to DB:', result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to process message:', err.message);
  }
});
