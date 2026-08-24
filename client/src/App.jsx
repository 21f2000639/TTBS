import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabaseClient";

function App() {
    // =====================================================
    // STATE
    // =====================================================

    const [currentView, setCurrentView] =
        useState("login");

    const [user, setUser] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [checkingSession, setCheckingSession] =
        useState(true);

    const [error, setError] =
        useState("");


    // =====================================================
    // REGISTRATION FIELDS
    // =====================================================

    const [registerId, setRegisterId] =
        useState("");

    const [registerName, setRegisterName] =
        useState("");

    const [registerEmail, setRegisterEmail] =
        useState("");

    const [registerPassword, setRegisterPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");


    // =====================================================
    // LOGIN FIELDS
    // =====================================================

    const [loginEmail, setLoginEmail] =
        useState("");

    const [loginPassword, setLoginPassword] =
        useState("");


    // =====================================================
    // LOAD CURRENT SUPABASE USER
    // =====================================================

    const loadCurrentUser = async () => {
        try {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error) {
                throw error;
            }

            // No active Supabase session
            if (!session) {
                setUser(null);
                setCurrentView("login");
                return;
            }

            const authUser = session.user;

            // Build the user object used by your dashboard
            setUser({
                id:
                    authUser.user_metadata?.custom_id ||
                    authUser.id,

                name:
                    authUser.user_metadata?.name ||
                    "",

                email:
                    authUser.email || "",
            });

            setCurrentView("dashboard");

        } catch (error) {
            console.error(
                "SESSION ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to load authentication session."
            );

            setUser(null);
            setCurrentView("login");

        } finally {
            setCheckingSession(false);
        }
    };


    // =====================================================
    // CHECK SUPABASE SESSION WHEN APP OPENS
    // =====================================================

    useEffect(() => {

        loadCurrentUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {

                if (session?.user) {

                    const authUser =
                        session.user;

                    setUser({
                        id:
                            authUser
                                .user_metadata
                                ?.custom_id ||
                            authUser.id,

                        name:
                            authUser
                                .user_metadata
                                ?.name ||
                            "",

                        email:
                            authUser.email ||
                            "",
                    });

                    setCurrentView(
                        "dashboard"
                    );

                } else {

                    setUser(null);

                    setCurrentView(
                        "login"
                    );
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };

    }, []);


    // =====================================================
    // REGISTER
    // =====================================================

    const handleRegister = async (e) => {

        e.preventDefault();

        setError("");


        // -------------------------------------------------
        // VALIDATE ID
        // -------------------------------------------------

        if (!registerId.trim()) {

            setError(
                "Please enter an ID."
            );

            return;
        }


        const numericId =
            Number(registerId);


        if (!Number.isInteger(numericId)) {

            setError(
                "ID must be a valid number."
            );

            return;
        }


        // -------------------------------------------------
        // VALIDATE NAME
        // -------------------------------------------------

        if (!registerName.trim()) {

            setError(
                "Please enter your name."
            );

            return;
        }


        // -------------------------------------------------
        // VALIDATE EMAIL
        // -------------------------------------------------

        if (!registerEmail.trim()) {

            setError(
                "Please enter your email."
            );

            return;
        }


        const cleanEmail =
            registerEmail
                .trim()
                .toLowerCase();


        // Basic email validation

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(cleanEmail)) {

            setError(
                "Please enter a valid email address."
            );

            return;
        }


        // -------------------------------------------------
        // VALIDATE PASSWORD
        // -------------------------------------------------

        if (!registerPassword) {

            setError(
                "Please enter a password."
            );

            return;
        }


        if (
            registerPassword.length < 6
        ) {

            setError(
                "Password must be at least 6 characters."
            );

            return;
        }


        if (
            registerPassword !==
            confirmPassword
        ) {

            setError(
                "Passwords do not match."
            );

            return;
        }


        // =================================================
        // REGISTER USING SUPABASE AUTH
        // =================================================

        try {

            setLoading(true);

            setError("");


            console.log(
                "Registering with Supabase Auth..."
            );


            const {
                data,
                error,
            } = await supabase.auth.signUp({

                email: cleanEmail,

                password: registerPassword,

                options: {

                    data: {

                        name:
                            registerName.trim(),

                        custom_id:
                            numericId,
                    },
                },
            });


            if (error) {
                throw error;
            }


            console.log(
                "REGISTER RESPONSE:",
                data
            );


            console.log(
                "REGISTERED USER:",
                data.user
            );


            // =================================================
            // SUCCESS
            // =================================================

            alert(
                "Registration successful! Please login."
            );


            // Clear registration form

            setRegisterId("");

            setRegisterName("");

            setRegisterEmail("");

            setRegisterPassword("");

            setConfirmPassword("");


            // Put email into login form

            setLoginEmail(
                cleanEmail
            );


            // Go to login

            setCurrentView(
                "login"
            );


        } catch (error) {

            console.error(
                "REGISTRATION ERROR:",
                error
            );


            setError(
                error.message ||
                "Registration failed."
            );


        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // LOGIN
    // =====================================================

    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");


        // -------------------------------------------------
        // VALIDATE EMAIL
        // -------------------------------------------------

        if (!loginEmail.trim()) {

            setError(
                "Please enter your email."
            );

            return;
        }


        // -------------------------------------------------
        // VALIDATE PASSWORD
        // -------------------------------------------------

        if (!loginPassword) {

            setError(
                "Please enter your password."
            );

            return;
        }


        const cleanEmail =
            loginEmail
                .trim()
                .toLowerCase();


        // =================================================
        // LOGIN USING SUPABASE AUTH
        // =================================================

        try {

            setLoading(true);

            setError("");


            console.log(
                "Logging in with Supabase Auth..."
            );


            const {
                data,
                error,
            } =
                await supabase.auth
                    .signInWithPassword({

                        email:
                            cleanEmail,

                        password:
                            loginPassword,
                    });


            if (error) {
                throw error;
            }


            console.log(
                "LOGIN RESPONSE:",
                data
            );


            console.log(
                "LOGGED IN USER:",
                data.user
            );


            // =================================================
            // CREATE USER OBJECT FOR DASHBOARD
            // =================================================

            const authUser =
                data.user;


            const loggedInUser = {

                id:
                    authUser
                        .user_metadata
                        ?.custom_id ||
                    authUser.id,

                name:
                    authUser
                        .user_metadata
                        ?.name ||
                    "",

                email:
                    authUser.email ||
                    "",
            };


            setUser(
                loggedInUser
            );


            // Clear password

            setLoginPassword("");


            // Go to dashboard

            setCurrentView(
                "dashboard"
            );


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            setError(
                error.message ||
                "Login failed."
            );


        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = async () => {

        try {

            setLoading(true);

            setError("");


            const {
                error,
            } =
                await supabase.auth.signOut();


            if (error) {
                throw error;
            }


            setUser(null);

            setLoginPassword("");

            setCurrentView("login");


        } catch (error) {

            console.error(
                "LOGOUT ERROR:",
                error
            );


            setError(
                error.message ||
                "Logout failed."
            );


        } finally {

            setLoading(false);
        }

    };


    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (checkingSession) {

        return (

            <div className="app">

                <div className="auth-card">

                    <div className="header">

                        <h1>
                            TTBS
                        </h1>

                        <p>
                            Checking authentication...
                        </p>

                    </div>


                    <div className="loading">

                        Please wait...

                    </div>

                </div>

            </div>

        );
    }


    // =====================================================
    // LOGIN SCREEN
    // =====================================================

    if (
        currentView ===
        "login"
    ) {

        return (

            <div className="app">

                <div className="auth-card">

                    <div className="header">

                        <h1>
                            TTBS
                        </h1>

                        <p>
                            Welcome back
                        </p>

                    </div>


                    <h2>
                        Login
                    </h2>


                    <form
                        onSubmit={
                            handleLogin
                        }
                    >

                        {/* EMAIL */}

                        <div className="input-group">

                            <label htmlFor="login-email">

                                Email

                            </label>

                            <input
                                id="login-email"

                                type="email"

                                placeholder="Enter your email"

                                value={
                                    loginEmail
                                }

                                onChange={(e) => {

                                    setLoginEmail(
                                        e.target.value
                                    );

                                    setError("");

                                }}

                                autoComplete="email"

                                required
                            />

                        </div>


                        {/* PASSWORD */}

                        <div className="input-group">

                            <label htmlFor="login-password">

                                Password

                            </label>

                            <input
                                id="login-password"

                                type="password"

                                placeholder="Enter your password"

                                value={
                                    loginPassword
                                }

                                onChange={(e) => {

                                    setLoginPassword(
                                        e.target.value
                                    );

                                    setError("");

                                }}

                                autoComplete="current-password"

                                required
                            />

                        </div>


                        {/* ERROR */}

                        {error && (

                            <div className="error">

                                {error}

                            </div>

                        )}


                        {/* LOGIN BUTTON */}

                        <button
                            type="submit"

                            disabled={
                                loading
                            }
                        >

                            {loading

                                ? "Logging in..."

                                : "Login"

                            }

                        </button>

                    </form>


                    {/* REGISTER LINK */}

                    <div className="switch-text">

                        Don't have an account?

                        {" "}

                        <button
                            type="button"

                            className="link-button"

                            onClick={() => {

                                setError("");

                                setCurrentView(
                                    "register"
                                );

                            }}
                        >

                            Register

                        </button>

                    </div>

                </div>

            </div>

        );
    }


    // =====================================================
    // REGISTER SCREEN
    // =====================================================

    if (
        currentView ===
        "register"
    ) {

        return (

            <div className="app">

                <div className="auth-card">

                    <div className="header">

                        <h1>
                            TTBS
                        </h1>

                        <p>
                            Create your account
                        </p>

                    </div>


                    <h2>
                        Register
                    </h2>


                    <form
                        onSubmit={
                            handleRegister
                        }
                    >

                        {/* ID */}

                        <div className="input-group">

                            <label htmlFor="register-id">

                                ID

                            </label>

                            <input
                                id="register-id"

                                type="number"

                                placeholder="Enter ID"

                                value={
                                    registerId
                                }

                                onChange={(e) => {

                                    setRegisterId(
                                        e.target.value
                                    );

                                    setError("");

                                }}

                                min="1"

                                required
                            />

                        </div>


                        {/* NAME */}

                        <div className="input-group">

                            <label htmlFor="register-name">

                                Name

                            </label>

                            <input
                                id="register-name"

                                type="text"

                                placeholder="Enter name"

                                value={
                                    registerName
                                }

                                onChange={(e) => {

                                    setRegisterName(
                                        e.target.value
                                    );

                                    setError("");

                                }}

                                autoComplete="name"

                                required
                            />

                        </div>


                        {/* EMAIL */}

                        <div className="input-group">

                            <label htmlFor="register-email">

                                Email

                            </label>

                            <input
                                id="register-email"

                                type="email"

                                placeholder="Enter email"

                                value={
                                    registerEmail
                                }

                                onChange={(e) => {

                                    setRegisterEmail(
                                        e.target.value
                                    );

                                    setError("");

                                }}

                                autoComplete="email"

                                required
                            />

                        </div>


                        {/* PASSWORD */}

                        <div className="input-group">

                            <label htmlFor="register-password">

                                Password

                            </label>

                            <input
                                id="register-password"

                                type="password"

                                placeholder="Minimum 6 characters"

                                value={
                                    registerPassword
                                }

                                onChange={(e) => {

                                    setRegisterPassword(
                                        e.target.value
                                    );

                                    setError("");

                                }}

                                autoComplete="new-password"

                                minLength="6"

                                required
                            />

                        </div>


                        {/* CONFIRM PASSWORD */}

                        <div className="input-group">

                            <label htmlFor="confirm-password">

                                Confirm Password

                            </label>

                            <input
                                id="confirm-password"

                                type="password"

                                placeholder="Confirm password"

                                value={
                                    confirmPassword
                                }

                                onChange={(e) => {

                                    setConfirmPassword(
                                        e.target.value
                                    );

                                    setError("");

                                }}

                                autoComplete="new-password"

                                required
                            />

                        </div>


                        {/* ERROR */}

                        {error && (

                            <div className="error">

                                {error}

                            </div>

                        )}


                        {/* REGISTER BUTTON */}

                        <button
                            type="submit"

                            disabled={
                                loading
                            }
                        >

                            {loading

                                ? "Creating account..."

                                : "Register"

                            }

                        </button>

                    </form>


                    {/* LOGIN LINK */}

                    <div className="switch-text">

                        Already have an account?

                        {" "}

                        <button
                            type="button"

                            className="link-button"

                            onClick={() => {

                                setError("");

                                setCurrentView(
                                    "login"
                                );

                            }}
                        >

                            Login

                        </button>

                    </div>

                </div>

            </div>

        );
    }


    // =====================================================
    // DASHBOARD
    // =====================================================

    return (

        <div className="app">

            <div className="dashboard">

                <div className="dashboard-header">

                    <div>

                        <h1>
                            TTBS Dashboard
                        </h1>

                        <p>

                            Welcome,{" "}

                            {user?.name}

                        </p>

                    </div>


                    <button
                        onClick={
                            handleLogout
                        }

                        disabled={
                            loading
                        }
                    >

                        {loading
                            ? "Logging out..."
                            : "Logout"
                        }

                    </button>

                </div>


                {/* PROFILE */}

                <div className="profile-card">

                    <h2>
                        Your Profile
                    </h2>


                    <div className="profile-row">

                        <strong>
                            ID
                        </strong>

                        <span>
                            {user?.id}
                        </span>

                    </div>


                    <div className="profile-row">

                        <strong>
                            Name
                        </strong>

                        <span>
                            {user?.name}
                        </span>

                    </div>


                    <div className="profile-row">

                        <strong>
                            Email
                        </strong>

                        <span>
                            {user?.email}
                        </span>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default App;