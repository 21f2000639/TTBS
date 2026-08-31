import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabaseClient";

function App() {
    // =====================================================
    // GENERAL STATE
    // =====================================================

    const [currentView, setCurrentView] = useState("login");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // REGISTER STATE
    // =====================================================

    const [registerId, setRegisterId] = useState("");
    const [registerName, setRegisterName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [issueStatus, setIssueStatus] = useState("");

    // =====================================================
    // LOGIN STATE
    // =====================================================

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // =====================================================
    // ANALYSIS STATE
    // =====================================================

    const [selectedFile, setSelectedFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [uploadError, setUploadError] = useState("");

    // =====================================================
    // LOAD CURRENT USER
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
                email: authUser.email || "",
            });

            setCurrentView("dashboard");
        } catch (error) {
            console.error("SESSION ERROR:", error);

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
    // AUTH LISTENER
    // =====================================================

    useEffect(() => {
        loadCurrentUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user) {
                    const authUser = session.user;

                    setUser({
                        id:
                            authUser.user_metadata?.custom_id ||
                            authUser.id,
                        name:
                            authUser.user_metadata?.name ||
                            "",
                        email: authUser.email || "",
                    });

                    setCurrentView("dashboard");
                } else {
                    setUser(null);
                    setCurrentView("login");
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

        if (!registerId.trim()) {
            setError("Please enter an ID.");
            return;
        }

        const numericId = Number(registerId);

        if (!Number.isInteger(numericId)) {
            setError("ID must be a valid number.");
            return;
        }

        if (!registerName.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (!registerEmail.trim()) {
            setError("Please enter your email.");
            return;
        }

        const cleanEmail =
            registerEmail.trim().toLowerCase();

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!registerPassword) {
            setError("Please enter a password.");
            return;
        }

        if (registerPassword.length < 6) {
            setError(
                "Password must be at least 6 characters."
            );
            return;
        }

        if (registerPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const {
                data,
                error,
            } = await supabase.auth.signUp({
                email: cleanEmail,
                password: registerPassword,
                options: {
                    data: {
                        name: registerName.trim(),
                        custom_id: numericId,
                    },
                },
            });

            if (error) {
                throw error;
            }

            console.log("REGISTERED USER:", data.user);

            setRegisterId("");
            setRegisterName("");
            setRegisterEmail("");
            setRegisterPassword("");
            setConfirmPassword("");

            setLoginEmail(cleanEmail);

            alert(
                "Registration successful! Please login."
            );

            setCurrentView("login");
        } catch (error) {
            console.error("REGISTRATION ERROR:", error);

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
            setError("Please enter your email.");
            return;
        }

        if (!loginPassword) {
            setError("Please enter your password.");
            return;
        }

        const cleanEmail =
            loginEmail.trim().toLowerCase();

        try {
            setLoading(true);
            setError("");

            const {
                data,
                error,
            } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: loginPassword,
            });

            if (error) {
                throw error;
            }

            const authUser = data.user;

            setUser({
                id:
                    authUser.user_metadata?.custom_id ||
                    authUser.id,
                name:
                    authUser.user_metadata?.name ||
                    "",
                email: authUser.email || "",
            });

            setLoginPassword("");
            setCurrentView("dashboard");
        } catch (error) {
            console.error("LOGIN ERROR:", error);

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
        const file = e.target.files?.[0];

        console.log("========== MOBILE FILE TEST ==========");
        console.log("Event:", e);
        console.log("Files:", e.target.files);
        console.log("File:", file);

        if (!file) {
            console.log("NO FILE RECEIVED");

            setSelectedFile(null);
            setUploadError("No file was selected.");
            return;
        }

        console.log("FILE NAME:", file.name);
        console.log("FILE TYPE:", file.type);
        console.log("FILE SIZE:", file.size);

        // Reset previous analysis
        setUploadError("");
        setAnalysisResult(null);
        setIssueStatus("");

        // Extension check
        if (!file.name.toLowerCase().endsWith(".txt")) {
            console.log("REJECTED: Not TXT");

            setUploadError(
                "Please upload a .txt file."
            );

            setSelectedFile(null);
            e.target.value = "";

            return;
        }

        // Size check
        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            console.log("REJECTED: File too large");

            setUploadError(
                "File is too large. Maximum size is 5 MB."
            );

            setSelectedFile(null);
            e.target.value = "";

            return;
        }

        console.log("✅ FILE ACCEPTED");
        console.log("Setting selected file:", file.name);

        setSelectedFile(file);
    };
    // =====================================================
    // NORMALIZE N8N RESULT
    // =====================================================

    const normalizeResult = (result) => {
        if (
            !result ||
            typeof result !== "object" ||
            Array.isArray(result)
        ) {
            throw new Error(
                "Invalid analysis response received from n8n."
            );
        }

        if (!result.overall_sentiment) {
            throw new Error(
                "overall_sentiment is missing from n8n response."
            );
        }

        const sentiment = String(
            result.overall_sentiment
        )
            .trim()
            .toLowerCase();

        if (
            ![
                "positive",
                "negative",
                "neutral",
            ].includes(sentiment)
        ) {
            throw new Error(
                `Invalid sentiment returned: ${sentiment}`
            );
        }

        result.overall_sentiment = sentiment;

        if (
            typeof result.overall_score !==
            "number"
        ) {
            result.overall_score = 0;
        }

        if (
            !result.kpis ||
            typeof result.kpis !== "object"
        ) {
            result.kpis = {};
        }

        if (
            !Array.isArray(result.sentences)
        ) {
            result.sentences = [];
        }

        // -------------------------------------------------
        // CALL CLASSIFICATION
        // -------------------------------------------------

        if (
            !result.call_classification ||
            typeof result.call_classification !==
                "object"
        ) {
            result.call_classification = {};
        }

        const classification =
            result.call_classification;

        classification.primary_category =
            classification.primary_category ||
            "Not available";

        classification.subcategory =
            classification.subcategory ||
            "Not available";

        classification.primary_issue =
            classification.primary_issue ||
            "Primary issue was not identified.";

        classification.issue_summary =
            classification.issue_summary ||
            "No issue summary was returned.";

        classification.other_issues =
            Array.isArray(
                classification.other_issues
            )
                ? classification.other_issues
                : Array.isArray(
                      classification.secondary_topics
                  )
                ? classification.secondary_topics
                : [];

        classification.status =
            classification.status ||
            "Not available";

        classification.status_reason =
            classification.status_reason ||
            "";

        classification.resolution =
            classification.resolution ||
            "No resolution details were returned.";

        classification.resolution_outcome =
            classification.resolution_outcome ||
            "Not available";

        // -------------------------------------------------
        // TOP-LEVEL AI RESOLUTION
        // -------------------------------------------------
        // Gemini should return:
        // {
        //   "resolution": {
        //      "status": "...",
        //      "suggested_steps": [...]
        //   }
        // }
        //
        // Keep a safe empty structure if it is absent.
        // Also support the older nested classification.resolution
        // format without breaking the dashboard.

        if (
            !result.resolution ||
            typeof result.resolution !== "object" ||
            Array.isArray(result.resolution)
        ) {
            result.resolution = {};
        }

        result.resolution.status =
            typeof result.resolution.status === "string"
                ? result.resolution.status
                : "";

        if (
            !Array.isArray(
                result.resolution.suggested_steps
            )
        ) {
            result.resolution.suggested_steps = [];
        }

        return result;
    };

    // =====================================================
    // EXTRACT RESULT FROM N8N RESPONSE
    // =====================================================

    const parseN8NResponse = (response) => {
        console.log(
            "========== RAW N8N RESPONSE =========="
        );

        console.log(response);

        console.log(
            "======================================="
        );

        // -------------------------------------------------
        // DIRECT OBJECT
        // -------------------------------------------------

        if (
            response &&
            typeof response === "object" &&
            !Array.isArray(response) &&
            response.overall_sentiment
        ) {
            return normalizeResult(response);
        }

        // -------------------------------------------------
        // { json: {...} }
        // -------------------------------------------------

        if (
            response?.json &&
            typeof response.json === "object"
        ) {
            if (
                response.json.overall_sentiment
            ) {
                return normalizeResult(
                    response.json
                );
            }
        }

        // -------------------------------------------------
        // ARRAY
        // -------------------------------------------------

        if (Array.isArray(response)) {
            for (const item of response) {
                if (
                    item?.overall_sentiment
                ) {
                    return normalizeResult(item);
                }

                if (
                    item?.json?.overall_sentiment
                ) {
                    return normalizeResult(
                        item.json
                    );
                }
            }
        }

        // -------------------------------------------------
        // DATA
        // -------------------------------------------------

        if (
            response?.data &&
            typeof response.data === "object"
        ) {
            if (
                response.data.overall_sentiment
            ) {
                return normalizeResult(
                    response.data
                );
            }

            if (
                response.data.json
                    ?.overall_sentiment
            ) {
                return normalizeResult(
                    response.data.json
                );
            }
        }

        // -------------------------------------------------
        // TEXT RESPONSE
        // -------------------------------------------------

        let text = null;

        if (
            typeof response?.text === "string"
        ) {
            text = response.text;
        }

        if (
            typeof response?.data?.text ===
            "string"
        ) {
            text = response.data.text;
        }

        if (
            typeof response?.content
                ?.parts?.[0]?.text ===
            "string"
        ) {
            text =
                response.content.parts[0].text;
        }

        if (
            typeof response?.parts?.[0]?.text ===
            "string"
        ) {
            text = response.parts[0].text;
        }

        if (text) {
            text = String(text)
                .trim()
                .replace(
                    /\\n/g,
                    "\n"
                )
                .replace(
                    /\\"/g,
                    '"'
                )
                .replace(
                    /^```json\s*/i,
                    ""
                )
                .replace(
                    /^```\s*/i,
                    ""
                )
                .replace(
                    /\s*```$/i,
                    ""
                )
                .trim();

            const firstBrace =
                text.indexOf("{");

            const lastBrace =
                text.lastIndexOf("}");

            if (
                firstBrace !== -1 &&
                lastBrace !== -1
            ) {
                const jsonText =
                    text.slice(
                        firstBrace,
                        lastBrace + 1
                    );

                try {
                    return normalizeResult(
                        JSON.parse(jsonText)
                    );
                } catch (error) {
                    console.error(
                        "TEXT JSON PARSE ERROR:",
                        error
                    );
                }
            }
        }

        console.error(
            "COMPLETE N8N RESPONSE:",
            JSON.stringify(
                response,
                null,
                2
            )
        );

        throw new Error(
            "n8n returned a response, but the analysis JSON could not be found."
        );
    };

    // =====================================================
    // ANALYZE CONVERSATION
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

            const formData = new FormData();

            formData.append(
                "file",
                selectedFile,
                selectedFile.name
            );

            console.log(
                "SENDING FILE:",
                selectedFile.name
            );

            const response = await fetch(
                webhookUrl,
                {
                    method: "POST",
                    body: formData,
                }
            );

            console.log(
                "N8N STATUS:",
                response.status
            );

            if (!response.ok) {
                const errorText =
                    await response.text();

                console.error(
                    "N8N ERROR:",
                    errorText
                );

                throw new Error(
                    `Analysis request failed with status ${response.status}`
                );
            }

            const responseText =
                await response.text();

            console.log(
                "========== N8N RESPONSE TEXT =========="
            );

            console.log(responseText);

            console.log(
                "========================================"
            );

            if (!responseText.trim()) {
                throw new Error(
                    "n8n returned an empty response."
                );
            }

            let rawResult;

            try {
                rawResult =
                    JSON.parse(responseText);
            } catch (error) {
                console.error(
                    "OUTER JSON PARSE ERROR:",
                    error
                );

                throw new Error(
                    "n8n returned an invalid JSON response."
                );
            }

            const finalResult =
                parseN8NResponse(rawResult);

            console.log(
                "========== FINAL ANALYSIS =========="
            );

            console.log(finalResult);

            console.log(
                "===================================="
            );

            setAnalysisResult(finalResult);

            // Automatically take the user
            // to the Sentiment Analysis page
            setCurrentView("sentiment");
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

            const { error } =
                await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            setUser(null);
            setLoginPassword("");
            setSelectedFile(null);
            setAnalysisResult(null);
            setUploadError("");
            setIssueStatus("");
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
    // NAVIGATION
    // =====================================================

    const navigateTo = (view) => {
        setCurrentView(view);
    };

    // =====================================================
    // HELPERS
    // =====================================================

    const getSentimentEmoji = (sentiment) => {
        switch (
            String(sentiment).toLowerCase()
        ) {
            case "positive":
                return "😊";

            case "negative":
                return "😠";

            default:
                return "😐";
        }
    };

    const getSentimentLabel = (sentiment) => {
        const value =
            String(sentiment).toLowerCase();

        if (value === "positive") {
            return "Positive";
        }

        if (value === "negative") {
            return "Negative";
        }

        return "Neutral";
    };

    const getSentimentClass = (sentiment) => {
        const value =
            String(sentiment).toLowerCase();

        if (value === "positive") {
            return "positive";
        }

        if (value === "negative") {
            return "negative";
        }

        return "neutral";
    };

    const getStatusClass = (status) => {
        const value =
            String(status)
                .toLowerCase()
                .replace(/\s+/g, "-");

        if (value.includes("resolved")) {
            return "status-resolved";
        }

        if (value.includes("progress")) {
            return "status-progress";
        }

        if (value.includes("unresolved")) {
            return "status-unresolved";
        }

        if (value.includes("informational")) {
            return "status-info";
        }

        return "status-default";
    };

    const formatPercent = (value) => {
        if (
            typeof value !== "number" ||
            Number.isNaN(value)
        ) {
            return "0%";
        }

        return `${Math.max(
            0,
            Math.min(100, value * 100)
        ).toFixed(1)}%`;
    };

    const formatKpiName = (name) => {
        return name
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                (char) =>
                    char.toUpperCase()
            );
    };

    // =====================================================
    // SENTIMENT COUNTS
    // =====================================================

    const getSentenceCounts = () => {
        const sentences =
            analysisResult?.sentences || [];

        let positive = 0;
        let negative = 0;
        let neutral = 0;

        sentences.forEach((item) => {
            const sentiment =
                String(
                    item.sentiment || "neutral"
                ).toLowerCase();

            if (sentiment === "positive") {
                positive++;
            } else if (
                sentiment === "negative"
            ) {
                negative++;
            } else {
                neutral++;
            }
        });

        return {
            positive,
            negative,
            neutral,
            total:
                positive +
                negative +
                neutral,
        };
    };

    // =====================================================
    // AUTH LOADING
    // =====================================================

    if (checkingSession) {
        return (
            <div className="auth-screen">
                <div className="auth-card">
                    <div className="brand-mark large">
                        T
                    </div>

                    <h1>TTBS</h1>

                    <p>
                        Checking authentication...
                    </p>

                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    // =====================================================
    // LOGIN
    // =====================================================

    if (currentView === "login") {
        return (
            <div className="auth-screen">
                <div className="auth-card">
                    <div className="auth-brand">
                        <div className="brand-mark">
                            T
                        </div>

                        <div>
                            <h1>TTBS</h1>
                            <span>
                                Conversation Intelligence
                            </span>
                        </div>
                    </div>

                    <div className="auth-heading">
                        <span className="eyebrow">
                            WELCOME BACK
                        </span>

                        <h2>
                            Sign in to your workspace
                        </h2>

                        <p>
                            Analyze customer
                            conversations and uncover
                            actionable insights.
                        </p>
                    </div>

                    <form
                        onSubmit={
                            handleLogin
                        }
                    >
                        <div className="input-group">
                            <label htmlFor="login-email">
                                Email
                            </label>

                            <input
                                id="login-email"
                                type="email"
                                placeholder="Enter your email"
                                value={loginEmail}
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

                        <div className="input-group">
                            <label htmlFor="login-password">
                                Password
                            </label>

                            <input
                                id="login-password"
                                type="password"
                                placeholder="Enter your password"
                                value={loginPassword}
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

                        {error && (
                            <div className="error">
                                {error}
                            </div>
                        )}

                        <button
                            className="primary-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign In"}
                            <span>→</span>
                        </button>
                    </form>

                    <div className="auth-switch">
                        Don't have an account?

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setCurrentView(
                                    "register"
                                );
                            }}
                        >
                            Create account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // REGISTER
    // =====================================================

    if (currentView === "register") {
        return (
            <div className="auth-screen">
                <div className="auth-card register-card">
                    <div className="auth-brand">
                        <div className="brand-mark">
                            T
                        </div>

                        <div>
                            <h1>TTBS</h1>
                            <span>
                                Conversation Intelligence
                            </span>
                        </div>
                    </div>

                    <div className="auth-heading">
                        <span className="eyebrow">
                            GET STARTED
                        </span>

                        <h2>
                            Create your workspace
                        </h2>

                        <p>
                            Set up your TTBS
                            conversation intelligence
                            account.
                        </p>
                    </div>

                    <form
                        onSubmit={
                            handleRegister
                        }
                    >
                        <div className="input-group">
                            <label htmlFor="register-id">
                                ID
                            </label>

                            <input
                                id="register-id"
                                type="number"
                                placeholder="Enter ID"
                                value={registerId}
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

                        <div className="input-group">
                            <label htmlFor="register-name">
                                Name
                            </label>

                            <input
                                id="register-name"
                                type="text"
                                placeholder="Enter your name"
                                value={registerName}
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

                        <div className="input-group">
                            <label htmlFor="register-email">
                                Email
                            </label>

                            <input
                                id="register-email"
                                type="email"
                                placeholder="Enter your email"
                                value={registerEmail}
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

                        <div className="input-group">
                            <label htmlFor="register-password">
                                Password
                            </label>

                            <input
                                id="register-password"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={registerPassword}
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

                        <div className="input-group">
                            <label htmlFor="confirm-password">
                                Confirm Password
                            </label>

                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
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

                        {error && (
                            <div className="error">
                                {error}
                            </div>
                        )}

                        <button
                            className="primary-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating account..."
                                : "Create Account"}
                            <span>→</span>
                        </button>
                    </form>

                    <div className="auth-switch">
                        Already have an account?

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setCurrentView(
                                    "login"
                                );
                            }}
                        >
                            Sign in
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // DASHBOARD SHELL
    // =====================================================

    const classification =
        analysisResult?.call_classification || {};

    const counts = getSentenceCounts();

    const overallScore =
        typeof analysisResult?.overall_score ===
        "number"
            ? analysisResult.overall_score
            : 0;

    const kpis =
        analysisResult?.kpis || {};

    // =====================================================
    // SIDEBAR
    // =====================================================

    const Sidebar = () => (
        <aside className="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-brand">
                    <div className="brand-mark">
                        T
                    </div>

                    <div>
                        <strong>TTBS</strong>

                        <span>
                            Conversation Intelligence
                        </span>
                    </div>
                </div>

                <div className="workspace-label">
                    WORKSPACE
                </div>

                <nav className="nav-menu">
                    <button
                        className={
                            currentView ===
                            "dashboard"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigateTo(
                                "dashboard"
                            )
                        }
                    >
                        <span className="nav-icon">
                            ◈
                        </span>

                        <span>
                            Dashboard
                        </span>
                    </button>

                    <button
                        className={
                            currentView ===
                            "sentiment"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigateTo(
                                "sentiment"
                            )
                        }
                    >
                        <span className="nav-icon">
                            ◉
                        </span>

                        <span>
                            Sentiment Analysis
                        </span>
                    </button>

                    <button
                        className={
                            currentView ===
                            "issues"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigateTo("issues")
                        }
                    >
                        <span className="nav-icon">
                            ◆
                        </span>

                        <span>
                            Key Issues
                        </span>
                    </button>

                    <button
                        className={
                            currentView ===
                            "assistant"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigateTo(
                                "assistant"
                            )
                        }
                    >
                        <span className="nav-icon">
                            ✦
                        </span>

                        <span>
                            AI Assistant
                        </span>
                    </button>
                </nav>
            </div>

            <div className="sidebar-bottom">
                <div className="user-profile">
                    <div className="user-avatar">
                        {(
                            user?.name ||
                            "U"
                        )
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="user-info">
                        <strong>
                            {user?.name ||
                                "User"}
                        </strong>

                        <span>
                            {user?.email ||
                                ""}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );

    // =====================================================
    // HEADER
    // =====================================================

    const PageHeader = ({
        title,
        description,
    }) => (
        <header className="page-header">
            <div>
                <div className="breadcrumb">
                    Workspace
                    <span>/</span>
                    {title}
                </div>

                <h1>{title}</h1>

                <p>{description}</p>
            </div>

            <button
                className="logout-button"
                onClick={handleLogout}
                disabled={loading}
            >
                ↪
                <span>Logout</span>
            </button>
        </header>
    );

    // =====================================================
    // DASHBOARD PAGE
    // =====================================================

    const DashboardPage = () => (
        <>
            <PageHeader
                title="Conversation Intelligence"
                description="Analyze customer conversations and uncover meaningful insights."
            />

            <section className="upload-card">
                <div className="upload-card-header">
                    <div className="section-icon">
                        ↑
                    </div>

                    <div>
                        <h2>
                            Analyze a Conversation
                        </h2>

                        <p>
                            Upload a customer-support
                            conversation in .txt
                            format.
                        </p>
                    </div>
                </div>

                <label
                    className={
                        selectedFile
                            ? "drop-zone has-file"
                            : "drop-zone"
                    }
                    htmlFor="conversation-file"
                >
                    <input
                        id="conversation-file"
                        type="file"
                        accept=".txt,text/plain"
                        onChange={
                            handleFileSelect
                        }
                    />

                    <div className="file-icon">
                        {selectedFile
                            ? "✓"
                            : "▤"}
                    </div>

                    <div className="drop-content">
                        <strong>
                            {selectedFile
                                ? "Conversation selected"
                                : "Upload conversation"}
                        </strong>

                        <span>
                            {selectedFile
                                ? selectedFile.name
                                : "Choose a .txt file to begin analysis."}
                        </span>

                        {selectedFile && (
                            <small>
                                {(
                                    selectedFile.size /
                                    1024
                                ).toFixed(
                                    1
                                )}{" "}
                                KB
                            </small>
                        )}
                    </div>

                    <span className="choose-button">
                        {selectedFile
                            ? "Change File"
                            : "Choose File"}
                    </span>
                </label>

                {uploadError && (
                    <div className="error upload-error">
                        {uploadError}
                    </div>
                )}

                {analysisResult && (
                    <div className="analysis-generated">
                        <div className="generated-icon">
                            ✓
                        </div>

                        <div>
                            <strong>
                                Analysis generated
                            </strong>

                            <span>
                                Your conversation has
                                been successfully
                                analyzed.
                            </span>
                        </div>

                        <button
                            onClick={() =>
                                navigateTo(
                                    "sentiment"
                                )
                            }
                        >
                            View Results →
                        </button>
                    </div>
                )}

                <button
                    className="analyze-button"
                    onClick={handleAnalyze}
                    disabled={
                        !selectedFile ||
                        analyzing
                    }
                >
                    {analyzing
                        ? "Analyzing conversation..."
                        : "Analyze Conversation"}
                    <span>→</span>
                </button>
            </section>

            <section className="dashboard-info-grid">
                <div className="info-card">
                    <div className="info-card-icon purple">
                        ◉
                    </div>

                    <div>
                        <strong>
                            Sentiment Analysis
                        </strong>

                        <span>
                            Understand customer
                            emotional response.
                        </span>
                    </div>
                </div>

                <div className="info-card">
                    <div className="info-card-icon blue">
                        ◆
                    </div>

                    <div>
                        <strong>
                            Key Issue Detection
                        </strong>

                        <span>
                            Identify the main reason
                            behind each call.
                        </span>
                    </div>
                </div>

                <div className="info-card">
                    <div className="info-card-icon green">
                        ✓
                    </div>

                    <div>
                        <strong>
                            Resolution Tracking
                        </strong>

                        <span>
                            Track whether issues are
                            resolved or ongoing.
                        </span>
                    </div>
                </div>
            </section>
        </>
    );

    // =====================================================
    // SENTIMENT PAGE
    // =====================================================

    const SentimentPage = () => {
        if (!analysisResult) {
            return (
                <>
                    <PageHeader
                        title="Sentiment Analysis"
                        description="Detailed sentiment and customer-support analysis."
                    />

                    <div className="empty-state">
                        <div className="empty-icon">
                            ◉
                        </div>

                        <h2>
                            No analysis available
                        </h2>

                        <p>
                            Upload a conversation
                            from the Dashboard to
                            generate sentiment
                            insights.
                        </p>

                        <button
                            className="primary-button compact"
                            onClick={() =>
                                navigateTo(
                                    "dashboard"
                                )
                            }
                        >
                            Go to Dashboard →
                        </button>
                    </div>
                </>
            );
        }

        const sentiment =
            analysisResult.overall_sentiment;

        const sentimentClass =
            getSentimentClass(sentiment);

        const emoji =
            getSentimentEmoji(sentiment);

        return (
            <>
                <PageHeader
                    title="Sentiment Analysis"
                    description="Detailed sentiment and customer-support analysis."
                />

                <section className="analysis-title-row">
                    <div>
                        <span className="eyebrow">
                            ANALYSIS COMPLETE
                        </span>

                        <h2>
                            Conversation Overview
                        </h2>

                        <p>
                            {selectedFile?.name ||
                                "Analyzed conversation"}
                        </p>
                    </div>

                    <div
                        className={`sentiment-pill ${sentimentClass}`}
                    >
                        <span>●</span>
                        {getSentimentLabel(
                            sentiment
                        )}
                    </div>
                </section>

                {/* SENTIMENT HERO */}

                <section
                    className={`sentiment-hero ${sentimentClass}`}
                >
                    <div className="sentiment-visual">
                        <div className="sentiment-ring">
                            <div>
                                <span className="sentiment-emoji">
                                    {emoji}
                                </span>

                                <strong>
                                    {Math.round(
                                        overallScore *
                                            100
                                    )}
                                    %
                                </strong>

                                <small>
                                    Strength
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="sentiment-message">
                        <span className="eyebrow">
                            OVERALL CUSTOMER SENTIMENT
                        </span>

                        <h2>
                            {getSentimentLabel(
                                sentiment
                            )}
                        </h2>

                        <p>
                            The conversation was
                            classified as{" "}
                            <strong>
                                {getSentimentLabel(
                                    sentiment
                                ).toLowerCase()}
                            </strong>{" "}
                            based on the customer's
                            overall emotional response.
                        </p>

                        <div className="sentiment-scale">
                            <span className="sentiment-negative-label">Negative</span>

                            <div className="sentiment-bar">
                                <div
                                    className="sentiment-fill"
                                    style={{
                                        width: `${Math.max(
                                            0,
                                            Math.min(100, overallScore * 100)
                                        )}%`
                                    }}
                                />
                            </div>

                            <span className="sentiment-positive-label">Positive</span>
                        </div>
                    </div>
                </section>

                {/* KPI CARDS */}

                <section className="metric-grid">
                    <MetricCard
                        title="Customer Satisfaction"
                        value={
                            kpis.customer_satisfaction
                        }
                        icon="♡"
                        description="Satisfaction level"
                    />

                    <MetricCard
                        title="Customer Frustration"
                        value={
                            kpis.customer_frustration
                        }
                        icon="!"
                        description="Frustration level"
                    />

                    <MetricCard
                        title="Escalation Risk"
                        value={
                            kpis.escalation_risk
                        }
                        icon="↗"
                        description="Likelihood of escalation"
                    />

                    <MetricCard
                        title="Resolution Likelihood"
                        value={
                            kpis.resolution_likelihood
                        }
                        icon="✓"
                        description="Likelihood of resolution"
                    />
                </section>



                {/* SENTIMENT DISTRIBUTION */}

                <section className="content-card">
                    <div className="card-heading">
                        <div>
                            <span className="eyebrow">
                                SENTENCE ANALYSIS
                            </span>

                            <h3>
                                Sentiment Distribution
                            </h3>

                            <p>
                                Sentiment classification
                                across meaningful
                                conversation sentences.
                            </p>
                        </div>
                    </div>

                    <div className="distribution-layout">
                        <div className="donut-wrapper">
                            <div
                                className="sentiment-donut"
                                style={{
                                    background: `conic-gradient(
                                        #7c5cff 0% ${
                                            counts.total
                                                ? (counts.positive /
                                                      counts.total) *
                                                  100
                                                : 0
                                        }%,
                                        #ef5b6d ${
                                            counts.total
                                                ? (counts.positive /
                                                      counts.total) *
                                                  100
                                                : 0
                                        }% ${
                                            counts.total
                                                ? ((counts.positive +
                                                      counts.negative) /
                                                      counts.total) *
                                                  100
                                                : 0
                                        }%,
                                        #94a3b8 ${
                                            counts.total
                                                ? ((counts.positive +
                                                      counts.negative) /
                                                      counts.total) *
                                                  100
                                                : 0
                                        }% 100%
                                    )`,
                                }}
                            >
                                <div className="donut-center">
                                    <strong>
                                        {counts.total}
                                    </strong>

                                    <span>
                                        Sentences
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="distribution-bars">
                            <DistributionRow
                                label="Positive"
                                emoji="😊"
                                count={
                                    counts.positive
                                }
                                total={
                                    counts.total
                                }
                                className="positive"
                            />

                            <DistributionRow
                                label="Negative"
                                emoji="😠"
                                count={
                                    counts.negative
                                }
                                total={
                                    counts.total
                                }
                                className="negative"
                            />

                            <DistributionRow
                                label="Neutral"
                                emoji="😐"
                                count={
                                    counts.neutral
                                }
                                total={
                                    counts.total
                                }
                                className="neutral"
                            />
                        </div>
                    </div>
                </section>

                {/* SENTENCE LEVEL */}


                <details className="raw-response">
                    <summary>
                        View raw analysis response
                    </summary>

                    <pre>
                        {JSON.stringify(
                            analysisResult,
                            null,
                            2
                        )}
                    </pre>
                </details>
            </>
        );
    };

    // =====================================================
    // METRIC CARD
    // =====================================================

    const MetricCard = ({
        title,
        value,
        icon,
        description,
    }) => {
        const safeValue =
            typeof value === "number"
                ? Math.max(
                      0,
                      Math.min(
                          1,
                          value
                      )
                  )
                : 0;

        return (
            <div className="metric-card">
                <div className="metric-top">
                    <div>
                        <span>
                            {title}
                        </span>

                        <small>
                            {description}
                        </small>
                    </div>

                    <div className="metric-icon">
                        {icon}
                    </div>
                </div>

                <div className="metric-value">
                    {formatPercent(
                        safeValue
                    )}
                </div>

                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${safeValue * 100}%`,
                        }}
                    ></div>
                </div>
            </div>
        );
    };

    // =====================================================
    // DISTRIBUTION ROW
    // =====================================================

    const DistributionRow = ({
        label,
        emoji,
        count,
        total,
        className,
    }) => {
        const percentage = total
            ? (count / total) * 100
            : 0;

        return (
            <div className="distribution-row">
                <div className="distribution-label">
                    <span
                        className={`distribution-emoji ${className}`}
                    >
                        {emoji}
                    </span>

                    <strong>
                        {label}
                    </strong>
                </div>

                <div className="distribution-bar">
                    <div
                        className={`distribution-fill ${className}`}
                        style={{
                            width: `${percentage}%`,
                        }}
                    ></div>
                </div>

                <div className="distribution-value">
                    {count}
                    <span>
                        {percentage.toFixed(
                            0
                        )}
                        %
                    </span>
                </div>
            </div>
        );
    };

    // =====================================================
    // KEY ISSUES PAGE
    // =====================================================
    
    const KeyIssuesPage = () => {
        if (!analysisResult) {
            return (
                <>
                    <PageHeader
                        title="Key Issues"
                        description="Identify the main business issue and track its resolution."
                    />

                    <div className="empty-state">
                        <div className="empty-icon">
                            ◆
                        </div>

                        <h2>
                            No issue analysis available
                        </h2>

                        <p>
                            Analyze a conversation first to
                            identify its primary issue,
                            category, status, and resolution.
                        </p>

                        <button
                            className="primary-button compact"
                            onClick={() =>
                                navigateTo("dashboard")
                            }
                        >
                            Analyze Conversation →
                        </button>
                    </div>
                </>
            );
        }

        // -----------------------------------------------------
        // KEY ISSUE DATA
        // -----------------------------------------------------

        const issueData =
            analysisResult?.call_classification || {};

        const primaryIssue =
            issueData.primary_issue ||
            "Primary issue was not identified.";

        const primaryCategory =
            issueData.primary_category ||
            "Not available";

        const subcategory =
            issueData.subcategory ||
            "Not available";

        const issueSummary =
            issueData.issue_summary ||
            "No issue summary was returned.";

        const otherIssues = Array.isArray(
            issueData.secondary_topics
        )
            ? issueData.secondary_topics
            : Array.isArray(issueData.other_issues)
            ? issueData.other_issues
            : [];

        // -----------------------------------------------------
        // AI RESOLUTION
        // -----------------------------------------------------
        // New n8n structure:
        // analysisResult.resolution.suggested_steps
        //
        // Backward-compatible fallback:
        // analysisResult.call_classification.resolution
        // -----------------------------------------------------

        const aiResolution =
            analysisResult?.resolution || {};

        const suggestedSteps = Array.isArray(
            aiResolution.suggested_steps
        )
            ? aiResolution.suggested_steps.filter(
                  (step) =>
                      typeof step === "string" &&
                      step.trim()
              )
            : [];

        const aiResolutionStatus =
            typeof aiResolution.status === "string"
                ? aiResolution.status
                : "";

        // -----------------------------------------------------
        // USER-CONTROLLED ISSUE STATUS
        // -----------------------------------------------------

        const selectedStatus = issueStatus || "";

        const selectedStatusClass =
            selectedStatus === "Solved"
                ? "status-solved"
                : selectedStatus === "In Progress"
                ? "status-in-progress"
                : selectedStatus === "Not Solved"
                ? "status-not-solved"
                : "";

        const statusProgress =
            selectedStatus === "Solved"
                ? 100
                : selectedStatus === "In Progress"
                ? 65
                : selectedStatus === "Not Solved"
                ? 25
                : 0;

        return (
            <>
                <PageHeader
                    title="Key Issues"
                    description="Understand what the customer contacted support about and track the issue through resolution."
                />

                {/* =================================================
                    PRIMARY ISSUE
                ================================================= */}

                <section className="issue-header-card">
                    <div>
                        <span className="eyebrow">
                            CONVERSATION
                        </span>

                        <h2>
                            {selectedFile?.name ||
                                "Analyzed conversation"}
                        </h2>

                        <p>
                            Primary issue and resolution
                            intelligence extracted from
                            the conversation.
                        </p>
                    </div>

                    {selectedStatus && (
                        <div
                            className={`status-badge ${selectedStatusClass}`}
                        >
                            <span>●</span>
                            {selectedStatus}
                        </div>
                    )}
                </section>

                <section className="primary-issue-card">
                    <div className="primary-issue-label">
                        <span className="issue-star">
                            ★
                        </span>

                        <span>
                            PRIMARY ISSUE
                        </span>
                    </div>

                    <div className="primary-issue-main">
                        <div>
                            <h2>
                                {primaryIssue}
                            </h2>

                            <p>
                                {issueSummary}
                            </p>
                        </div>

                        <div className="issue-category">
                            <span>
                                CATEGORY
                            </span>

                            <strong>
                                {primaryCategory}
                            </strong>

                            <small>
                                {subcategory}
                            </small>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    ISSUE TRACKING
                ================================================= */}

                <section className="content-card">
                    <div className="card-heading">
                        <div>
                            <span className="eyebrow">
                                ISSUE TRACKING
                            </span>

                            <h3>
                                Issue Status
                            </h3>

                            <p>
                                Select and update the current
                                status of the primary issue.
                            </p>
                        </div>

                        {selectedStatus && (
                            <div
                                className={`status-large ${selectedStatusClass}`}
                            >
                                {selectedStatus}
                            </div>
                        )}
                    </div>

                    <div className="issue-status-control">
                        <label htmlFor="issue-status">
                            Current Status
                        </label>

                        <select
                            id="issue-status"
                            value={selectedStatus}
                            onChange={(e) =>
                                setIssueStatus(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                Select status
                            </option>

                            <option value="Solved">
                                Solved
                            </option>

                            <option value="In Progress">
                                In Progress
                            </option>

                            <option value="Not Solved">
                                Not Solved
                            </option>
                        </select>
                    </div>

                    {selectedStatus && (
                        <>
                            <div
                                className={`selected-status ${selectedStatusClass}`}
                            >
                                <span className="status-dot"></span>

                                Current status:
                                {" "}
                                {selectedStatus}
                            </div>

                            <div className="status-progress-wrapper">
                                <div className="status-line">
                                    <div
                                        className="status-line-fill"
                                        style={{
                                            width: `${statusProgress}%`,
                                        }}
                                    ></div>
                                </div>

                                <div className="status-steps">
                                    <div className="status-step completed">
                                        <span>1</span>
                                        <strong>
                                            Identified
                                        </strong>
                                    </div>

                                    <div
                                        className={
                                            statusProgress >= 65
                                                ? "status-step completed"
                                                : "status-step"
                                        }
                                    >
                                        <span>2</span>
                                        <strong>
                                            In Progress
                                        </strong>
                                    </div>

                                    <div
                                        className={
                                            statusProgress >= 100
                                                ? "status-step completed"
                                                : "status-step"
                                        }
                                    >
                                        <span>3</span>
                                        <strong>
                                            Resolved
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!selectedStatus && (
                        <div className="status-not-selected">
                            Select a status above to track
                            the issue.
                        </div>
                    )}

                    {aiResolutionStatus && (
                        <div className="ai-status-note">
                            <span>
                                AI ASSESSMENT
                            </span>

                            <strong>
                                {aiResolutionStatus}
                            </strong>
                        </div>
                    )}
                </section>

                {/* =================================================
                    OTHER ISSUES
                ================================================= */}

                <section className="content-card">
                    <div className="card-heading">
                        <div>
                            <span className="eyebrow">
                                CONVERSATION CONTEXT
                            </span>

                            <h3>
                                Other Issues Discussed
                            </h3>

                            <p>
                                Additional topics raised
                                during the conversation.
                            </p>
                        </div>

                        <div className="count-badge">
                            {otherIssues.length}
                        </div>
                    </div>

                    {otherIssues.length > 0 ? (
                        <div className="issue-tags">
                            {otherIssues.map(
                                (issue, index) => (
                                    <div
                                        className="issue-tag"
                                        key={index}
                                    >
                                        <span>
                                            {index + 1}
                                        </span>

                                        {issue}
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="no-data">
                            No other issues were
                            identified.
                        </div>
                    )}
                </section>

                {/* =================================================
                    AI RESOLUTION
                ================================================= */}

                <section className="resolution-card">
                    <div className="resolution-header">
                        <div>
                            <span className="section-eyebrow">
                                AI RESOLUTION
                            </span>

                            <h3>
                                Suggested Resolution
                            </h3>

                            <p className="resolution-subtitle">
                                Short, issue-specific steps
                                generated from the conversation.
                            </p>
                        </div>

                        <div className="ai-badge">
                            ✦ AI
                        </div>
                    </div>

                    <div className="resolution-issue">
                        <span>
                            PRIMARY ISSUE
                        </span>

                        <strong>
                            {primaryIssue}
                        </strong>
                    </div>

                    {suggestedSteps.length > 0 ? (
                        <div className="resolution-steps">
                            {suggestedSteps.map(
                                (step, index) => (
                                    <div
                                        className="resolution-step"
                                        key={index}
                                    >
                                        <span className="step-number">
                                            {index + 1}
                                        </span>

                                        <span>
                                            {step}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="empty-resolution">
                            <div className="empty-resolution-icon">
                                ✦
                            </div>

                            <div>
                                <strong>
                                    AI resolution steps are
                                    not available yet.
                                </strong>

                                <p>
                                    Make sure the Gemini
                                    response contains
                                    <code>
                                        resolution.suggested_steps
                                    </code>
                                    .
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* =================================================
                    CONVERSATION RESOLUTION
                ================================================= */}

                <section className="resolution-grid">
                    <div className="content-card resolution-card legacy-resolution-card">
                        <div className="resolution-icon">
                            ✓
                        </div>

                        <span className="eyebrow">
                            RESOLUTION
                        </span>

                        <h3>
                            What was done?
                        </h3>

                        <p>
                            {issueData.resolution ||
                                "No resolution details were returned."}
                        </p>
                    </div>

                    <div className="content-card outcome-card">
                        <span className="eyebrow">
                            RESOLUTION OUTCOME
                        </span>

                        <div className="outcome-display">
                            <div className="outcome-circle">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    {issueData.resolution_outcome ||
                                        aiResolutionStatus ||
                                        "Not available"}
                                </strong>

                                <span>
                                    Outcome based on
                                    the conversation.
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </>
        );
    };

    // =====================================================
    // AI ASSISTANT PAGE
    // =====================================================

    const AIAssistantPage = () => {
        const quickQuestions = [
            "What is the main issue?",
            "Why is the customer dissatisfied?",
            "Was the issue resolved?",
            "Summarize this conversation.",
        ];

        const getAssistantResponse = (
            question
        ) => {
            if (!analysisResult) {
                return "Analyze a conversation first, and I can help you interpret the results.";
            }

            const q =
                question.toLowerCase();

            if (
                q.includes("main issue") ||
                q.includes("key issue")
            ) {
                return `The primary issue is: ${classification.primary_issue}. It belongs to the ${classification.primary_category} category.`;
            }

            if (
                q.includes("dissatisfied") ||
                q.includes("sentiment")
            ) {
                return `The overall customer sentiment is ${getSentimentLabel(
                    analysisResult.overall_sentiment
                )}. Customer frustration is ${formatPercent(
                    kpis.customer_frustration
                )}.`;
            }

            if (
                q.includes("resolved")
            ) {
                return `The current issue status is ${classification.status}. The resolution outcome is ${classification.resolution_outcome}.`;
            }

            if (
                q.includes("summarize")
            ) {
                return classification.issue_summary ||
                    "No summary is available.";
            }

            return "I can help interpret the sentiment, key issue, category, status, and resolution from the analyzed conversation.";
        };

        const [assistantMessage, setAssistantMessage] =
            useState("");

        const [assistantAnswer, setAssistantAnswer] =
            useState("");

        const askAssistant = (question) => {
            const value =
                question ||
                assistantMessage;

            if (!value.trim()) {
                return;
            }

            setAssistantAnswer(
                getAssistantResponse(value)
            );

            setAssistantMessage("");
        };

        return (
            <>
                <PageHeader
                    title="AI Assistant"
                    description="Ask questions about your analyzed customer conversation."
                />

                <section className="assistant-layout">
                    <div className="assistant-main">
                        <div className="assistant-welcome">
                            <div className="assistant-avatar">
                                ✦
                            </div>

                            <div>
                                <span className="eyebrow">
                                    TTBS AI ASSISTANT
                                </span>

                                <h2>
                                    How can I help you?
                                </h2>

                                <p>
                                    Ask questions about
                                    the current
                                    conversation and its
                                    analysis.
                                </p>
                            </div>
                        </div>

                        {assistantAnswer && (
                            <div className="assistant-answer">
                                <div className="assistant-avatar small">
                                    ✦
                                </div>

                                <div>
                                    <span>
                                        AI Assistant
                                    </span>

                                    <p>
                                        {
                                            assistantAnswer
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="quick-questions">
                            <span>
                                QUICK QUESTIONS
                            </span>

                            <div>
                                {quickQuestions.map(
                                    (
                                        question,
                                        index
                                    ) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                askAssistant(
                                                    question
                                                )
                                            }
                                        >
                                            {question}
                                            <span>
                                                →
                                            </span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="assistant-input">
                            <input
                                type="text"
                                placeholder="Ask something about this conversation..."
                                value={
                                    assistantMessage
                                }
                                onChange={(e) =>
                                    setAssistantMessage(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {
                                        askAssistant();
                                    }
                                }}
                            />

                            <button
                                onClick={() =>
                                    askAssistant()
                                }
                            >
                                →
                            </button>
                        </div>
                    </div>

                    <aside className="assistant-context">
                        <span className="eyebrow">
                            CURRENT CONTEXT
                        </span>

                        {analysisResult ? (
                            <>
                                <div className="context-item">
                                    <span>
                                        SENTIMENT
                                    </span>

                                    <strong>
                                        {getSentimentEmoji(
                                            analysisResult.overall_sentiment
                                        )}{" "}
                                        {getSentimentLabel(
                                            analysisResult.overall_sentiment
                                        )}
                                    </strong>
                                </div>

                                <div className="context-item">
                                    <span>
                                        CATEGORY
                                    </span>

                                    <strong>
                                        {
                                            classification.primary_category
                                        }
                                    </strong>
                                </div>

                                <div className="context-item">
                                    <span>
                                        STATUS
                                    </span>

                                    <strong>
                                        {
                                            classification.status
                                        }
                                    </strong>
                                </div>
                            </>
                        ) : (
                            <p className="context-empty">
                                No conversation has been
                                analyzed yet.
                            </p>
                        )}
                    </aside>
                </section>
            </>
        );
    };

    // =====================================================
    // MAIN APPLICATION
    // =====================================================

    return (
        <div className="app-shell">
            <Sidebar />

            <main className="main-content">
                <div className="content-container">
                    {currentView ===
                        "dashboard" && (
                        <DashboardPage />
                    )}

                    {currentView ===
                        "sentiment" && (
                        <SentimentPage />
                    )}

                    {currentView ===
                        "issues" && (
                        <KeyIssuesPage />
                    )}

                    {currentView ===
                        "assistant" && (
                        <AIAssistantPage />
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;