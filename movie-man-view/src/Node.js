// server.js
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/proxy', async (req, res) => {
  const { movieId } = req.query;
  const externalApiUrl = `https://vidsrc.xyz/embed/movie/${movieId}`;

  try {
    const response = await axios.get(externalApiUrl, {
      headers: {},
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching content');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});