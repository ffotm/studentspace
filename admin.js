// admin.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// This middleware should come from the main file or duplicated here
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send("Access denied. Admins only.");
};

router.get("/dashboard", isAdmin, (req, res) => {
    const adminDir = path.join(__dirname, "admin-pages-1");
    res.sendFile(path.join(adminDir, "dashboard.html"));
});

export default router;