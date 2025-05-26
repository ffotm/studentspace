import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads', 'announcements');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'announcement-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});
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
                (SELECT COUNT(*) FROM users WHERE role = 'professor') AS professors,
                (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
                (SELECT COUNT(*) FROM reports WHERE status = 'Pending') AS pending_reports
        `;

            const statsResult = await req.db.query(statsQuery);
            const stats = statsResult.rows[0];

            res.json({
                professors: stats.professors,
                students: stats.students,
                totalUsers: parseInt(stats.professors) + parseInt(stats.students),
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

    // GET endpoint - Serve the HTML page
    router.get("/admin/home", isAdmin, (req, res) => {
        res.sendFile(path.join(__dirname, "admin-pages-1", "home.html"));
    });

    router.post("/admin/home", isAdmin, upload.single('image'), async(req, res) => {
        try {
            const { text, major, year } = req.body;

            console.log('Received data:', { text, major, year, hasFile: !!req.file });

            // Validate required fields
            if (!text || text.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Announcement text is required'
                });
            }

            if (!major || major.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Major is required'
                });
            }

            if (!year || isNaN(parseInt(year))) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid year is required'
                });
            }

            // Get admin info from session
            const adminId = 1;
            const adminName = 'Admin';

            // Handle image path
            let imageUrl = null;
            if (req.file) {
                imageUrl = '/uploads/home/' + req.file.filename;
            }

            // Create content that includes both text and image
            let fullContent = text.trim();
            if (imageUrl) {
                fullContent = JSON.stringify({
                    text: text.trim(),
                    image: imageUrl
                });
            }

            // Insert announcement into database - including major and year
            const query = `
            INSERT INTO announcements (title, content, posted_by, major, year, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *
        `;

            const result = await db.query(query, [
                `${adminName} - ${major} Year ${year}`, // $1
                fullContent, // $2
                adminId, // $3
                major.trim(), // $4
                parseInt(year) // $5
            ]);

            console.log('Announcement created successfully:', result.rows[0]);

            res.status(201).json({
                success: true,
                message: 'Announcement posted successfully',
                announcement: result.rows[0]
            });

        } catch (error) {
            console.error('Error creating announcement:', error);
            console.error('Error stack:', error.stack);

            // Clean up uploaded file if database insert failed
            if (req.file) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to post announcement',
                error: error.message
            });
        }
    });

    // GET endpoint for retrieving announcements (API)
    router.get("/admin/announcements", isAdmin, async(req, res) => {
        try {
            const query = `
            SELECT id, title, content, posted_by, created_at, updated_at, major, year
            FROM announcements 
            ORDER BY created_at DESC
        `;

            const result = await db.query(query);

            // Parse content field to separate text and image
            const parsedAnnouncements = result.rows.map(announcement => {
                let parsedContent;
                try {
                    parsedContent = JSON.parse(announcement.content);
                    return {
                        ...announcement,
                        text: parsedContent.text || announcement.content,
                        image: parsedContent.image || null
                    };
                } catch (e) {
                    // If content is not JSON, treat as plain text
                    return {
                        ...announcement,
                        text: announcement.content,
                        image: null
                    };
                }
            });

            res.json({
                success: true,
                announcements: parsedAnnouncements
            });

        } catch (error) {
            console.error('Error fetching announcements:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch announcements',
                error: error.message
            });
        }
    });

    // GET endpoint for public announcements (for students/teachers)
    router.get("/announcements", async(req, res) => {
        try {
            const query = `
            SELECT id, title, content, created_at, major, year
            FROM announcements 
            ORDER BY created_at DESC
            LIMIT 20
        `;

            const result = await db.query(query);

            // Parse content field to separate text and image
            const parsedAnnouncements = result.rows.map(announcement => {
                let parsedContent;
                try {
                    parsedContent = JSON.parse(announcement.content);
                    return {
                        ...announcement,
                        text: parsedContent.text || announcement.content,
                        image: parsedContent.image || null
                    };
                } catch (e) {
                    // If content is not JSON, treat as plain text
                    return {
                        ...announcement,
                        text: announcement.content,
                        image: null
                    };
                }
            });

            res.json({
                success: true,
                announcements: parsedAnnouncements
            });

        } catch (error) {
            console.error('Error fetching public announcements:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch announcements'
            });
        }
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
