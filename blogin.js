// l/login.js
import path from "path";

export default function(app, db, passport, bcrypt, saltRounds, __dirname) {
    const loginDir = path.join(__dirname, "l");

    app.get("/login", (req, res) => {
        res.sendFile(path.join(loginDir, "login.html"));
    });

    app.post("/login", (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ success: false, message: info.message });

            req.logIn(user, err => {
                if (err) return next(err);
                res.json({ success: true, message: "Logged in", role: user.role });

            });
        })(req, res, next);
    });

    app.get("/logout", (req, res, next) => {
        req.logout(err => {
            if (err) return next(err);
            res.redirect("/login");
        });
    });

    app.post("/register", async(req, res) => {
        const { email, password, fullName, major, year, cycle } = req.body;

        if (!email.endsWith("@univ-blida.dz")) {
            return res.status(400).json({ success: false, message: "Use a university email" });
        }

        const existing = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const userResult = await db.query(
            "INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id", [email, hashedPassword, fullName]
        );

        const userId = userResult.rows[0].id;
        await db.query(
            "INSERT INTO students (u_id, major, year, cycle) VALUES ($1, $2, $3, $4)", [userId, major, year, cycle]
        );

        res.status(201).json({ success: true, message: "Registered successfully" });
    });
}