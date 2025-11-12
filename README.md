# StudentSpace

StudentSpace is a web platform designed for students and professors to collaborate efficiently on academic projects.  
It provides tools for managing graduation projects, tasks, reports, and communication between students and professors.

---

## Overview

The platform allows students to:  
- Browse available projects and graduation project history  
- Join teams and track assigned tasks  
- Submit reports and project updates  

Professors and supervisors can:  
- Create and assign tasks  
- Monitor project progress  
- Provide feedback and guidance  

The system supports multiple user roles (students, professors, supervisors, administration) and aims to streamline academic project management.

---

## Features

### Core Features
- User authentication and role management  
- Project repository with previous and ongoing projects  
- Task assignment and tracking system  
- Team collaboration and communication  
- Report submission and review  

### Technical Features
- Backend powered by Node.js and Express.js  
- PostgreSQL database for persistent data storage  
- Dynamic rendering using EJS templates  
- Password security using bcrypt  
- Authentication using Passport.js  

---

## Project Structure

```
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript, EJS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | Passport.js, bcrypt |
| Version Control | Git & GitHub |

---

## Setup and Usage

1. Clone the repository:  
git clone https://github.com/your-username/studentspace.git
cd studentspace

2. Install dependencies:
npm install

4. Set up PostgreSQL database:
Create the database and run the provided SQL scripts to create tables.

5.Start the server:
npm start

6. Open your browser at http://localhost:3000 to access the platform.

#Future Enhancements

Implement real-time notifications for tasks and reports

Advanced analytics and dashboards for professors and admins

Integration with cloud storage for file uploads

Improved user interface with responsive design
