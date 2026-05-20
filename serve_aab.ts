import express from 'express';
import path from 'path';
import https from 'https';

function fetchWithHttps(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Status Code: ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/leads', async (req, res) => {
    try {
      console.log('--- LEADS FETCH START ---');
      const data = await fetchWithHttps('https://doableindia.com/api_data.php');
      res.json(data);
    } catch (error: any) {
      console.error('Proxy error (leads):', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.get('/api/tutors', async (req, res) => {
    try {
      console.log('--- TUTORS FETCH START ---');
      const data = await fetchWithHttps('https://doableindia.com/api_data_copy.php');
      res.json(data);
    } catch (error: any) {
      console.error('Tutors Proxy error:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  const distPath = path.resolve(process.cwd(), '../temp_app/base/assets/public');
  console.log(`Serving assets from: ${distPath}`);
  
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
