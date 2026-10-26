import http from 'http';
import app from './app.js';
import { env } from './config/env.js';

const PORT = env.port;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});