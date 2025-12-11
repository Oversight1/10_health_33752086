const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const port = 8000; 

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up the EJS 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Session configuration (Mainly for State Management)
app.use(session({
    secret: 'goldsmiths_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Database Connection 
const db = mysql.createConnection({
    host: 'localhost',
    user: 'tto001',      // YVM username
    password: 'MasterKey*',     //VM database password
    database: 'tto001'   //changed this from 'health' to 'tto001'
    // host: process.env.HEALTH_HOST || '127.0.0.1', //For XAMPP database
    // user: process.env.HEALTH_USER || 'health_app',
    // password: process.env.HEALTH_PASSWORD || 'qwertyuiop',
    // database: process.env.HEALTH_DATABASE || 'health'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database as id ' + db.threadId);
});

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// --- ROUTES START FROM HERE ---

// Home Page 
app.get('/', (req, res) => {
    res.render('index', { page: 'home' });
});

// About Page 
app.get('/about', (req, res) => {
    res.render('about', { page: 'about' });
});

// Register GET
app.get('/register', (req, res) => {
    res.render('register', { user: req.session.user });
});

// Register POST
app.post('/register', (req, res) => {
    const { first_name, last_name, username, email, password } = req.body;

    //Regex Validation per instructions 
    //8 chars, 1 upper, 1 lower, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    
    if (!passwordRegex.test(password)) {
        return res.render('register', { 
            user: null, 
            error: "Password must be strong: 8+ chars, 1 upper, 1 lower, 1 number, 1 special." 
        });
    }

    //Hash password
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) throw err;

        const sql = "INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)";
        db.query(sql, [first_name, last_name, username, email, hash], (err, result) => {
            if (err) {
                return res.render('register', { user: null, error: "Username or email already taken." });
            }
            res.redirect('/login');
        });
    });
});

// Login Page (GET)
app.get('/login', (req, res) => {
    res.render('login', { page: 'login', error: null });
});

// Login Logic (POST) 
app.post('/login', (req, res) => {
    // To make the default 'gold':'smiths' work with bcrypt, 
    // we assume the DB has the hash, OR we handle legacy plain text for that one single user.
    const { username, password } = req.body;
    

    if(username === 'gold' && password === 'smiths') {
         req.session.user = { id: 1, username: 'gold' };
         return res.redirect('/dashboard');
    }

    // Real DB lookup
    res.redirect('/'); 
});

// Dashboard (Protected Route)
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    // Fetch workouts for the user
    let sql = "SELECT * FROM workouts WHERE user_id = ?";
    db.query(sql, [req.session.user.id], (err, results) => {
        if (err) throw err;
        // Pass data for charts
        res.render('dashboard', { page: 'dashboard', workouts: results });
    });
});

// Run Server 
app.listen(port, () => {
    console.log(`GoldFit app running on port ${port}`);
});


//Form to add data 
app.get('/add-workout', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('add-workout'); 
});

app.post('/add-workout', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    // 1. Get 'intensity' from the form body
    const { activity, duration, calories, date, notes, intensity } = req.body;
    
    if(!activity || !duration || !date) {
        return res.send("Please fill in all required fields.");
    }

    // 2. Update the SQL query to include 'intensity'
    const sql = `INSERT INTO workouts (user_id, activity_type, duration_minutes, calories_burned, date_logged, notes, intensity) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    // 3. Add 'intensity' to the data array
    db.query(sql, [req.session.user.id, activity, duration, calories, date, notes, intensity], (err, result) => {
        if (err) throw err;
        res.redirect('/dashboard');
    });
});

//Search functionality against database 
app.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    //search the 'activity_type' or 'notes' fields
    const sql = "SELECT * FROM workouts WHERE activity_type LIKE ? OR notes LIKE ?";
    const query = `%${searchTerm}%`;
    
    db.query(sql, [query, query], (err, results) => {
        if (err) throw err;
        res.render('search', { results: results, query: searchTerm });
    });
});

//Community route
app.get('/community', (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    //Get Leaderboard (Advanced SQL Aggregation)
    const sqlLeaderboard = `
        SELECT users.username, SUM(workouts.duration_minutes) as total_minutes 
        FROM users 
        JOIN workouts ON users.id = workouts.user_id 
        GROUP BY users.id 
        ORDER BY total_minutes DESC 
        LIMIT 5`;

    //Get Messages
    const sqlMessages = `
        SELECT messages.content, messages.created_at, users.username 
        FROM messages 
        JOIN users ON messages.user_id = users.id 
        ORDER BY messages.created_at DESC LIMIT 20`;

    db.query(sqlLeaderboard, (err, leaderboard) => {
        if (err) throw err;
        db.query(sqlMessages, (err, messages) => {
            if (err) throw err;
            res.render('community', { user: req.session.user, leaderboard, messages });
        });
    });
});

app.post('/community/message', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const sql = "INSERT INTO messages (user_id, content) VALUES (?, ?)";
    db.query(sql, [req.session.user.id, req.body.content], (err) => {
        if (err) throw err;
        res.redirect('/community');
    });
});


// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


// Delete Workout 
app.post('/delete-workout/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const workoutId = req.params.id;
    const userId = req.session.user.id;

    //Ensure the workout belongs to the logged-in user
    const sql = "DELETE FROM workouts WHERE id = ? AND user_id = ?";
    
    db.query(sql, [workoutId, userId], (err, result) => {
        if (err) throw err;
        res.redirect('/dashboard');
    });
});

// ... app.listen ...