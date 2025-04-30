import path from "path";
import multer from "multer";
import fs from "fs";

// Make sure the uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Folder to store images
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        cb(null, filename); // Save file with timestamp-based filename
    }
});

const upload = multer({ storage: storage });

export default function(app, db, isAuthenticated, __dirname) {
    // GET /homepage - Display posts and render homepage view
    app.get("/homepage", isAuthenticated, async(req, res) => {
        try {
            const result = await db.query(`
                SELECT posts.id, posts.post_date, posts.content, posts.image_url, posts.tags,
                    users.full_name AS username,
                    profiles.pfp AS user_pfp
                FROM posts
                JOIN users ON posts.user_id = users.id
                JOIN profiles ON profiles.u_id = users.id
                ORDER BY post_date DESC;
            `);

            if (req.headers.accept === "application/json") {
                return res.json({ user: req.user, posts: result.rows });
            }

            // Render homepage with posts data in HTML format
            res.sendFile(path.join(__dirname, "public", "index.html")); // adjust path if needed
        } catch (err) {
            console.error("Error loading homepage:", err);
            res.status(500).json({ error: "Failed to load homepage" });
        }
    });

    // OPTION 1: Handle form submission from the original form action
    app.post("/homepage", isAuthenticated, upload.single("image"), async(req, res) => {
        try {
            // Extract data from form submission
            const { content } = req.body;
            const tags = req.body.topic || "General"; // Use the topic field from your form
            const user_id = req.user.id;
            const image_url = req.file ? `/uploads/${req.file.filename}` : null;

            // Insert into database
            const result = await db.query(
                `INSERT INTO posts (user_id, content, image_url, tags)
                VALUES ($1, $2, $3, $4) RETURNING *`, [user_id, content, image_url, tags]
            );

            // Redirect back to homepage after submission
            res.redirect("/homepage");
        } catch (err) {
            console.error("Error creating post:", err);
            res.status(500).json({ error: "Failed to create post" });
        }
    });


    // Add debugging endpoint to check if uploads directory exists
    app.get("/debug/uploads", (req, res) => {
        const uploadsPath = path.join(process.cwd(), "uploads");
        const exists = fs.existsSync(uploadsPath);
        res.json({
            uploadsPathExists: exists,
            uploadsPath: uploadsPath,
            cwd: process.cwd()
        });
    });
}