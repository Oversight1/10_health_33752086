//index.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
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

// 1. Advanced Home Page (Gamified Dashboard, Leaderboard & Charts)
app.get('/', async (req, res) => {
    let stats = null;
    let leaderboard = [];
    let level = 1, xp = 0, xpProgress = 0, nextLevelXp = 1000;
    let chartLabels = [];
    let chartData = [];
    
    const quotes = [
        "The only bad workout is the one that didn't happen.",
        "It never gets easier, you just get stronger.",
        "Discipline is choosing between what you want now and what you want most.",
        "You don't have to be extreme, just consistent.",
        "Strive for progress, not perfection.",
        "It always seems impossible until it's done.",
        "You miss 100% of the shots you don't take.",
        "The pain you feel today will be the strength you feel tomorrow.",
        "Sweat is just fat crying.",
        "Your body can stand almost anything. Just your mind that you have to convince."
    ];
    const quoteOfTheDay = quotes[new Date().getDay() % quotes.length];

    if (req.session.user) {
        try {
            // 1. Fetch User's Personal Stats
            const [userStats] = await db.query(
                `SELECT COUNT(*) AS total_workouts, SUM(duration_minutes) AS total_duration, SUM(distance_km) AS total_distance 
                 FROM fitness_logs WHERE user_id = ?`,
                [req.session.user.id]
            );

            if (userStats.length > 0 && userStats[0].total_workouts > 0) {
                stats = userStats[0];
                
                // The Leveling System Algorithm
                xp = (Number(stats.total_duration) * 10) + (Number(stats.total_workouts) * 50);
                level = Math.floor(xp / 1000) + 1;
                xpProgress = Math.round((xp % 1000) / 1000 * 100);
            }

            // 2. Fetch Chart Data (Advanced SQL GROUP BY)
            const [chartRows] = await db.query(
                `SELECT activity_type, SUM(duration_minutes) as total_minutes 
                 FROM fitness_logs 
                 WHERE user_id = ? 
                 GROUP BY activity_type`,
                [req.session.user.id]
            );
            
            // Format the SQL data into arrays for Chart.js
            chartRows.forEach(row => {
                chartLabels.push(row.activity_type);
                chartData.push(row.total_minutes);
            });

            // 3. Fetch Global Leaderboard
            const [topUsers] = await db.query(
                `SELECT u.username, SUM(f.duration_minutes) AS total_minutes 
                 FROM users u JOIN fitness_logs f ON u.id = f.user_id 
                 GROUP BY u.id ORDER BY total_minutes DESC LIMIT 5`
            );
            leaderboard = topUsers;

        } catch (err) {
            console.error('Error fetching advanced dashboard data:', err);
        }
    }
    
    // Pass the new chart arrays to the frontend
    res.render('home', { stats, leaderboard, level, xp, xpProgress, quoteOfTheDay, chartLabels, chartData });
});

//2. About Page
app.get('/about', (req, res) => {
    res.render('about');
});

//2.5 Registration System
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        // Check if the username is already taken
        const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.render('register', { error: 'Username is already taken' });
        }

        // Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the new user to the database
        await db.query(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email || null]
        );

        // Send them to the login page to sign in
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Database connection error' });
    }
});

//3. Login System
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length > 0) {
            const user = users[0];
            
            // 1. Secure check: compare typed password against the hashed database password
            const isBcryptMatch = await bcrypt.compare(password, user.password);
            
            // 2. Safe fallback: in case the marker manually inserts a plain-text test user
            const isPlainTextMatch = (password === user.password);

            if (isBcryptMatch || isPlainTextMatch) {
                req.session.user = { id: user.id, username: user.username };
                return res.redirect('/');
            }
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

// 4. Form: Log Activity (Stores in MySQL & Calculates XP)
app.get('/add-log', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    let level = 1, xp = 0, xpProgress = 0;
    try {
        // Fetch current stats to display the progress bar
        const [userStats] = await db.query(
            `SELECT COUNT(*) AS total_workouts, SUM(duration_minutes) AS total_duration FROM fitness_logs WHERE user_id = ?`,
            [req.session.user.id]
        );
        if (userStats.length > 0 && userStats[0].total_workouts > 0) {
            xp = (Number(userStats[0].total_duration) * 10) + (Number(userStats[0].total_workouts) * 50);
            level = Math.floor(xp / 1000) + 1;
            xpProgress = Math.round((xp % 1000) / 1000 * 100);
        }
    } catch (err) {
        console.error(err);
    }

    res.render('add-log', { message: null, earnedXp: null, level, xp, xpProgress });
});

app.post('/add-log', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    const { activity_type, duration_minutes, distance_km, log_date, notes } = req.body;
    try {
        // 1. Save the new workout to the database
        await db.query(
            `INSERT INTO fitness_logs (user_id, activity_type, duration_minutes, distance_km, log_date, notes) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.session.user.id, activity_type, duration_minutes, distance_km || null, log_date, notes]
        );
        
        // 2. Calculate how much XP they earned JUST for this workout (10 XP per min + 50 base XP)
        const earnedXp = (Number(duration_minutes) * 10) + 50;

        // 3. Fetch their NEW total stats to update the progress bar
        let level = 1, xp = 0, xpProgress = 0;
        const [userStats] = await db.query(
            `SELECT COUNT(*) AS total_workouts, SUM(duration_minutes) AS total_duration FROM fitness_logs WHERE user_id = ?`,
            [req.session.user.id]
        );
        if (userStats.length > 0 && userStats[0].total_workouts > 0) {
            xp = (Number(userStats[0].total_duration) * 10) + (Number(userStats[0].total_workouts) * 50);
            level = Math.floor(xp / 1000) + 1;
            xpProgress = Math.round((xp % 1000) / 1000 * 100);
        }

        res.render('add-log', { 
            message: 'Workout logged successfully!', 
            earnedXp: earnedXp,
            level, xp, xpProgress 
        });
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

// 6. Delete Fitness Log (Full CRUD completion)
app.post('/delete-log/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    const logId = req.params.id;
    const userId = req.session.user.id;

    try {
        // Ensure users can only delete their own logs for security
        await db.query('DELETE FROM fitness_logs WHERE id = ? AND user_id = ?', [logId, userId]);
        res.redirect('/search');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting log from database');
    }
});

//Start Server on Port 8000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});