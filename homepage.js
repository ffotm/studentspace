// homepage.js
import path from "path";

export default function(app, db, isAuthenticated, __dirname) {
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

            res.sendFile(path.join(__dirname, "public", "index.html")); // adjust path if needed
        } catch (err) {
            console.error("Error loading homepage:", err);
            res.status(500).json({ error: "Failed to load homepage" });
        }
    });

    app.post("/posts", isAuthenticated, async(req, res) => {
        const { content, image_url, tags } = req.body;
        const user_id = req.user.id;

        try {
            const result = await db.query(
                `INSERT INTO posts (user_id, content, image_url, tags)
         VALUES ($1, $2, $3, $4) RETURNING *`, [user_id, content, image_url, tags]
            );

            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error("Error creating post:", err);
            res.status(500).json({ error: "Failed to create post" });
        }
    });

}