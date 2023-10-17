const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

let chatFilePath = path.join(__dirname, 'chat.json');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === "POST" && req.url === "/Message") {
        handlePostRequest(req, res);
    } else if (req.method === "GET" && req.url === "/") {
        serveHTMLPage(res);
    } else if (req.method === "GET" && req.url === "/getall") {
        serveChatData(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

server.listen(3000, () => {
    console.log('Server is active at http://localhost:3000');
});

const wss = new WebSocket.Server({ port: 4000 });
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        broadcastMessage(message, ws);
    });

    ws.on('close', () => {
        removeClient(ws);
    });
});

let Clients = [];

function handlePostRequest(req, res) {
    let postData = '';
    req.on('data', (chunk) => {
        postData += chunk;
    });

    req.on('end', () => {
        const newMessage = JSON.parse(postData);
        console.log(postData);

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(postData);
            }
        });

        InsertToJson('chat.json', newMessage);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('POST request completed');
    });
}

function serveHTMLPage(res) {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
}

function serveChatData(res) {
    const chatData = fs.readFileSync(chatFilePath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(chatData);
}

function InsertToJson(location, data) {
    const chatFilePath = path.join(__dirname, location);
    const chatData = JSON.parse(fs.readFileSync(chatFilePath, 'utf8'));
    chatData.push(data);
    fs.writeFileSync(chatFilePath, JSON.stringify(chatData, null, 2), 'utf8');
}

function broadcastMessage(message, sourceClient) {
    wss.clients.forEach((client) => {
        if (client !== sourceClient && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function removeClient(client) {
    const index = Clients.indexOf(client);
    if (index !== -1) {
        Clients.splice(index, 1);
    }
}
