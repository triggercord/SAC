import fetch from "node-fetch";
import express from "express";
import config from "./config.js";

const isAdmin = async (req, res, next) => {
    let id = `${req.discordProfile.id}`;
    let isAdmin = config.admins.includes(id);
    req.isAdmin = isAdmin;
    next();
}

const getDiscordProfile = async (req, res, next) => {
    let { access_token, token_type, expires_in, scope } = req.query;

    let userResult;
    try {
        userResult = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${token_type} ${access_token}`,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json(err);
    }

    let discordProfile;

    try {
        discordProfile = await userResult.json();
    } catch (err) {
        console.error(err);
        return res.status(500).json(err);
    }

    req.discordProfile = discordProfile;
    req.accessToken = access_token;
    req.tokenType = token_type;

    next();
};


export { getDiscordProfile, isAdmin };
