import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt"; //still havent added pw incryption
import env from "dotenv";


const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

const db = new pg.Client({
    user: "student_space",
    host: "localhost",
    database: "postgres",
    password: process.env.dbpw,
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("homepage.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.post("/register", async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;


    try {
        if (!email.endsWith("@univ-blida.dz")) {
            return res.send("Only university emails (@univ-blida.dz) are allowed.");
        } else {
            const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
                email,
            ]);

            if (checkResult.rows.length > 0) {
                res.send("email already exists. try logging in.");
            } else {
                const result = await db.query(
                    "INSERT INTO users (email, password) VALUES ($1, $2)", [email, password]
                );
                //more infos to fill the database
                console.log(result);
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