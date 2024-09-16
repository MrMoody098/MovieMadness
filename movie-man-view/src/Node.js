// server.js
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

// Proxy route
app.get('/api/proxy', async (req, res) => {
  const { movieId } = req.query;
  const externalApiUrl = `https://vidsrc.xyz/embed/movie/${movieId}`;

  try {
    // Fetch video content from the external API
    const response = await axios.get(externalApiUrl, {
      headers: {
        // Include any necessary headers the API requires here
      },
    });

    // Send the response from the external API back to the client
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error fetching data from the external API:', error);
    res.status(500).send('Error fetching video');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});