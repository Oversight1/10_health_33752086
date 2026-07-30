//index.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;

//Set up EJS View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secretkey',
    resave: false,
    saveUninitialized: false
}));

//Make user session available to all EJS templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

//-----------ROUTES-----------------------

//1. Home Page
app.get('/', (req, res) => {
    res.render('home');
});

//2. About Page
app.get('/about', (req, res) => {
    res.render('about');
});

//3. Login System
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length > 0 && users[0].password === password) {
            req.session.user = users[0];
            return res.redirect('/');
        }
        res.render('login', { error: 'Invalid username or password' });
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Database connection error' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

//4. Form: Log Activity (Stores in MySQL)
app.get('/add-log', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('add-log', { message: null });
});

app.post('/add-log', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    const { activity_type, duration_minutes, distance_km, log_date, notes } = req.body;
    try {
        await db.query(
            `INSERT INTO fitness_logs (user_id, activity_type, duration_minutes, distance_km, log_date, notes) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.session.user.id, activity_type, duration_minutes, distance_km || null, log_date, notes]
        );
        res.render('add-log', { message: 'Fitness achievement logged successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving data to database');
    }
});

//5. Database Search
app.get('/search', async (req, res) => {
    const keyword = req.query.q || '';
    let results = [];
    
    if (keyword) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM fitness_logs WHERE activity_type LIKE ? OR notes LIKE ? ORDER BY log_date DESC`,
                [`%${keyword}%`, `%${keyword}%`]
            );
            results = rows;
        } catch (err) {
            console.error(err);
        }
    }
    res.render('search', { keyword, results });
});

//Start Server on Port 8000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});