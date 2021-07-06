import { Router } from "express";
const router = Router();
import redis from "./redis_client.js";
import { getDiscordProfile, isAdmin } from "./auth.js";

const handleError = (err, req, res) => {
    console.error(err);
    return res.status(500).json({ "error": err });
}

const handleSuccess = (msg, req, res) => {
    return res.json({ "success": msg });
}

const VALID_ENTRIES = "entries";
const USERS_LIKING = "users-liking-entry";
const LIKED_BY_USER = "entries-liked-by-user";

// error messages
const ERROR_ENTRY_DOES_NOT_EXIST = "Entry does not exist.";
const ERROR_NOT_ADMIN = "Unauthorized. Not an admin";


// get all likes
router.get("/likes", async (req, res) => {
    let entries = await redis.smembers(VALID_ENTRIES);
    let entriesLikedByUsers = {};

    for (let entry of entries) {
        let users = await redis.smembers(`${USERS_LIKING}:${entry}`);
        entriesLikedByUsers[entry] = users;
    }

    res.json(entriesLikedByUsers);
});

// get likes of single picture
router.get("/likes/by-entry/:entry", [getDiscordProfile, isAdmin], async (req, res) => {
    let { entry } = req.params;

    if (!isAdmin) {
        return res.status(401).json({ error: ERROR_NOT_ADMIN });
    }

    let key = `${USERS_LIKING}:${entry}`;
    if (!await redis.sismember(VALID_ENTRIES, entry)) {
        return res.status(404).json({ error: ERROR_ENTRY_DOES_NOT_EXIST });
    }

    let users = await redis.smembers(key);
    return res.json(users);
});

// get likes of single picture
router.get("/likes/by-user/:id?", [getDiscordProfile, isAdmin], async (req, res) => {
    let { discordProfile } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    let id = req.params.id || discordProfile.id;

    // reject if someone is asking for a diff user id and is not an admin
    if (id != discordProfile.id && !isAdmin) {
        return res.status(401).json({ error: ERROR_NOT_ADMIN });
    }

    let key = `${LIKED_BY_USER}:${id}`;
    if (!await redis.exists(key)) {
        return res.status(404).json({ error: ERROR_ENTRY_DOES_NOT_EXIST });
    }

    let entries = await redis.smembers(key);
    return res.json(entries);
});

// like a picture
router.get("/like/:entry", getDiscordProfile, async (req, res) => {
    let { entry } = req.params;
    let { discordProfile } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    redis.sismember(VALID_ENTRIES, entry).then((value) => {
        if (!value) {
            throw ERROR_ENTRY_DOES_NOT_EXIST;
        }
    }).then(() => {
        redis.sadd(`${USERS_LIKING}:${entry}`, discordProfile.id).catch(handleError);
        redis.sadd(`${LIKED_BY_USER}:${discordProfile.id}`, entry).catch(handleError);
    }).then(() => {
        handleSuccess(`liked ${entry}`, req, res);
    }).catch(err => handleError(err, req, res));
});

// unlike a picture
router.get("/unlike/:entry", getDiscordProfile, async (req, res) => {
    let { entry } = req.params;
    let { discordProfile } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    redis.sismember(VALID_ENTRIES, entry).then((value) => {
        if (!value) {
            throw ERROR_ENTRY_DOES_NOT_EXIST;
        }
    }).then(() => {
        redis.srem(`${USERS_LIKING}:${entry}`, discordProfile.id).catch(handleError);
        redis.srem(`${LIKED_BY_USER}:${discordProfile.id}`, entry).catch(handleError);
    }).then(() => {
        handleSuccess(`unliked ${entry}`, req, res);
    }).catch(err => handleError(err, req, res));
});


// get all likes
router.get("/entries", async (req, res) => {
    let entries = await redis.smembers(VALID_ENTRIES);
    res.json(entries);
});


// add a picture to be liked
router.get("/entries/add/:entry", [getDiscordProfile, isAdmin], async (req, res) => {
    let { entry } = req.params;
    let { discordProfile, isAdmin } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    if (!isAdmin) {
        return res.status(401).json({ error: ERROR_NOT_ADMIN, profile: discordProfile });
    }

    redis.sadd(VALID_ENTRIES, entry).then(() => {
        handleSuccess(`added ${entry}`, req, res);
    }).catch(err => handleError(err, req, res));
});


// remove a picture to be liked
router.get("/entries/del/:entry", [getDiscordProfile, isAdmin], async (req, res) => {
    let { entry } = req.params;
    let { discordProfile, isAdmin } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    if (!isAdmin) {
        return res.status(401).json({ error: ERROR_NOT_ADMIN, profile: discordProfile });
    }

    redis.srem(VALID_ENTRIES, entry).then(() => {
        handleSuccess(`removed ${entry}`, req, res);
    }).catch(err => handleError(err, req, res));
});

export default router;