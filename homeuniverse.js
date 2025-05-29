import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

export default function(app, db, isAuthenticated, baseDirname) {

    app.get('/universe/home', isAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
    });

    // API endpoint to get current user data
    app.get('/api/user', isAuthenticated, async(req, res) => {
        try {
            const userResult = await db.query(
                `SELECT u.id, u.email, u.full_name, u.role, 
                        s.major, s.year, s.cycle 
                 FROM users u 
                 LEFT JOIN students s ON u.id = s.u_id 
                 WHERE u.id = $1`, [req.user.id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const userData = userResult.rows[0];
            res.json(userData);

        } catch (error) {
            console.error('Error fetching user data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

}