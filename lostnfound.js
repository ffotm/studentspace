import express from "express";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

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

export default function(app, db, isAuthenticated, __dirname) {
    app.get('/lostnfound', isAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, 'l&f', 'lostfound.html'));
    });
}