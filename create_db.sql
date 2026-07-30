-- 1. Create the database and select it
CREATE DATABASE IF NOT EXISTS health;
USE health;

-- 2. Drop existing tables to ensure a clean slate
DROP TABLE IF EXISTS fitness_logs;
DROP TABLE IF EXISTS users;

-- 3. Create the users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create the fitness_logs table
CREATE TABLE fitness_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    duration_minutes INT NOT NULL,
    distance_km DECIMAL(5,2),
    log_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);