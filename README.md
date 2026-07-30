# 🏋️‍♂️ Health Tracker & Fitness Gamification Platform

A modern, full-stack web application designed to track workouts, visualise progress, and gamify fitness through XP levels, dynamic achievements, and global leaderboards. Built for university submission.

---

## Key Features

* **Secure Authentication:** User registration and login utilising `bcrypt` password hashing and secure server-side sessions (`express-session`).
* **Robust Data Validation:** Regular expression (Regex) checks for email formats and password strength requirements, alongside intelligent input safeguards (such as the "Olympics" duration limit validator).
* **Gamification & Leveling Engine:** Automatically converts raw workout data (minutes and frequency) into Experience Points (XP) and dynamic user levels with a real-time progress bar.
* **Global Community Leaderboard:** Advanced SQL `JOIN` and aggregation queries (`SUM`, `GROUP BY`) to rank users across the platform by total workout minutes.
* **Interactive Data Visualization:** Integrates **Chart.js** via dynamic SQL grouping to render an animated doughnut chart breaking down time spent across different activity types.
* **Full CRUD Functionality:** Users can log new workouts, search through historical achievements with keyword filters, and securely delete their own entries.

---

## Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MySQL (relational schema with foreign key constraints)
* **Templating Engine:** EJS (Embedded JavaScript)
* **Frontend Styling:** Custom modern CSS (Flexbox, CSS Grid, Gradients, Cards layout)
* **Security/Utilities:** `bcrypt`, `express-session`, `mysql2`, `Chart.js`

---

## Getting Started & Installation

Follow these instructions to run the project locally on your machine.

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v16+ recommended)
* A local MySQL server (such as XAMPP, MySQL Workbench, or MySQL Server)

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd health-tracker