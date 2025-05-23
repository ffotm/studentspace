import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

export default function(app, db, isAuthenticated, __dirname) {
    const router = express.Router();

    // Middleware to attach db to req
    router.use((req, res, next) => {
        req.db = db; // Now req.db.query() will work
        next();
    });
    const isAdmin = (req, res, next) => {
        if (req.isAuthenticated() && req.user.role === 'admin') {
            return next();
        }
        res.status(403).send("Access denied. Admins only.");
    };

    // Dashboard data endpoint
    router.get("/dashboard", isAdmin, async(req, res) => {
        try {
            // Get all statistics in a single query for efficiency
            const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'teacher') AS teachers,
                (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
                (SELECT COUNT(*) FROM reports WHERE status = 'Pending') AS pending_reports
        `;

            const statsResult = await req.db.query(statsQuery);
            const stats = statsResult.rows[0];

            res.json({
                teachers: stats.teachers,
                students: stats.students,
                totalUsers: parseInt(stats.teachers) + parseInt(stats.students),
                pendingReports: stats.pending_reports
            });
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            res.status(500).json({ error: "Failed to fetch dashboard statistics" });
        }
    });
    router.get("/admin/dashboard", isAdmin, (req, res) => {
        res.sendFile(path.join(__dirname, "admin-pages-1", "dashboard.html"));
    });
    // Reports management endpoints
    router.get("/api/reports", isAdmin, async(req, res) => {
        try {
            const reportsQuery = `
            SELECT 
                r.id, r.content, r.reason, r.status, r.created_at,
                reporter.full_name AS reporter_name, reporter.email AS reporter_email,
                reported_user.full_name AS reported_user_name, reported_user.email AS reported_user_email
            FROM reports r
            JOIN users reporter ON r.reporter_id = reporter.id
            JOIN users reported_user ON r.reported_user_id = reported_user.id
            ORDER BY r.created_at DESC
            LIMIT 50
        `;

            const reportsResult = await req.db.query(reportsQuery);
            res.json(reportsResult.rows);
        } catch (err) {
            console.error("Error fetching reports:", err);
            res.status(500).json({ error: "Failed to fetch reports" });
        }
    });

    router.put("/api/reports/:id", isAdmin, async(req, res) => {
        const { id } = req.params;
        const { action } = req.body;

        try {
            // Validate action
            if (!['resolve', 'reject'].includes(action)) {
                return res.status(400).json({ error: "Invalid action" });
            }

            const status = action === 'resolve' ? 'Resolved' : 'Rejected';

            const updateResult = await req.db.query(
                "UPDATE reports SET status = $1 WHERE id = $2 RETURNING *", [status, id]
            );

            if (updateResult.rows.length === 0) {
                return res.status(404).json({ error: "Report not found" });
            }

            res.json(updateResult.rows[0]);
        } catch (err) {
            console.error("Error updating report:", err);
            res.status(500).json({ error: "Failed to update report" });
        }
    });

    // User management endpoints
    router.get("/api/users/:role", isAdmin, async(req, res) => {
        const { role } = req.params;
        const validRoles = ['student', 'teacher'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role specified" });
        }

        try {
            const usersQuery = `
            SELECT 
                u.id, u.full_name, u.email, u.created_at,
                p.pfp, p.bio,
                ${role === 'student' ? 's.major, s.year' : 't.department, t.position'}
            FROM users u
            JOIN profiles p ON u.id = p.u_id
            ${role === 'student' ? 'LEFT JOIN students s ON u.id = s.user_id' : 'LEFT JOIN teachers t ON u.id = t.user_id'}
            WHERE u.role = $1
            ORDER BY u.created_at DESC
        `;

            const usersResult = await req.db.query(usersQuery, [role]);
            res.json(usersResult.rows);
        } catch (err) {
            console.error(`Error fetching ${role}s:`, err);
            res.status(500).json({ error: `Failed to fetch ${role}s` });
        }
    });

    router.delete("/api/users/:id", isAdmin, async(req, res) => {
        const { id } = req.params;

        try {
            // Start transaction
            await req.db.query('BEGIN');

            // First check if user exists and get their role
            const userCheck = await req.db.query(
                "SELECT role FROM users WHERE id = $1", [id]
            );

            if (userCheck.rows.length === 0) {
                await req.db.query('ROLLBACK');
                return res.status(404).json({ error: "User not found" });
            }

            const role = userCheck.rows[0].role;

            // Delete from role-specific table first
            if (role === 'student') {
                await req.db.query(
                    "DELETE FROM students WHERE user_id = $1", [id]
                );
            } else if (role === 'teacher') {
                await req.db.query(
                    "DELETE FROM teachers WHERE user_id = $1", [id]
                );
            }

            // Delete profile
            await req.db.query(
                "DELETE FROM profiles WHERE u_id = $1", [id]
            );

            // Finally delete user
            await req.db.query(
                "DELETE FROM users WHERE id = $1", [id]
            );

            await req.db.query('COMMIT');
            res.json({ success: true });
        } catch (err) {
            await req.db.query('ROLLBACK');
            console.error("Error deleting user:", err);
            res.status(500).json({ error: "Failed to delete user" });
        }
    });

    router.get("/admin/home", isAdmin, (req, res) => {
        res.sendFile(path.join(__dirname, "admin-pages-1", "home.html"));
    });


    router.get("/students", isAdmin, async(req, res) => {
        try {
            const studentsQuery = `
            SELECT 
                u.id, u.full_name, u.email,
                p.pfp,
                s.major, s.year
            FROM users u
            JOIN profiles p ON u.id = p.u_id
            LEFT JOIN students s ON u.id = s.u_id
            WHERE u.role = 'student'
        `;

            const studentsResult = await req.db.query(studentsQuery);
            res.json(studentsResult.rows);
        } catch (err) {
            console.error("Error fetching students:", err);
            res.status(500).json({ error: "Failed to fetch students" });
        }
    });
    router.get("/admin/students", isAdmin, (req, res) => {
        res.sendFile(path.join(__dirname, "admin-pages-1", "students.html"));
    });
    // Delete student endpoint
    router.delete("/students/:id", isAdmin, async(req, res) => {
        const { id } = req.params;

        try {
            // Start transaction
            await req.db.query('BEGIN');

            // Check if user exists and is a student
            const userCheck = await req.db.query(
                "SELECT role FROM users WHERE id = $1 AND role = 'student'", [id]
            );

            if (userCheck.rows.length === 0) {
                await req.db.query('ROLLBACK');
                return res.status(404).json({ error: "Student not found" });
            }

            // Delete from students table
            await req.db.query("DELETE FROM students WHERE user_id = $1", [id]);

            // Delete profile
            await req.db.query("DELETE FROM profiles WHERE u_id = $1", [id]);

            // Delete user
            await req.db.query("DELETE FROM users WHERE id = $1", [id]);

            await req.db.query('COMMIT');
            res.json({ success: true, message: "Student deleted successfully" });
        } catch (err) {
            await req.db.query('ROLLBACK');
            console.error("Error deleting student:", err);
            res.status(500).json({ error: "Failed to delete student" });
        }
    });
    router.get("/teachers", isAdmin, async(req, res) => {
        try {
            const teachersQuery = `
            SELECT 
                u.id, u.full_name, u.email,
                p.pfp,
                pr.department
            FROM users u
            JOIN profiles p ON u.id = p.u_id
            LEFT JOIN professors pr ON u.id = pr.u_id
            WHERE u.role = 'professor' 
        `;

            const teachersResult = await req.db.query(teachersQuery);
            res.json(teachersResult.rows);
        } catch (err) {
            console.error("Error fetching students:", err);
            res.status(500).json({ error: "Failed to fetch students" });
        }
    });
    router.get("/admin/teachers", isAdmin, (req, res) => {
        res.sendFile(path.join(__dirname, "admin-pages-1", "teachers.html"));
    });
    router.post("/teachers", isAdmin, async(req, res) => {
        const client = await pool.connect();

        try {
            const { full_name, email, password, department } = req.body;

            // Validate input
            if (!full_name || !email || !password) {
                return res.status(400).json({ error: "Full name, email, and password are required" });
            }

            await client.query('BEGIN');

            // Check if user already exists
            const userCheck = await client.query(
                'SELECT id FROM users WHERE email = $1', [email]
            );

            if (userCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: "Teacher with this email already exists" });
            }

            // Hash password (using bcrypt)
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insert user
            const userInsert = await client.query(
                `INSERT INTO users (full_name, email, password_hash, role)
             VALUES ($1, $2, $3, 'professor')
             RETURNING id`, [full_name, email, passwordHash]
            );
            const userId = userInsert.rows[0].id;

            // Insert profile
            await client.query(
                `INSERT INTO profiles (u_id, pfp)
             VALUES ($1, 'default-profile.png')`, [userId]
            );

            // Insert professor
            await client.query(
                `INSERT INTO professors (u_id, department)
             VALUES ($1, $2)`, [userId, department || null]
            );

            await client.query('COMMIT');

            res.status(201).json({
                message: "Teacher created successfully",
                teacher: { id: userId, full_name, email, department }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Error creating teacher:", err);
            res.status(500).json({ error: "Failed to create teacher" });
        } finally {
            client.release();
        }
    });

    // Serve admin teachers page
    router.get("/admin/teachers", isAdmin, (req, res) => {
        res.sendFile(path.join(__dirname, "..", "admin-pages-1", "teachers.html"));
    });


    app.use("/", router);
};