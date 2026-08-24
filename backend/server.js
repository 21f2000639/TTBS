require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("./db");

const app = express();


// ======================================================
// CONFIGURATION
// ======================================================

const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://ttbs-ten.vercel.app"
        ],

        credentials: true
    })
);

app.use(express.json());


// ======================================================
// BASIC TEST
// ======================================================

app.get("/", (req, res) => {

    res.json({
        message: "TTBS backend is working"
    });

});


// ======================================================
// DATABASE TEST
// ======================================================

app.get("/api/test-db", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        res.json({

            success: true,

            message:
                "Successfully connected to Supabase PostgreSQL",

            time:
                result.rows[0].current_time

        });

    } catch (error) {

        console.error(
            "DATABASE ERROR:",
            error.message
        );

        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// ======================================================
// GET USERS
// ======================================================

app.get("/api/users", async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT "ID", "Name", "Email" FROM public."TTBS" ORDER BY "ID"'
        );

        res.json(
            result.rows
        );

    } catch (error) {

        console.error(
            "GET USERS ERROR:",
            error.message
        );

        res.status(500).json({

            error:
                error.message

        });

    }

});


// ======================================================
// REGISTER
// ======================================================

app.post(
    "/api/auth/register",
    async (req, res) => {

        const {
            id,
            name,
            email,
            password
        } = req.body;


        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (
            id === undefined ||
            id === null ||
            id === ""
        ) {

            return res.status(400).json({

                error:
                    "ID is required"

            });

        }


        if (!name || !name.trim()) {

            return res.status(400).json({

                error:
                    "Name is required"

            });

        }


        if (!email || !email.trim()) {

            return res.status(400).json({

                error:
                    "Email is required"

            });

        }


        if (!password) {

            return res.status(400).json({

                error:
                    "Password is required"

            });

        }


        if (password.length < 6) {

            return res.status(400).json({

                error:
                    "Password must be at least 6 characters"

            });

        }


        try {

            const numericId =
                Number(id);


            if (!Number.isInteger(numericId)) {

                return res.status(400).json({

                    error:
                        "ID must be a valid integer"

                });

            }


            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();


            const cleanName =
                name.trim();


            // --------------------------------------------------
            // CHECK DUPLICATE ID
            // --------------------------------------------------

            const existingId =
                await pool.query(

                    'SELECT "ID" FROM public."TTBS" WHERE "ID" = $1',

                    [numericId]

                );


            if (
                existingId.rows.length > 0
            ) {

                return res.status(409).json({

                    error:
                        "This ID already exists"

                });

            }


            // --------------------------------------------------
            // CHECK DUPLICATE EMAIL
            // --------------------------------------------------

            const existingEmail =
                await pool.query(

                    'SELECT "ID" FROM public."TTBS" WHERE LOWER("Email") = LOWER($1)',

                    [cleanEmail]

                );


            if (
                existingEmail.rows.length > 0
            ) {

                return res.status(409).json({

                    error:
                        "This email is already registered"

                });

            }


            // --------------------------------------------------
            // HASH PASSWORD
            // --------------------------------------------------

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            // --------------------------------------------------
            // INSERT USER
            // --------------------------------------------------

            const result =
                await pool.query(

                    `INSERT INTO public."TTBS"
                    ("ID", "Name", "Email", "PasswordHash")
                    VALUES ($1, $2, $3, $4)
                    RETURNING "ID", "Name", "Email"`,

                    [
                        numericId,
                        cleanName,
                        cleanEmail,
                        passwordHash
                    ]

                );


            // --------------------------------------------------
            // RESPONSE
            // --------------------------------------------------

            res.status(201).json({

                success: true,

                message:
                    "Registration successful",

                user:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "REGISTER ERROR:",
                error.message
            );


            res.status(500).json({

                error:
                    "Registration failed"

            });

        }

    }
);


// ======================================================
// LOGIN
// ======================================================

app.post(
    "/api/auth/login",
    async (req, res) => {

        const {
            email,
            password
        } = req.body;


        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (!email || !email.trim()) {

            return res.status(400).json({

                error:
                    "Email is required"

            });

        }


        if (!password) {

            return res.status(400).json({

                error:
                    "Password is required"

            });

        }


        try {

            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();


            // --------------------------------------------------
            // FIND USER
            // --------------------------------------------------

            const result =
                await pool.query(

                    `SELECT
                        "ID",
                        "Name",
                        "Email",
                        "PasswordHash"
                     FROM public."TTBS"
                     WHERE LOWER("Email") = LOWER($1)`,

                    [cleanEmail]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({

                    error:
                        "Invalid email or password"

                });

            }


            const user =
                result.rows[0];


            // --------------------------------------------------
            // CHECK PASSWORD
            // --------------------------------------------------

            const passwordMatch =
                await bcrypt.compare(

                    password,

                    user.PasswordHash

                );


            if (!passwordMatch) {

                return res.status(401).json({

                    error:
                        "Invalid email or password"

                });

            }


            // --------------------------------------------------
            // CREATE JWT
            // --------------------------------------------------

            if (!JWT_SECRET) {

                console.error(
                    "JWT_SECRET is missing"
                );

                return res.status(500).json({

                    error:
                        "Server authentication configuration error"

                });

            }


            const token =
                jwt.sign(

                    {
                        id:
                            user.ID,

                        email:
                            user.Email

                    },

                    JWT_SECRET,

                    {
                        expiresIn:
                            "7d"
                    }

                );


            // --------------------------------------------------
            // RESPONSE
            // --------------------------------------------------

            res.json({

                success: true,

                message:
                    "Login successful",

                token,

                user: {

                    id:
                        user.ID,

                    name:
                        user.Name,

                    email:
                        user.Email

                }

            });


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error.message
            );


            res.status(500).json({

                error:
                    "Login failed"

            });

        }

    }
);


// ======================================================
// AUTH MIDDLEWARE
// ======================================================

function authenticateToken(
    req,
    res,
    next
) {

    const authHeader =
        req.headers.authorization;


    if (!authHeader) {

        return res.status(401).json({

            error:
                "Authentication token required"

        });

    }


    const parts =
        authHeader.split(" ");


    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        return res.status(401).json({

            error:
                "Invalid authorization format"

        });

    }


    const token =
        parts[1];


    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );


        req.user =
            decoded;


        next();


    } catch (error) {

        return res.status(401).json({

            error:
                "Invalid or expired token"

        });

    }

}


// ======================================================
// CURRENT USER
// ======================================================

app.get(
    "/api/auth/me",
    authenticateToken,
    async (req, res) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        "ID",
                        "Name",
                        "Email"
                     FROM public."TTBS"
                     WHERE "ID" = $1`,

                    [req.user.id]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    error:
                        "User not found"

                });

            }


            res.json({

                success: true,

                user:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "ME ERROR:",
                error.message
            );


            res.status(500).json({

                error:
                    "Unable to get user"

            });

        }

    }
);


// ======================================================
// START SERVER
// ======================================================

const startServer =
    async () => {

        try {

            await pool.query(
                "SELECT 1"
            );


            console.log(
                "Successfully connected to Supabase PostgreSQL."
            );


            app.listen(
                PORT,
                "0.0.0.0",
                () => {

                    console.log(
                        `Server running on port ${PORT}`
                    );

                }
            );


        } catch (error) {

            console.error(
                "FAILED TO START SERVER:"
            );

            console.error(
                error.message
            );

            process.exit(1);

        }

    };


startServer();