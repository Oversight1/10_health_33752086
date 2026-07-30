USE health;

-- 1. Turn OFF safe updates temporarily
SET SQL_SAFE_UPDATES = 0;

-- 2. Clear previous test data
DELETE FROM fitness_logs;
DELETE FROM users;

-- 3. Turn safe updates back ON
SET SQL_SAFE_UPDATES = 1;

-- Insert default user required by the brief
-- Username: gold | Password: smiths123ABC$ (Hashed with bcrypt)
INSERT INTO users (id, username, password, email) 
VALUES (1, 'gold', '$2b$10$itVu7cb5HFjFfIm.vd1htuhZiAFMXbgKefGQ96gQ7F7saXHMgX/1G', 'gold@goldsmiths.ac.uk');

-- Insert initial sample fitness logs
INSERT INTO fitness_logs (user_id, activity_type, duration_minutes, distance_km, log_date, notes)
VALUES 
(1, 'Running', 30, 5.00, '2026-07-20', 'Morning run around the park. Felt energetic!'),
(1, 'Cycling', 45, 12.50, '2026-07-22', 'Evening ride along the river.'),
(1, 'Swimming', 40, 1.50, '2026-07-25', 'Laps at the community pool.');