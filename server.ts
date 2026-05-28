import express from 'express';
import path from 'path';

async function startServer() {
  const app = express();
  // Cloud Run requires listening on process.env.PORT
  const PORT = process.env.PORT || 3000;

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Proxy Route
  app.get('/api/leads', async (req, res) => {
    try {
      console.log('Fetching leads from external API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); 
      
      const response = await fetch('https://doableindia.com/app-sys/api_data.php', { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`External API responded with status ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy error (leads):', error.message);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to fetch external data',
        details: error.message 
      });
    }
  });

  app.get('/api/tutors', async (req, res) => {
    try {
      console.log('Fetching tutors from Hostinger (api_copy_data.php)...');
      const response = await fetch('https://doableindia.com/app-sys/api_copy_data.php', { 
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`External API responded with status ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Tutors Proxy error:', error.message);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to fetch tutors data',
        details: error.message
      });
    }
  });

  app.post('/api/auth/signup', express.json(), async (req, res) => {
    try {
      console.log('Forwarding signup to Hostinger...');
      const response = await fetch('https://doableindia.com/app-sys/app_auth.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'signup', ...req.body })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.post('/api/auth/signin', express.json(), async (req, res) => {
    try {
      console.log('Forwarding signin to Hostinger...');
      const response = await fetch('https://doableindia.com/app-sys/app_auth.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'signin', ...req.body })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.post('/api/profile/update', express.json(), async (req, res) => {
    try {
      const payload: any = { action: 'upsert', ...req.body };
      console.log('Forwarding profile update to Hostinger (api_copy.php)...');
      
      const response = await fetch('https://doableindia.com/app-sys/api_copy.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const responseText = await response.text();
      console.log('Raw response from Hostinger:', responseText.slice(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse Hostinger response as JSON');
        res.status(500).json({ status: 'error', message: 'Invalid response from server', raw: responseText.slice(0, 200) });
        return;
      }
      
      console.log('Response from Hostinger (parsed):', JSON.stringify(data).slice(0, 200) + '...');
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Proxy Error:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.post('/api/profile/parent/update', express.json(), async (req, res) => {
    try {
      console.log('Forwarding parent profile update to Hostinger (api_copy.php)...');
      const response = await fetch('https://doableindia.com/app-sys/api_copy.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action: 'upsert', ...req.body })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  const distPath = path.join(process.cwd(), 'dist');

  if (process.env.NODE_ENV !== 'production') {
    // Dynamically import vite only in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
