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

// get all likes
router.get("/likes", async (req, res) => {
    redis.zrangebyscore("likes", "0", "+inf", "WITHSCORES").then((values) => {
        let result = {};
        for (let i = 0; i < values.length; i += 2) {
            result[values[i]] = values[i + 1];
        }
        res.json(result);
    }).catch(err => handleError(err, req, res));
});

// get likes of single picture
router.get("/likes/:filename", async (req, res) => {
    let filename = req.params.filename;
    redis.zscore("likes", filename).then((score) => {
        if (!score) {
            return res.status(404).json({ "error": "not found" });
        }
        res.json({ filename: score });
    }).catch(err => handleError(err, req, res));
});

// like a picture
router.get("/like/:filename", getDiscordProfile, async (req, res) => {
    let { filename } = req.params;
    let { discordProfile } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    redis.sismember("filenames", filename).then((value) => {
        if (!value) {
            throw "Invalid filename";
        }
    }).then(() => {
        let key = `likes:${filename}`;
        redis.sadd(key, discordProfile.id).catch(handleError);
    }).then(() => {
        handleSuccess(`liked ${filename}`, req, res);
    }).catch(err => handleError(err, req, res));
});

// unlike a picture
router.get("/unlike/:filename", getDiscordProfile, async (req, res) => {
    let { filename } = req.params;
    let { discordProfile } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    redis.sismember("filenames", filename).then((value) => {
        if (value === 0) {
            throw "Invalid filename";
        }
    }).then(() => {
        let key = `likes:${filename}`;
        redis.srem(key, discordProfile.id).catch(handleError);
    }).then(() => {
        handleSuccess(`unliked ${filename}`, req, res);
    }).catch(err => handleError(err, req, res));
});

// add a picture to be liked
router.get("/add/:filename", [getDiscordProfile, isAdmin], async (req, res) => {
    let { filename } = req.params;
    let { discordProfile, isAdmin } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    redis.sadd("filenames", filename).then(() => {
        handleSuccess(`added ${filename}`, req, res);
    }).catch(err => handleError(err, req, res));
});

// remove a picture to be liked
router.get("/del/:filename", [getDiscordProfile, isAdmin], async (req, res) => {
    let { filename } = req.params;
    let { discordProfile, isAdmin } = req;

    // if there is an error, because the token is invalid or something
    if (discordProfile.message) {
        return res.status(401).json(discordProfile);
    }

    redis.srem("filenames", filename).then(() => {
        handleSuccess(`removed ${filename}`, req, res);
    }).catch(err => handleError(err, req, res));
});

export default router;