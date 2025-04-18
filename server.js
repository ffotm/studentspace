import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import env from "dotenv";
import bcrypt from "bcrypt";

env.config();
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;


const db = new pg.Client({
    connectionString: "postgresql://postgres.cbrcntexlumhvfkqzhlz:dq3X*4yFvfH3haB@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
});
db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "l")));
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());


passport.use(new Strategy({ usernameField: 'email', passwordField: 'password' }, async(email, password, done) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) return done(null, false, { message: "User not found" });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return done(null, false, { message: "Wrong password" });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));
passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
});

passport.deserializeUser(async(id, done) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = result.rows[0];

        if (!user) return done(null, false);
        return done(null, user);
    } catch (err) {
        return done(err);
    }
});


// Auth middleware
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
};

// Import routes
import loginRoutes from "./l/blogin.js";
import homepageRoutes from "./homepage.js";

loginRoutes(app, db, passport, bcrypt, saltRounds, __dirname);
homepageRoutes(app, db, isAuthenticated, __dirname);

app.get('/profile', async(req, res) => {
    console.log("SESSION DATA:", req.session);
    console.log("USER DATA:", req.user);
    if (!req.isAuthenticated()) {
        console.log("User not authenticated");
        return res.status(401).json({ error: 'Not logged in' });
    }

    try {
        const result = await db.query(`
     SELECT users.full_name, profiles.pfp
FROM users
JOIN profiles ON users.id = profiles.u_id
WHERE users.id = $1

    `, [req.user.id]);

        console.log("DB result:", result.rows[0]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User profile not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});