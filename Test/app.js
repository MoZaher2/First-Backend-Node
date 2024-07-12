const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb://localhost:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

// تعريف مخطط (Schema)
const logSchema = new mongoose.Schema({
    message: String
}, { capped: { size: 100000, max: 1000, autoIndexId: true } });

const Log = mongoose.model('Log', logSchema);

app.get('/logs', (req, res) => {
    const cursor = Log.find().tailable({ awaitData: true }).cursor();

    cursor.on('data', (doc) => {
        res.write(JSON.stringify(doc));
    });

    cursor.on('error', (err) => {
        console.error('Cursor error:', err);
        res.status(500).send('Error occurred');
    });

    cursor.on('close', () => {
        res.end();
    });
});

db.once('open', () => {
    console.log('Connected to database');
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
});




import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LogComponent = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const source = new EventSource('http://localhost:3000/logs');

        source.onmessage = (event) => {
            const newLog = JSON.parse(event.data);
            setLogs((prevLogs) => [...prevLogs, newLog]);
        };

        source.onerror = (err) => {
            console.error('EventSource failed:', err);
            source.close();
        };

        return () => {
            source.close();
        };
    }, []);

    return (
        <div>
            <h1>Logs</h1>
            <ul>
                {logs.map((log, index) => (
                    <li key={index}>{log.message}</li>
                ))}
            </ul>
        </div>
    );
};

export default LogComponent;

