const express = require('express');
const cors = require('cors');
const path = require('path');

const eventsRouter = require('./routes/events');
const racersRouter = require('./routes/racers');
const resultsRouter = require('./routes/results');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/events', eventsRouter);
app.use('/api', racersRouter);
app.use('/api', resultsRouter);

// Serve built frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
