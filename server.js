const express = require('express');
const userRoutes = require('./routes/userRoutes');
const urlRoutes = require('./routes/urlRoutes');

const app = express();

app.use(express.json());

app.use('/users', userRoutes);
app.use('/url', urlRoutes);

app.use((req, res, next) => {
    res.status(404).send('Not Found');
});

const port = 3000;
app.listen(port,'0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

app.use('/uploads', express.static('uploads'));  