import mqtt from 'mqtt';
import pkg from 'pg';
const { Pool } = pkg;

// Environment variables
const mqttUrl = process.env.MQTT_URL;
const mqttTopic = process.env.MQTT_TOPIC;
const dbUrl = process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const client = mqtt.connect(mqttUrl);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(mqttTopic, err => {
    if (err) {
      console.error('Subscription failed:', err.message);
    } else {
      console.log(`Subscribed to topic: ${mqttTopic}`);
    }
  });
});

client.on('message', async (topic, message) => {
  try {
    const { calc_tinggi, calc_arus } = JSON.parse(message.toString());

    const waterLevel = parseFloat(calc_tinggi);
    const batteryVoltage = parseFloat(calc_arus);

    const result = await pool.query(
      'INSERT INTO sensor_readings (water_level, battery_voltage) VALUES ($1, $2) RETURNING *',
      [waterLevel, batteryVoltage]
    );

    console.log('Saved to DB:', result.rows[0]);
  } catch (err) {
    console.error('Error processing message:', err.message);
  }
});

