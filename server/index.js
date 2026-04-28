const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const eventsRouter = require('./routes/events');
const racersRouter = require('./routes/racers');
const resultsRouter = require('./routes/results');
const authRouter = require('./routes/auth');
const registrationsRouter = require('./routes/registrations');
const wavesRouter = require('./routes/waves');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(cookieParser());

// Raw body MUST come before express.json() for Stripe webhook signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());

// API routes
app.use('/api/auth', authRouter);
app.use('/api', registrationsRouter);
app.use('/api', wavesRouter);
app.use('/api/events', eventsRouter);
app.use('/api', racersRouter);
app.use('/api', resultsRouter);

// Serve built frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
