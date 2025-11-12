import express from "express";
import bodyParser from "body-parser";
import path from "path";
import multer from "multer";
import env from "dotenv";
import { fileURLToPath } from "url";

env.config();

const app = express();
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add CORS headers for API calls
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

export default function taskRoutes(app, db, isAuthenticated) {
    // Serve task page based on user role
    app.get("/universe/tasks", isAuthenticated, async(req, res) => {
        try {
            const userResult = await db.query(
                "SELECT role FROM users WHERE id = $1", [req.user.id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).send("User not found");
            }

            const userRole = userResult.rows[0].role;
            const page = userRole === 'professor' || userRole === 'supervisor' ?
                'task-teacher.html' :
                'task.html';

            res.sendFile(path.join(__dirname, 'public', page));

        } catch (error) {
            console.error('Error checking user role:', error);
            res.status(500).send('Internal server error');
        }
    });

    // Fixed approved endpoint
    app.get("/approved", async(req, res) => {
        try {
            console.log('📡 /approved endpoint called');

            const [totalTasks, approvedTasks] = await Promise.all([
                db.query("SELECT COUNT(*) FROM tasks"),
                db.query("SELECT COUNT(*) FROM tasks WHERE status = 'completed' OR feedback = 'completed'")
            ]);

            const total = parseInt(totalTasks.rows[0].count, 10);
            const approved = parseInt(approvedTasks.rows[0].count, 10);
            const approvedPercentage = total > 0 ? (approved * 100) / total : 0;

            console.log('📊 Approved stats:', { total, approved, approvedPercentage });

            res.json({
                approvedPercentage: parseFloat(approvedPercentage.toFixed(2))
            });
        } catch (err) {
            console.error("❌ Error in /approved:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // File upload endpoint
    app.post("/upload-file/:taskId", upload.single("file"), async(req, res) => {
        const { taskId } = req.params;
        console.log('📁 File upload for task:', taskId);

        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const filePath = `/uploads/${req.file.filename}`;
            console.log('📁 Saving file path:', filePath);

            await db.query(
                "UPDATE tasks SET file_path = $1 WHERE task_id = $2", [filePath, taskId]
            );

            console.log('✅ File upload successful');
            res.json({
                message: "File uploaded and path saved",
                filePath
            });
        } catch (err) {
            console.error("❌ Error uploading file:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // Fixed task statistics endpoint
    app.get("/task-stats", async(req, res) => {
        try {
            console.log('📡 /task-stats endpoint called');

            const [all, pending, canceled, progress, completed] = await Promise.all([
                db.query("SELECT COUNT(*) FROM tasks"),
                db.query("SELECT COUNT(*) FROM tasks WHERE status = 'pending'"),
                db.query("SELECT COUNT(*) FROM tasks WHERE feedback = 'canceled'"),
                db.query("SELECT COUNT(*) FROM tasks WHERE status = 'in progress'"),
                db.query("SELECT COUNT(*) FROM tasks WHERE status = 'completed'")
            ]);

            const total = parseInt(all.rows[0].count);
            console.log('📊 Total tasks:', total);

            if (total === 0) {
                return res.json({
                    pending: 0,
                    canceled: 0,
                    progress: 0,
                    completed: 0,
                });
            }

            const stats = {
                pending: (parseInt(pending.rows[0].count) * 100) / total,
                canceled: (parseInt(canceled.rows[0].count) * 100) / total,
                progress: (parseInt(progress.rows[0].count) * 100) / total,
                completed: (parseInt(completed.rows[0].count) * 100) / total,
            };

            console.log('📊 Task stats:', stats);
            res.json(stats);
        } catch (err) {
            console.error("❌ Error in /task-stats:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // Fixed task details - NOW INCLUDES task_id
    app.get("/task-details", async(req, res) => {
        try {
            console.log('📡 /task-details endpoint called');

            const result = await db.query(`
                SELECT task_id, title, deadline, status
                FROM tasks
                ORDER BY deadline ASC
            `);

            console.log('📊 Found tasks:', result.rows.length);
            res.json(result.rows.length ? result.rows : []);
        } catch (err) {
            console.error("❌ Error fetching task details:", err);
            res.status(500).json({ error: "Failed to fetch task details." });
        }
    });

    // Fixed full task details
    app.get("/task-full-details", async(req, res) => {
        try {
            console.log('📡 /task-full-details endpoint called');

            const result = await db.query(`
                SELECT task_id, title, deadline, status, feedback_text
                FROM tasks
                ORDER BY deadline ASC
            `);

            console.log('📊 Found full task details:', result.rows.length);
            res.json(result.rows.length ? result.rows : []);
        } catch (err) {
            console.error("❌ Error fetching full task details:", err);
            res.status(500).json({ error: "Failed to fetch full task details." });
        }
    });
    app.get('/current-user-id', (req, res) => {
        if (req.session.userId) {
            res.json({ userId: req.session.userId });
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    });
    // Fixed project team information
    app.get("/project-team/:id", async(req, res) => {
        const projectId = req.params.id;
        console.log('📡 /project-team called for project:', projectId);

        try {
            const result = await db.query(`
                SELECT 
                    users.full_name,
                    projects.title,
                    projects.idea
                FROM projects
                JOIN teams ON projects.team_id = teams.team_id
                JOIN team_members ON teams.team_id = team_members.team_id
                JOIN users ON team_members.u_id = users.id
                WHERE projects.project_id = $1
            `, [projectId]);

            console.log('📊 Found team members:', result.rows.length);
            res.json(result.rows.length ? result.rows : []);
        } catch (err) {
            console.error("❌ Error fetching team info:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // Calendar events for a project
    app.get("/calendar-events/:projectId", async(req, res) => {
        const { projectId } = req.params;
        console.log('📡 /calendar-events called for project:', projectId);

        try {
            const result = await db.query(
                "SELECT title, event_type, event_date FROM events WHERE project_id = $1 ORDER BY event_date ASC", [projectId]
            );

            console.log('📊 Found calendar events:', result.rows.length);
            res.json(result.rows);
        } catch (err) {
            console.error("❌ Error fetching calendar events:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    // Assuming you're using a database library like pg (PostgreSQL), mysql, etc.
    app.get('/api/user-profile/:userId', async(req, res) => {
        try {
            const userId = req.params.userId;

            // Query to join users and students tables
            const query = `
            SELECT 
                p.pfp, 
                u.full_name, 
                u.role, 
                s.year
            FROM 
                users u
            LEFT JOIN 
                students s ON u.id = s.u_id
            LEFT JOIN
                profiles p ON u.id = p.u_id
            WHERE 
                u.id = $1
        `;

            const result = await db.query(query, [userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const userData = result.rows[0];
            res.json({
                profileImage: userData.pfp || '/default-profile.jpg',
                name: userData.full_name,
                role: userData.role,
                year: userData.year || 'N/A' // Default if null
            });

        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    app.get('/api/supervisor/profile/:userId', async(req, res) => {
        try {
            const { userId } = req.params;
            const result = await pool.query(`
            SELECT u.user_id, u.full_name, u.email, u.pfp, u.role, 
                   s.specialization, s.department
            FROM users u
            JOIN supervisors s ON u.user_id = s.user_id
            WHERE u.user_id = $1
        `, [userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Supervisor not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // 2. Get All Supervised Projects
    app.get('/api/supervisor/projects/:userId', async(req, res) => {
        try {
            const { userId } = req.params;
            const result = await pool.query(`
            SELECT p.project_id, p.title, p.description, p.status,
                   p.start_date, p.deadline, COUNT(t.team_id) as team_count
            FROM projects p
            JOIN project_supervisors ps ON p.project_id = ps.project_id
            LEFT JOIN teams t ON p.project_id = t.project_id
            WHERE ps.supervisor_id = $1
            GROUP BY p.project_id
            ORDER BY p.deadline ASC
        `, [userId]);

            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // 3. Get Teams for a Project
    app.get('/api/supervisor/project-teams/:projectId', async(req, res) => {
        try {
            const { projectId } = req.params;
            const result = await pool.query(`
            SELECT t.team_id, t.team_name, 
                   COUNT(tm.user_id) as member_count,
                   STRING_AGG(u.full_name, ', ') as members
            FROM teams t
            JOIN team_members tm ON t.team_id = tm.team_id
            JOIN users u ON tm.user_id = u.user_id
            WHERE t.project_id = $1
            GROUP BY t.team_id
        `, [projectId]);

            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // 4. Get Tasks for a Team
    app.get('/api/supervisor/team-tasks/:teamId', async(req, res) => {
        try {
            const { teamId } = req.params;
            const result = await pool.query(`
            SELECT t.task_id, t.title, t.description, t.status,
                   t.deadline, t.created_at, 
                   u.full_name as assigned_to,
                   COUNT(s.submission_id) as submission_count
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.user_id
            LEFT JOIN submissions s ON t.task_id = s.task_id
            WHERE t.team_id = $1
            GROUP BY t.task_id, u.full_name
            ORDER BY t.deadline ASC
        `, [teamId]);

            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // 5. Get Task Submissions
    app.get('/api/supervisor/task-submissions/:taskId', async(req, res) => {
        try {
            const { taskId } = req.params;
            const result = await pool.query(`
            SELECT s.submission_id, s.file_path, s.submitted_at,
                   s.feedback, s.grade, u.full_name as submitted_by
            FROM submissions s
            JOIN users u ON s.submitted_by = u.user_id
            WHERE s.task_id = $1
            ORDER BY s.submitted_at DESC
        `, [taskId]);

            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // 6. Submit Feedback for a Task
    app.post('/api/supervisor/task-feedback', async(req, res) => {
        try {
            const { taskId, feedback, grade } = req.body;
            await pool.query(`
            UPDATE submissions
            SET feedback = $1, grade = $2
            WHERE task_id = $3
        `, [feedback, grade, taskId]);

            res.json({ message: 'Feedback submitted successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

}