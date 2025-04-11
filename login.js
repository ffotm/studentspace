import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt"; //still havent added pw incryption
import env from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);


/*const db = new pg.Client({
    user: "student_space",
    host: "localhost",
    database: "postgres",
    password: process.env.dbpw,
    port: 5432,
});
db.connect();*/

const db = new pg.Client({
    connectionString: "postgresql://postgres.cbrcntexlumhvfkqzhlz:dq3X*4yFvfH3haB@aws-0-eu-west-3.pooler.supabase.com:6543/postgres"
});

db.connect();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../../frontend")));

app.get("/", (req, res) => {
    res.render("homepage.ejs");
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend", "login.html"));
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.post("/register", async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const fullName = req.body.fullName;
    const major = req.body.major;
    const year = req.body.year;
    const cycle = req.body.cycle;

    try {
        if (!email.endsWith("@univ-blida.dz")) {
            return res.send("not allowed");
        } else {
            const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
                email,
            ]);

            if (checkResult.rows.length > 0) {
                res.send("email already exists. try logging in.");
            } else {
                const result1 = await db.query(
                    "INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3)", [email, password, fullName]);
                const result2 = await db.query("INSERT INTO students (major, year, cycle) VALUES ($1, $2, $3)", [major, year, cycle])
                    //more infos to fill the database
                res.render("homepage.ejs");
            }
        }
    } catch (err) {
        console.log(err);
    }
});

app.post("/login", async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
            email,
        ]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedPassword = user.password;

            if (password === storedPassword) {
                res.render("homepage.ejs");
            } else {
                res.send("incorrect password");
            }
        } else {
            res.send("user not found");
        }
    } catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});