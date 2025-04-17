import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import session from "express-session";
import { Strategy } from "passport-local";
import e from "express";



const app = express();
const port = 3000;
env.config();

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const db = new pg.Client({
    connectionString: "postgresql://postgres.cbrcntexlumhvfkqzhlz:dq3X*4yFvfH3haB@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
});

db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());



passport.use(new Strategy(
    async(username, password, done) => {
        try {
            const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length === 0) {
                return done(null, false, { message: 'Incorrect username.' });
            }

            const user = result.rows[0];
            // In a real app, you should use proper password hashing (bcrypt)
            if (password !== user.password) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id); // only store the user ID in the session
});

passport.deserializeUser(async(id, done) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]); // restore full user object from DB
    } catch (err) {
        done(err, null);
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/homepage',
    failureRedirect: '/login'
}));


app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect("/login");
    });
});
app.get('/homepage', async(req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

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

        res.json({
            user: req.user,
            posts: result.rows
        });

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