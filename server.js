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
import multer from "multer";
import fs from "fs";

env.config();
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
// Configure EJS to look in the public directory
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
import lostnfound from "./lostnfound.js";

// Apply login and homepage routes
loginRoutes(app, db, passport, bcrypt, saltRounds, __dirname);
homepageRoutes(app, db, isAuthenticated, __dirname);
lostnfound(app, db, isAuthenticated, __dirname);
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, "l", "uploads", "books");

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, 'book-' + uniqueSuffix + fileExt);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Books routes - implemented directly in server.js instead of importing
// Serve the bookshop page

app.get('/books', isAuthenticated, async(req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                b.id, b.title, b.author, b.field, b.price, b.description, 
                b.cover, b.date_of_publication,
                u.full_name AS owner_name
            FROM books b
            JOIN users u ON b.owner_id = u.id
            ORDER BY b.date_of_publication DESC
        `);
        res.render('books', { books: result.rows });
    } catch (err) {
        console.error("Error fetching books:", err);
        res.render('books', { books: [] });
    }
});

// API to get books by category
app.get('/books/field/:field', async(req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        b.id, b.title, b.author, b.field, b.price, b.description, 
        b.cover, b.date_of_publication,
        u.full_name AS owner_name, owner_id
      FROM books b
      JOIN users u ON b.owner_id = u.id
      WHERE b.field = $1
      ORDER BY b.date_of_publication DESC
    `, [req.params.field]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching books by category:", err);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// API to add a new book
app.post('/books', isAuthenticated, upload.single('image'), async(req, res) => {
    const { title, author, field, price, description } = req.body;
    const ownerId = req.user.id;
    const imagePath = req.file ? `/uploads/books/${req.file.filename}` : null;

    try {
        const result = await db.query(`
      INSERT INTO books (
        title, author, field, price, description, cover, owner_id, available_copies
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [title, author, field, price, description, imagePath, ownerId, 1]);

        res.status(201).json({
            message: 'Book added successfully',
            bookId: result.rows[0].id
        });
    } catch (err) {
        console.error("Error adding book:", err);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

// API to update a book
app.put('/books/:id', isAuthenticated, async(req, res) => {
    const bookId = req.params.id;
    const { title, author, field, price, description, available_copies } = req.body;

    try {
        // First check if user owns this book
        const bookCheck = await db.query(
            'SELECT owner_id FROM books WHERE id = $1', [bookId]
        );

        if (bookCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        if (bookCheck.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to update this book' });
        }

        await db.query(`
      UPDATE books 
      SET title = $1, author = $2, field = $3, price = $4, 
          description = $5, available_copies = $6, date_of_publication = NOW()
      WHERE id = $7 AND owner_id = $8
    `, [title, author, field, price, description, available_copies, bookId, req.user.id]);

        res.json({ message: 'Book updated successfully' });
    } catch (err) {
        console.error("Error updating book:", err);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// API to delete a book
app.delete('/books/:id', isAuthenticated, async(req, res) => {
    const bookId = req.params.id;

    try {
        // First check if user owns this book
        const bookCheck = await db.query(
            'SELECT owner_id, cover FROM books WHERE id = $1', [bookId]
        );

        if (bookCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        if (bookCheck.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to delete this book' });
        }

        // Delete the book
        await db.query('DELETE FROM books WHERE id = $1 AND owner_id = $2', [bookId, req.user.id]);

        // Delete the image file if it exists
        if (bookCheck.rows[0].cover) {
            const imagePath = path.join(__dirname, "l", bookCheck.rows[0].cover);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        console.error("Error deleting book:", err);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

// API to get books by seller
app.get('/books/owner/:ownerId', async(req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        b.id, b.title, b.author, b.field, b.price, b.description, 
        b.cover, b.available_copies, b.date_of_publication,
        u.full_name AS owner_name
      FROM books b
      JOIN users u ON b.owner_id = u.id
      WHERE b.owner_id = $1
      ORDER BY b.date_of_publication DESC
    `, [req.params.ownerId]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching seller books:", err);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// API to get my books (current logged in user)
app.get('/books/my-books', isAuthenticated, async(req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        id, title, author, field, price, description, 
        cover, available_copies, date_of_publication
      FROM books
      WHERE owner_id = $1
      ORDER BY date_of_publication DESC
    `, [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching user books:", err);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// Add debugging routes
app.get('/test-db', async(req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            status: 'Database connection successful',
            timestamp: result.rows[0]
        });
    } catch (err) {
        console.error("Database connection error:", err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

app.get('/check-books-table', async(req, res) => {
    try {
        // Check if the table exists
        const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'books'
      );
    `);

        const tableExists = tableCheck.rows[0].exists;

        if (!tableExists) {
            return res.json({ error: 'Books table does not exist' });
        }

        // Check column structure
        const columnsResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'books';
    `);

        // Count rows
        const countResult = await db.query('SELECT COUNT(*) FROM books');

        res.json({
            tableExists,
            columns: columnsResult.rows,
            rowCount: countResult.rows[0].count
        });
    } catch (err) {
        console.error("Table check error:", err);
        res.status(500).json({ error: 'Failed to check table structure' });
    }
});

// Error handling for multer uploads
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(500).json({ error: err.message });
    }
    next();
});

app.get('/profile', async(req, res) => {
    console.log("SESSION DATA:", req.session);
    console.log("USER DATA:", req.user);
    if (!req.isAuthenticated()) {
        console.log("User not authenticated");
        return res.status(401).json({ error: 'Not logged in' });
    }

    try {
        const result = await db.query(`
    SELECT users.full_name, profiles.pfp FROM users JOIN profiles ON users.id = profiles.u_id WHERE users.id = $1
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