import express from "express";
import bodyParser from "body-parser";
import path from "path";
import multer from "multer";
import env from "dotenv";
import { fileURLToPath } from "url";




export default function(app, db, isAuthenticated, __dirname) {
    app.get("/projects", (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'previous_project.html'));
    });
    // Get all completed projects
    app.get("/api/projects", async(req, res) => {
        try {
            const projects = await db.query(`  SELECT 
    p.project_id, 
    p.title, 
    t.team_name, 
    cp.supervisor 
FROM completed_projects cp
LEFT JOIN projects p ON cp.project_id = p.project_id
LEFT JOIN teams t ON p.team_id = t.team_id
ORDER BY cp.complete_id DESC;
`);
            res.json(projects.rows);
        } catch (err) {
            console.log(err);
        }
    });

    // flipcard
    app.get("/projects", async(req, res) => {
        const id = req.params.id;
        try {
            const result = await db.query(`SELECT team_name ,supervisor 
      FROM completed_projects,teams,projects  
      WHERE complete_id = $1 AND  
      completed_projects.project_id =projects.project_id 
      AND projects.team_id=teams.team_id`, [id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
            res.json(result.rows[0]);
        } catch (err) {
            console.log(err);
        }
    });

    // Get project details by ID
    app.get("/project/:id", async(req, res) => {
        const id = req.params.id;
        try {
            const result = await db.query(`
      SELECT
        p.title,
        cp.description,
        cp.supervisor,
        cp.grade,
        cp.presented_at,
        cp.drive,
        t.team_name,
        json_agg(u.full_name) AS members
      FROM completed_projects cp
      JOIN projects p ON cp.project_id = p.project_id
      JOIN teams t ON p.team_id = t.team_id
      JOIN team_members tm ON tm.team_id = t.team_id
      JOIN users u ON tm.u_id = u.id
      WHERE cp.project_id = $1
      GROUP BY p.title, cp.description, cp.supervisor, cp.presented_at, cp.drive, t.team_name ,cp.grade;
    `, [id]);

            if (result.rows.length > 0) {
                res.json(result.rows[0]); // send single object with members array
            } else {
                res.status(404).json({ error: 'Project not found' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Search for projects by name
    app.post("/projects", async(req, res) => {
        const { project_name } = req.body;
        try {
            const result = await db.query(`SELECT 
    p.project_id, 
    p.title, 
    t.team_name, 
    cp.supervisor 
FROM completed_projects cp 
LEFT JOIN projects p ON cp.project_id = p.project_id
LEFT JOIN teams t ON p.team_id = t.team_id
WHERE p.title ILIKE $1
ORDER BY cp.complete_id DESC;`, [`%${project_name}%`]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
            res.json(result.rows);
        } catch (err) {
            console.log(err);
        }
    });
}