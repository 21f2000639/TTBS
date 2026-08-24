import "@supabase/functions-js/edge-runtime.d.ts";


import { createClient } from "supabase";
import bcrypt from "bcrypt";


// =====================================================
// CORS
// =====================================================

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",

    "Access-Control-Allow-Methods":
        "POST, OPTIONS",
};


// =====================================================
// SUPABASE
// =====================================================

const supabaseUrl =
    Deno.env.get("SUPABASE_URL")!;

const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;


const supabase =
    createClient(
        supabaseUrl,
        serviceRoleKey
    );


// =====================================================
// RESPONSE
// =====================================================

function json(
    data: unknown,
    status = 200
) {

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers: {
                ...corsHeaders,

                "Content-Type":
                    "application/json",
            },
        }
    );

}


// =====================================================
// REGISTER
// =====================================================

Deno.serve(async (req) => {

    // -------------------------------------------------
    // CORS
    // -------------------------------------------------

    if (
        req.method ===
        "OPTIONS"
    ) {

        return new Response(
            "ok",
            {
                headers:
                    corsHeaders,
            }
        );

    }


    // -------------------------------------------------
    // ONLY POST
    // -------------------------------------------------

    if (
        req.method !==
        "POST"
    ) {

        return json(
            {
                error:
                    "Method not allowed",
            },
            405
        );

    }


    try {

        // =================================================
        // REQUEST BODY
        // =================================================

        const {
            id,
            name,
            email,
            password,
        } = await req.json();


        // =================================================
        // ID VALIDATION
        // =================================================

        if (
            id === undefined ||
            id === null ||
            id === ""
        ) {

            return json(
                {
                    error:
                        "ID is required",
                },
                400
            );

        }


        const numericId =
            Number(id);


        if (
            !Number.isInteger(
                numericId
            )
        ) {

            return json(
                {
                    error:
                        "ID must be a valid integer",
                },
                400
            );

        }


        // =================================================
        // NAME VALIDATION
        // =================================================

        if (
            !name ||
            !name.trim()
        ) {

            return json(
                {
                    error:
                        "Name is required",
                },
                400
            );

        }


        // =================================================
        // EMAIL VALIDATION
        // =================================================

        if (
            !email ||
            !email.trim()
        ) {

            return json(
                {
                    error:
                        "Email is required",
                },
                400
            );

        }


        const cleanEmail =
            email
                .trim()
                .toLowerCase();


        // =================================================
        // PASSWORD VALIDATION
        // =================================================

        if (!password) {

            return json(
                {
                    error:
                        "Password is required",
                },
                400
            );

        }


        if (
            password.length < 6
        ) {

            return json(
                {
                    error:
                        "Password must be at least 6 characters",
                },
                400
            );

        }


        const cleanName =
            name.trim();


        // =================================================
        // CHECK ID
        // =================================================

        const {
            data: existingId,
            error: idError,
        } = await supabase

            .from("TTBS")

            .select("ID")

            .eq(
                "ID",
                numericId
            )

            .maybeSingle();


        if (idError) {

            console.error(
                "ID CHECK ERROR:",
                idError
            );

            throw idError;

        }


        if (existingId) {

            return json(
                {
                    error:
                        "This ID already exists",
                },
                409
            );

        }


        // =================================================
        // CHECK EMAIL
        // =================================================

        const {
            data: existingEmail,
            error: emailError,
        } = await supabase

            .from("TTBS")

            .select("ID")

            .eq(
                "Email",
                cleanEmail
            )

            .maybeSingle();


        if (emailError) {

            console.error(
                "EMAIL CHECK ERROR:",
                emailError
            );

            throw emailError;

        }


        if (existingEmail) {

            return json(
                {
                    error:
                        "This email is already registered",
                },
                409
            );

        }


        // =================================================
        // HASH PASSWORD
        // =================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );


        // =================================================
        // INSERT INTO TTBS
        // =================================================

        const {
            data: newUser,
            error: insertError,
        } = await supabase

            .from("TTBS")

            .insert({

                ID:
                    numericId,

                Name:
                    cleanName,

                Email:
                    cleanEmail,

                PasswordHash:
                    passwordHash,

            })

            .select(
                "ID, Name, Email"
            )

            .single();


        if (insertError) {

            console.error(
                "DATABASE INSERT ERROR:",
                insertError
            );

            throw insertError;

        }


        // =================================================
        // SUCCESS
        // =================================================

        return json(
            {
                success:
                    true,

                message:
                    "Registration successful",

                user:
                    newUser,
            },
            201
        );


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        return json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Registration failed",
            },
            500
        );

    }

});