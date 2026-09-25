const http = require("http");
const { createClient } = require("redis");

const port = process.env.PORT || 3000;
const massage = process.env.MASSAGE || 'Hello from Anw Devops Server!';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({ url: redisUrl });
client.on('error', (err) => console.log('Redis Error', err));

const server = http.createServer(async (req, res) => {
    if (!client.isReady) await client.connect();

    const hits = await client.incr('hits');

    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end(`${massage}\nYou are visitor number: ${hits}\n`);
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
