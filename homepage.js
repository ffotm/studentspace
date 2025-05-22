import path from "path";
import multer from "multer";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

export default function(app, db, isAuthenticated, __dirname) {

    app.get("/homepage", isAuthenticated, async(req, res) => {
        try {
            const result = await db.query(`
                SELECT posts.id, posts.post_date, posts.content, posts.image_url, posts.tags, posts.likes,
                    users.full_name AS username,
                    profiles.pfp AS user_pfp,
                    lostnfound.type AS lostfound_type,
                lostnfound.location,
        lostnfound.contact,
        lostnfound.description AS lostfound_des,
EXISTS(
                    SELECT 1 FROM post_likes 
                    WHERE user_id = $1 AND post_id = posts.id
                ) AS user_liked
                FROM posts
                JOIN users ON posts.user_id = users.id
                JOIN profiles ON profiles.u_id = users.id
                LEFT JOIN lostnfound ON posts.id = lostnfound.post_id
                ORDER BY post_date DESC;
            `, [req.user.id]);

            if (req.headers.accept === "application/json") {
                return res.json({
                    user: req.user,
                    posts: result.rows
                });
            }

            res.sendFile(path.join(__dirname, "public", "index.html"));
        } catch (err) {
            console.error("Error loading homepage:", err);
            res.status(500).json({ error: "Failed to load homepage" });
        }
    });

    app.post("/posts", isAuthenticated, upload.single("image"), async(req, res) => {
        try {
            // Check if this is a like action
            if (req.body.action === "toggle_like") {
                const { post_id } = req.body;
                const user_id = req.user.id;

                // Check if user already liked the post
                const alreadyLiked = await db.query(
                    `SELECT 1 FROM post_likes 
                WHERE user_id = $1 AND post_id = $2`, [user_id, post_id]
                );

                await db.query("BEGIN");

                if (alreadyLiked.rows.length > 0) {
                    // Unlike the post
                    await db.query(
                        `DELETE FROM post_likes 
                    WHERE user_id = $1 AND post_id = $2`, [user_id, post_id]
                    );
                    await db.query(
                        `UPDATE posts SET likes = likes - 1 
                    WHERE id = $1`, [post_id]
                    );
                } else {
                    // Like the post
                    await db.query(
                        `INSERT INTO post_likes (user_id, post_id)
                    VALUES ($1, $2)`, [user_id, post_id]
                    );
                    await db.query(
                        `UPDATE posts SET likes = likes + 1 
                    WHERE id = $1`, [post_id]
                    );
                }

                // Get updated like count
                const updatedPost = await db.query(
                    `SELECT likes FROM posts WHERE id = $1`, [post_id]
                );

                await db.query("COMMIT");

                return res.json({
                    success: true,
                    likes: updatedPost.rows[0].likes,
                    liked: !alreadyLiked.rows.length > 0
                });
            }

            // Existing post creation logic
            const { content, tags } = req.body;
            const user_id = req.user.id;
            const image_url = req.file ? `/uploads/${req.file.filename}` : null;
            const { lostfound_type, location, contact, lost_found_response } = req.body;

            // Create the post
            const result = await db.query(
                `INSERT INTO posts (user_id, content, image_url, tags)
            VALUES ($1, $2, $3, $4) RETURNING *`, [user_id, content, image_url, tags]
            );

            const postId = result.rows[0].id;

            // Handle lost & found data
            if (tags === 'lost&found' || tags === 'lost_found' || tags === 'lostfound') {
                await db.query(
                    `INSERT INTO lostnfound (post_id, type, location, contact, description) 
                VALUES ($1, $2, $3, $4, $5)`, [postId, lostfound_type, location, contact, lost_found_response]
                );
            }

            if (req.headers.accept === "application/json") {
                return res.status(201).json({
                    success: true,
                    post: result.rows[0]
                });
            }

            res.redirect("/homepage");
        } catch (err) {
            await db.query("ROLLBACK");
            console.error("Error:", err);
            res.status(500).json({
                error: "Failed to process request",
                details: err.message
            });
        }
    });
    app.get("/profile", isAuthenticated, async(req, res) => {
        try {
            const result = await db.query(`
                SELECT users.id, users.full_name, profiles.pfp
                FROM users
                JOIN profiles ON users.id = profiles.u_id
                WHERE users.id = $1
            `, [req.user.id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Profile not found" });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error("Error fetching profile:", err);
            res.status(500).json({ error: "Failed to fetch profile" });
        }
    });

    // API endpoint for announcements
    app.get('/api/announcements', async(req, res) => {
        try {
            const result = await db.query('SELECT title, content FROM announcements ORDER BY id DESC');
            res.json(result.rows);
        } catch (err) {
            console.error("Error fetching announcements:", err);
            res.status(500).json({ error: "Failed to fetch announcements" });
        }
    });

    app.get("/debug/uploads", (req, res) => {
        const uploadsPath = path.join(process.cwd(), "uploads");
        const exists = fs.existsSync(uploadsPath);
        res.json({
            uploadsPathExists: exists,
            uploadsPath: uploadsPath,
            cwd: process.cwd(),
            files: fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : []
        });
    });
}