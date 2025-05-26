import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

export default function(app, db, isAuthenticated, baseDirname) {

    // Serve the Lost & Found page
    app.get('/lostnfound', isAuthenticated, (req, res) => {
        res.sendFile(path.join(baseDirname, 'public', 'lostfound.html'));
    });

    // Get all lost & found items from feed posts
    app.get('/api/lostfound', isAuthenticated, async(req, res) => {
        try {
            const { type } = req.query; // 'lost' or 'found'

            let query = `
            SELECT 
                lf.id,
                lf.post_id,
                lf.contact,
                lf.location,
                lf.type,
                lf.image_path,
                lf.description,
                lf.created_at,
                p.content,
                p.image_url as post_image,
                u.full_name
            FROM lostnfound lf
            JOIN posts p ON lf.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE p.tags LIKE $1
        `;

            let params = ['%lost&found%'];

            if (type && (type === 'lost' || type === 'found')) {
                query += ` AND lf.type = $2`;
                params.push(type);
            }

            query += ` ORDER BY lf.created_at DESC`;

            const result = await db.query(query, params);
            const items = result.rows;

            res.json(items);
        } catch (error) {
            console.error('Error fetching lost & found items:', error);
            res.status(500).json({ error: 'Failed to fetch items' });
        }
    });

    // Get specific lost & found item details
    app.get('/api/lostfound/:id', isAuthenticated, async(req, res) => {
        try {
            const itemId = req.params.id;

            const query = `
                SELECT 
                    lf.id,
                    lf.post_id,
                    lf.contact,
                    lf.location,
                    lf.type,
                    lf.image_path,
                    lf.created_at,
lf.description,
                    p.content,
                    p.image_url as post_image,
                    p.tags,
                    u.full_name
                    u.id as user_id
                FROM lostfound lf
                JOIN posts p ON lf.post_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE lf.id = ?
            `;

            const item = await db.get(query, [itemId]);

            if (!item) {
                return res.status(404).json({ error: 'Item not found' });
            }

            res.json(item);
        } catch (error) {
            console.error('Error fetching lost & found item:', error);
            res.status(500).json({ error: 'Failed to fetch item details' });
        }
    });

    // Search lost & found items
    app.get('/api/lostfound/search', isAuthenticated, async(req, res) => {
        try {
            const { q, type, location } = req.query;

            let query = `
                SELECT 
                    lf.id,
                    lf.post_id,
                    lf.contact,
                    lf.location,
                    lf.type,
                    lf.image_path,
lf.description,
                    lf.created_at,
                    p.content,
                    p.image_url as post_image,
                    u.full_name
                   
                FROM lostfound lf
                JOIN posts p ON lf.post_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE p.tags LIKE '%lost&found%'
            `;

            let params = [];

            if (q) {
                query += ' AND (p.content LIKE ? OR lf.location LIKE ?)';
                params.push(`%${q}%`, `%${q}%`);
            }

            if (type && (type === 'lost' || type === 'found')) {
                query += ' AND lf.type = ?';
                params.push(type);
            }

            if (location) {
                query += ' AND lf.location LIKE ?';
                params.push(`%${location}%`);
            }

            query += ' ORDER BY lf.created_at DESC LIMIT 50';

            const items = await db.all(query, params);
            res.json(items);
        } catch (error) {
            console.error('Error searching lost & found items:', error);
            res.status(500).json({ error: 'Failed to search items' });
        }
    });

}
