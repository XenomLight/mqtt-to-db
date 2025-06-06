import mqtt from 'mqtt';
import { sql } from '@vercel/postgres';

// ENV variables (will be set in Render)
const mqttUrl = process.env.MQTT_URL;
const mqttTopic = process.env.MQTT_TOPIC;

const client = mqtt.connect(mqttUrl);

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  client.subscribe(mqttTopic, err => {
    if (err) console.error('Failed to subscribe:', err);
    else console.log(`📡 Subscribed to topic "${mqttTopic}"`);
  });
});

client.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    const waterLevel = data.waterLevel;
    const batteryVoltage = data.batteryVoltage;

    const result = await sql`
      INSERT INTO sensor_readings (water_level, battery_voltage)
      VALUES (${waterLevel}, ${batteryVoltage})
      RETURNING id, timestamp, water_level, battery_voltage, created_at
    `;

    console.log('✅ Saved to DB:', result.rows[0]);
  } catch (err) {
    console.error('❌ Error handling message:', err.message);
  }
});
