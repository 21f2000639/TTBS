import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabaseClient";

function App() {
    // =====================================================
    // GENERAL STATE
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
    // FILE UPLOAD / SENTIMENT ANALYSIS STATE
    // =====================================================

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [analyzing, setAnalyzing] =
        useState(false);

    const [analysisResult, setAnalysisResult] =
        useState(null);

    const [uploadError, setUploadError] =
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

            // No active session
            if (!session) {
                setUser(null);
                setCurrentView("login");
                return;
            }

            const authUser = session.user;

            setUser({
                id:
                    authUser.user_metadata?.custom_id ||
                    authUser.id,

                name:
                    authUser.user_metadata?.name ||
                    "",

                email:
                    authUser.email ||
                    "",
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
    // SUPABASE AUTH STATE LISTENER
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
        // REGISTER WITH SUPABASE
        // =================================================

        try {

            setLoading(true);

            setError("");

            const {
                data,
                error,
            } = await supabase.auth.signUp({

                email: cleanEmail,

                password:
                    registerPassword,

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
                "REGISTERED USER:",
                data.user
            );


            // Clear registration form

            setRegisterId("");

            setRegisterName("");

            setRegisterEmail("");

            setRegisterPassword("");

            setConfirmPassword("");


            // Put email into login

            setLoginEmail(
                cleanEmail
            );


            alert(
                "Registration successful! Please login."
            );


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


        if (!loginEmail.trim()) {

            setError(
                "Please enter your email."
            );

            return;
        }

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
        // LOGIN WITH SUPABASE
        // =================================================

        try {

            setLoading(true);

            setError("");

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

            setLoginPassword("");

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
    // FILE SELECTION
    // =====================================================

    const handleFileSelect = (e) => {

        const file =
            e.target.files?.[0];

        setUploadError("");

        setAnalysisResult(null);


        if (!file) {

            setSelectedFile(null);

            return;
        }


        // Only TXT files

        if (
            !file.name
                .toLowerCase()
                .endsWith(".txt")
        ) {

            setUploadError(
                "Please upload a .txt file."
            );

            setSelectedFile(null);

            return;
        }


        // Optional file-size validation
        // 5 MB maximum

        const maxSize =
            5 * 1024 * 1024;

        if (file.size > maxSize) {

            setUploadError(
                "File is too large. Maximum size is 5 MB."
            );

            setSelectedFile(null);

            return;
        }


        setSelectedFile(file);
    };


    // =====================================================
    // SEND FILE TO N8N FOR ANALYSIS
    // =====================================================

    const handleAnalyze = async () => {

        if (!selectedFile) {

            setUploadError(
                "Please select a .txt file first."
            );

            return;
        }


        const webhookUrl =
            import.meta.env
                .VITE_N8N_WEBHOOK_URL;


        if (!webhookUrl) {

            setUploadError(
                "n8n webhook URL is not configured."
            );

            return;
        }


        try {

            setAnalyzing(true);

            setUploadError("");

            setAnalysisResult(null);


            // Create multipart/form-data

            const formData =
                new FormData();


            formData.append(
                "file",
                selectedFile
            );


            // Send file to n8n

            const response =
                await fetch(
                    webhookUrl,
                    {
                        method: "POST",

                        body: formData,
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Analysis request failed with status ${response.status}`
                );
            }


            // Read n8n response

            const result =
                await response.json();


            console.log(
                "N8N ANALYSIS RESULT:",
                result
            );


            setAnalysisResult(
                result
            );


        } catch (error) {

            console.error(
                "ANALYSIS ERROR:",
                error
            );


            setUploadError(
                error.message ||
                "Unable to analyze the conversation."
            );


        } finally {

            setAnalyzing(false);

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

            setSelectedFile(null);

            setAnalysisResult(null);

            setUploadError("");

            setCurrentView(
                "login"
            );


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
    // SESSION LOADING SCREEN
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

                            <label
                                htmlFor="login-email"
                            >
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

                            <label
                                htmlFor="login-password"
                            >
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


                        {/* LOGIN */}

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

                            <label
                                htmlFor="register-id"
                            >
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

                            <label
                                htmlFor="register-name"
                            >
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

                            <label
                                htmlFor="register-email"
                            >
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

                            <label
                                htmlFor="register-password"
                            >
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

                            <label
                                htmlFor="confirm-password"
                            >
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


                        {/* REGISTER */}

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

                {/* =========================================
                    DASHBOARD HEADER
                ========================================= */}

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


                {/* =========================================
                    PROFILE
                ========================================= */}

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


                {/* =========================================
                    SENTIMENT ANALYSIS UPLOAD
                ========================================= */}

                <div className="profile-card">

                    <h2>
                        Analyze Conversation
                    </h2>

                    <p>
                        Upload a conversation in
                        {" "}
                        <strong>.txt</strong>
                        {" "}
                        format for sentiment analysis.
                    </p>


                    {/* FILE INPUT */}

                    <div className="input-group">

                        <label
                            htmlFor="conversation-file"
                        >
                            Conversation File
                        </label>

                        <input
                            id="conversation-file"

                            type="file"

                            accept=".txt,text/plain"

                            onChange={
                                handleFileSelect
                            }

                        />

                    </div>


                    {/* SELECTED FILE */}

                    {selectedFile && (

                        <div
                            style={{
                                marginTop: "10px",
                                marginBottom: "10px",
                            }}
                        >

                            Selected file:

                            {" "}

                            <strong>
                                {selectedFile.name}
                            </strong>

                            {" "}

                            (
                            {(
                                selectedFile.size /
                                1024
                            ).toFixed(1)}
                            {" "}
                            KB
                            )

                        </div>

                    )}


                    {/* UPLOAD ERROR */}

                    {uploadError && (

                        <div className="error">

                            {uploadError}

                        </div>

                    )}


                    {/* ANALYZE BUTTON */}

                    <button
                        type="button"

                        onClick={
                            handleAnalyze
                        }

                        disabled={
                            !selectedFile ||
                            analyzing
                        }
                    >

                        {analyzing
                            ? "Analyzing..."
                            : "Analyze Conversation"
                        }

                    </button>


                    {/* =====================================
                        ANALYSIS RESULT
                    ===================================== */}

                    {analysisResult && (

                        <div
                            style={{
                                marginTop: "30px",
                            }}
                        >

                            <h2>
                                Analysis Result
                            </h2>


                            {/* OVERALL SENTIMENT */}

                            {analysisResult.overall_sentiment && (

                                <div className="profile-row">

                                    <strong>
                                        Overall Sentiment
                                    </strong>

                                    <span>
                                        {
                                            analysisResult
                                                .overall_sentiment
                                        }
                                    </span>

                                </div>

                            )}


                            {/* SCORE */}

                            {analysisResult.overall_score !==
                                undefined && (

                                <div className="profile-row">

                                    <strong>
                                        Sentiment Score
                                    </strong>

                                    <span>

                                        {
                                            typeof analysisResult
                                                .overall_score ===
                                            "number"

                                                ? `${(
                                                    analysisResult
                                                        .overall_score *
                                                    100
                                                ).toFixed(1)}%`

                                                : analysisResult
                                                    .overall_score
                                        }

                                    </span>

                                </div>

                            )}


                            {/* SUMMARY */}

                            {analysisResult.summary && (

                                <div
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >

                                    <h3>
                                        Summary
                                    </h3>

                                    <p>
                                        {
                                            analysisResult.summary
                                        }
                                    </p>

                                </div>

                            )}


                            {/* EMOTIONS */}

                            {analysisResult.emotions && (

                                <div
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >

                                    <h3>
                                        Emotions
                                    </h3>

                                    {Object.entries(
                                        analysisResult.emotions
                                    ).map(
                                        (
                                            [
                                                emotion,
                                                score,
                                            ]
                                        ) => (

                                            <div
                                                className="profile-row"
                                                key={emotion}
                                            >

                                                <strong>
                                                    {emotion}
                                                </strong>

                                                <span>

                                                    {
                                                        typeof score ===
                                                        "number"

                                                            ? `${(
                                                                score *
                                                                100
                                                            ).toFixed(1)}%`

                                                            : score
                                                    }

                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}


                            {/* SENTENCE LEVEL */}

                            {Array.isArray(
                                analysisResult.sentences
                            ) && (

                                <div
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >

                                    <h3>
                                        Sentence-Level Sentiment
                                    </h3>


                                    {analysisResult
                                        .sentences
                                        .map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <div
                                                    key={
                                                        index
                                                    }

                                                    style={{
                                                        padding:
                                                            "10px",
                                                        marginBottom:
                                                            "8px",
                                                        border:
                                                            "1px solid #ddd",
                                                        borderRadius:
                                                            "6px",
                                                    }}
                                                >

                                                    <p>

                                                        <strong>
                                                            Sentence{" "}
                                                            {index +
                                                                1}
                                                            :
                                                        </strong>

                                                        {" "}

                                                        {
                                                            item.sentence ||
                                                            item.text
                                                        }

                                                    </p>


                                                    <p>

                                                        <strong>
                                                            Sentiment:
                                                        </strong>

                                                        {" "}

                                                        {
                                                            item.sentiment
                                                        }


                                                        {item.score !==
                                                            undefined && (

                                                            <>

                                                                {" "}

                                                                (
                                                                {
                                                                    typeof item.score ===
                                                                    "number"

                                                                        ? `${(
                                                                            item.score *
                                                                            100
                                                                        ).toFixed(
                                                                            1
                                                                        )}%`

                                                                        : item.score
                                                                }
                                                                )

                                                            </>

                                                        )}

                                                    </p>

                                                </div>

                                            )
                                        )}

                                </div>

                            )}


                            {/* KPIs */}

                            {analysisResult.kpis && (

                                <div
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >

                                    <h3>
                                        Conversation KPIs
                                    </h3>


                                    {Object.entries(
                                        analysisResult.kpis
                                    ).map(
                                        (
                                            [
                                                kpi,
                                                value,
                                            ]
                                        ) => (

                                            <div
                                                className="profile-row"
                                                key={kpi}
                                            >

                                                <strong>
                                                    {kpi}
                                                </strong>

                                                <span>

                                                    {
                                                        typeof value ===
                                                        "number"

                                                            ? `${(
                                                                value *
                                                                100
                                                            ).toFixed(1)}%`

                                                            : String(
                                                                value
                                                            )
                                                    }

                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}


                            {/* RAW RESULT */}

                            <details
                                style={{
                                    marginTop: "20px",
                                }}
                            >

                                <summary>
                                    View raw analysis response
                                </summary>

                                <pre
                                    style={{
                                        whiteSpace:
                                            "pre-wrap",
                                        wordBreak:
                                            "break-word",
                                        marginTop:
                                            "10px",
                                        padding:
                                            "15px",
                                        background:
                                            "#f5f5f5",
                                        borderRadius:
                                            "6px",
                                        overflowX:
                                            "auto",
                                    }}
                                >
                                    {JSON.stringify(
                                        analysisResult,
                                        null,
                                        2
                                    )}
                                </pre>

                            </details>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default App;