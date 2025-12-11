USE health;

-- Insert the required admin user 
-- Using bycrpt
-- The hash below is for password: 'smiths'
INSERT INTO users (username, first_name, last_name, email, password) VALUES 
('gold', 'Admin', 'User', 'gold@gold.ac.uk', '$2b$10$5N/v.N7.z5.k5.u5.y5.uO5.u5.u5.u5.u5.u5.u5.u5.u5'); 

-- Insert some dummy workouts for the chart visualization
INSERT INTO workouts (user_id, activity_type, duration_minutes, calories_burned, date_logged, intensity) VALUES 
(1, 'Running', 30, 300, CURDATE() - INTERVAL 5 DAY, 'High'),
(1, 'Cycling', 45, 400, CURDATE() - INTERVAL 4 DAY, 'Medium'),
(1, 'Swimming', 60, 500, CURDATE() - INTERVAL 3 DAY, 'High'),
(1, 'Running', 25, 250, CURDATE() - INTERVAL 2 DAY, 'Medium'),
(1, 'Yoga', 40, 150, CURDATE() - INTERVAL 1 DAY, 'Low');