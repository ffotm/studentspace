import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
env.config();

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const db = new pg.Client({
    connectionString: process.env.dblink,
});
db.connect();
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/homepage', async(req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        posts.id,
        posts.post_date,
        posts.content,
        posts.image_url,
        posts.tags,
        users.full_name AS username,
        users.profile_image_url
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY post_date DESC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting posts:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/homepage', async(req, res) => {
    const { user_id, content, image_url, tags } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO posts (user_id, content, image_url, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [user_id, content, image_url, tags]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});