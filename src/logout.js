import { Router } from "express";
const router = Router();
import redis from "./redis_client.js";
import { getDiscordProfile, isAdmin } from "./auth.js";
import fetch from "node-fetch";

const handleError = (err, req, res) => {
    console.error(err);
    return res.status(500).json({ "error": err });
}

const handleSuccess = (msg, req, res) => {
    return res.json({ "success": msg });
}

import config from "./config.js";

router.get("/logout", getDiscordProfile, async (req, res) => {
    let { discordProfile, accessToken, tokenType } = req;
    let { clientId, clientSecret } = config;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    try {
        let response = await fetch("https://discord.com/api/oauth2/token/revoke", {
            method: "POST",
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                token: accessToken,
                token_type_hint: "access_token",
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                authorization: `${tokenType} ${accessToken}`,
            },
        });
        let json = await response.json();
        return handleSuccess("logged out", req, res);
    } catch (err) {
        return handleError("logout not successful", req, res);
    }
});


export default router;