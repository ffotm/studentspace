import express from 'express';
import bodyParser from "body-parser";
import path from "path";
import multer from "multer";
import env from "dotenv";
import { fileURLToPath } from "url";


const router = express.Router();
export default function(app, db, isAuthenticated, __dirname) {
    app.get('/supervisor', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'supervisor.html'));
    });
    // Get all supervisors
    app.get("/api/supervisors", async(req, res) => {
        try {
            const supervisors = await db.query(`  SELECT 
   name,email,department,image
FROM supervisors
`);
            res.json(supervisors.rows);
        } catch (err) {
            console.log(err);
        }
    });

    //search bar
    app.post("/api/supervisors/search", async(req, res) => {
        const { supervisor_name } = req.body;
        console.log("Searching for supervisor:", supervisor_name);
        try {
            const result = await db.query(
                `SELECT name, email, department, image
       FROM supervisors
       WHERE  department ILIKE $1`, [`%${supervisor_name}%`]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Supervisor not found' });
            }
            res.json(result.rows);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: 'Database error' });
        }
    });
}