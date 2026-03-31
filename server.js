const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve portal_demo.html as root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'portal_demo.html'));
});

app.listen(PORT, () => {
  console.log(`AI社内ポータルBuilder running on port ${PORT}`);
});
