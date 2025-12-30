const express = require('express');
const app = express();
const router = require('./routing/Router');
const hostname = '127.0.0.1';
const port = 3000;

const { Campaign, Group, Donation } = require('./DAL/models/db');

app.use(express.json());
app.use(express.static('CLIENT'));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    next();
});

app.use('/api/campaign', router);


app.use((req, res) => {
    res.status(404).json({ error: "הנתיב המבוקש לא נמצא" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "קרתה שגיאה פנימית בשרת" });
});


app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log("Ready to receive donations!");
});
