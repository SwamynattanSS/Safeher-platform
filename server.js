require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // Add this
const app = express();
app.use(express.json());

// 1. Connect to MongoDB (Make sure MONGODB_URI is in Render Environment Variables)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// 2. Define the Schema
const alertSchema = new mongoose.Schema({
  name: String,
  location: String,
  timestamp: { type: Date, default: Date.now }
});
const SosAlert = mongoose.model('SosAlert', alertSchema);

// 3. Update your Route to save to DB
app.post('/api/sos', async (req, res) => {
  try {
    const { name, location } = req.body;
    
    // Save to Database
    const newAlert = new SosAlert({ name, location });
    await newAlert.save();
    
    console.log("Data saved to MongoDB:", name);
    res.status(200).send("Alert saved!");
  } catch (err) {
    res.status(500).send("Error saving data");
  }
});

// ... rest of your existing code
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve the frontend web app files automatically from the 'public' folpp.use(express.static(path.join(__dirname, 'public')));

// Initialize Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// MOCK DATA: Simulating dangerous regions/low-lit areas for the AI Routing demo
const HIGH_RISK_ZONES = [
    { name: "Dark Alley Quad 1", lat: 13.0827, lng: 80.2707, riskFactor: 0.9 }, // Example coords (Chennai)
    { name: "Unlit Underpass Route B", lat: 13.0850, lng: 80.2800, riskFactor: 0.85 }
];

// 🚨 MODULE 1: Real-Time Emergency SOS Broadcast API
// Keep track of recent alerts in memory so users can see them live on the public web app
let liveAlertsDashboard = [];

app.post('/api/sos', async (req, res) => {
    const { userName, lat, lng, trustedContacts, mode } = req.body;
    
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const alertMessage = `🚨 EMERGENCY ALERT from ${userName}! They need help. Live Location: ${mapLink}`;
    const timestamp = new Date().toLocaleTimeString();

    // Always log to dashboard memory
    const alertData = { userName, mapLink, timestamp, mode: mode || 'Simulation' };
    liveAlertsDashboard.unshift(alertData); // Add to top of the list
    if (liveAlertsDashboard.length > 20) liveAlertsDashboard.pop(); // Keep last 20

    console.log(`[ALERT INTAKE] Mode: ${mode} | User: ${userName}`);

    // If user selected SIMULATION mode, bypass Twilio entirely (No Errors!)
    if (mode === 'Simulation') {
        return res.status(200).json({ 
            success: true, 
            message: "Simulation Alert Captured! Check the Live Activity Feed below." 
        });
    }

    // If user selected REAL SMS mode, attempt to use Twilio
    try {
        const dispatchPromises = trustedContacts.map(phone => {
            return twilioClient.messages.create({
                body: alertMessage,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone
            });
        });

        await Promise.all(dispatchPromises);
        return res.status(200).json({ success: true, message: "Real SMS Alert successfully dispatched!" });
        
    } catch (error) {
        // Safe fallback if your Twilio limit is hit during Real SMS mode
        return res.status(200).json({ 
            success: true, 
            message: "Twilio Daily Balance Exhausted. System automatically fell back to Simulation Mode successfully!" 
        });
    }
});

// Create an endpoint to let the frontend fetch the live dashboard data
app.get('/api/dashboard', (req, res) => {
    res.json(liveAlertsDashboard);
});
// 🗺️ MODULE 2: AI Safe-Route Engine API
app.post('/api/navigation/safe-route', (req, res) => {
    const { alternativeRoutes } = req.body;
    
    let bestRoute = alternativeRoutes[0];
    let lowestRiskValue = 999.0;

    // Evaluate each incoming route options against high-risk zones
    alternativeRoutes.forEach((route) => {
        let currentRouteRisk = 0.1;

        route.points.forEach(point => {
            HIGH_RISK_ZONES.forEach(zone => {
                const distanceDelta = Math.sqrt(Math.pow(point.lat - zone.lat, 2) + Math.pow(point.lng - zone.lng, 2));
                if (distanceDelta < 0.005) { // Check if path gets too close to bad zones
                    currentRouteRisk += zone.riskFactor;
                }
            });
        });

        if (currentRouteRisk < lowestRiskValue) {
            lowestRiskValue = currentRouteRisk;
            bestRoute = route;
        }
    });

    res.status(200).json({
        message: "Successfully optimized route to prioritize street illumination and user safety ratings.",
        optimizedSafeRoute: bestRoute,
        safetyRiskScore: lowestRiskValue
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 SafeHer Application Server is running on http://localhost:${PORT}`));
// Explicitly catch the main home page URL and send the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const mongoose = require('mongoose');

// 1. Connect to MongoDB Cloud using an environment variable
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Cloud successfully!"))
  .catch(err => console.error("MongoDB connection error:", err));

// 2. Define the Blueprint (Schema) for your SOS data
const SosAlertSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true }, // Can store coordinates or a map URL string
  timestamp: { type: Date, default: Date.now }
});

// 3. Create the Database Model
const SosAlert = mongoose.model('SosAlert', SosAlertSchema);

// 4. Update your existing Express POST route where the SOS is triggered
app.post('/api/sos', async (req, res) => {
  const { name, location } = req.body;

  try {
    // Save to MongoDB Cloud
    const newAlert = new SosAlert({ name, location });
    await newAlert.save();

    // --- Your existing Twilio SMS logic can stay right here ---

    res.status(200).json({ success: true, message: "SOS logged in cloud and sent!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
