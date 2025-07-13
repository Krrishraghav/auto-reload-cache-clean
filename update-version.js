const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');

const PORT = 3000;
const VERSION_FILE = path.join('/home/raghav/Documents/auto_reload_on_update/version.txt');

// Create server instance
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    console.log(`Request received: ${req.method} ${pathname}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // Handle version updates
    if (req.method === 'POST' && pathname === '/update-version') {
        let body = '';
        req.on('data', chunk => body += chunk);
        
        req.on('end', async () => {
            try {
                const { version } = JSON.parse(body);
                
                // Validate version format
                if (!version || !/^\d+\.\d+$/.test(version)) {
                    throw new Error('Version must be in X.X format');
                }

                // Write to version file
                await fs.writeFile(VERSION_FILE, version);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    version,
                    timestamp: new Date().toISOString()
                }));
                
                console.log(`Updated version to ${version}`);
            } catch (err) {
                console.error('Error:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: err.message,
                    details: 'Ensure version is in X.X format and file is writable'
                }));
            }
        });
        return;
    }

    // Handle unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        error: "Not found",
        availableEndpoints: ["POST /update-version"]
    }));
});

// Start the server
async function startServer() {
    try {
        // Ensure version file exists
        try {
            await fs.access(VERSION_FILE);
            console.log(`Version file exists at ${VERSION_FILE}`);
        } catch {
            await fs.writeFile(VERSION_FILE, '1.0.0');
            console.log(`Created new version file at ${VERSION_FILE}`);
        }

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\nServer is running on http://localhost:${PORT}`);
            console.log(`Monitoring version file: ${VERSION_FILE}`);
            console.log("Ready to accept requests...\n");
        });

        // Handle server errors
        server.on('error', (err) => {
            console.error('Server error:', err);
        });

        // Handle process termination
        process.on('SIGINT', () => {
            console.log('\nShutting down server...');
            server.close(() => {
                console.log('Server stopped');
                process.exit(0);
            });
        });

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Start the application
startServer();