const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  DukaanAI Frontend Dev Server`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Backend API target: http://localhost:8000`);
  console.log(`======================================================\n`);
});
