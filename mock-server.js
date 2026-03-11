const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
let nextId = 1;
const weights = [];
const animals = [
  { species: 'African Elephant', family: 'Elephantidae', habitat: 'Savannah' },
  { species: 'Gray Wolf', family: 'Canidae', habitat: 'Forests' },
  { species: 'Bottlenose Dolphin', family: 'Delphinidae', habitat: 'Ocean' },
  { species: 'Bengal Tiger', family: 'Felidae', habitat: 'Tropical Forest' },
  { species: 'Emperor Penguin', family: 'Spheniscidae', habitat: 'Polar Coast' },
  { species: 'Red Kangaroo', family: 'Macropodidae', habitat: 'Grassland' },
  { species: 'Giant Panda', family: 'Ursidae', habitat: 'Bamboo Forest' },
  { species: 'Komodo Dragon', family: 'Varanidae', habitat: 'Dry Islands' }
];
const weatherDataPath = path.join(__dirname, 'data', 'weather-data.json');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === '/api/weights' && req.method === 'GET') {
    sendJson(res, 200, { data: weights });
    return;
  }

  if (req.url === '/api/animals' && req.method === 'GET') {
    sendJson(res, 200, animals);
    return;
  }

  if (req.url === '/api/weather-data' && req.method === 'GET') {
    try {
      const raw = fs.readFileSync(weatherDataPath, 'utf-8');
      const weather = JSON.parse(raw);
      sendJson(res, 200, weather);
    } catch (error) {
      sendJson(res, 500, { message: 'Could not load weather data.' });
    }
    return;
  }

  if (req.url === '/api/weights' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const weight = Number(parsed.weight);

        if (!Number.isFinite(weight)) {
          sendJson(res, 400, { message: 'Weight must be numeric.' });
          return;
        }

        const created = {
          id: nextId++,
          weight,
          createdAt: new Date().toISOString()
        };

        weights.push(created);
        sendJson(res, 201, { message: 'Weight submitted successfully.', data: created });
      } catch (error) {
        sendJson(res, 400, { message: 'Invalid JSON payload.' });
      }
    });

    return;
  }

  sendJson(res, 404, { message: 'Not found.' });
});

server.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
