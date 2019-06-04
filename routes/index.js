var express = require("express");
var router = express.Router();
const axios = require("axios");

router.post("/search", async function(req, res, next) {
    const { apiKey, cachedResults = {} } = req.session;
    const { q, page = 1 } = req.body;

    if (!q) {
        res.statusMessage = "Enter search query";
        return res.status(400).end();
    }
    if (!!cachedResults[q] && !!cachedResults[q][page]) {
        return res.json({ articles: cachedResults[q][page] });
    }
    if (!apiKey) {
        res.statusMessage = "Enter API key";
        return res.status(403).end();
    }
    try {
        // TODO pagination
        const results = await axios.get("https://newsapi.org/v2/everything", {
            params: {
                q,
                apiKey,
                page,
                pageSize: 10,
            },
        });

        if (results && results.data && results.data.articles) {
            cachedResults[q] = cachedResults[q] || {};
            cachedResults[q][page] = results.data.articles;
            req.session.cachedResults = cachedResults;
        }
        res.json({ articles: results.data.articles });
    } catch (error) {
        res.statusMessage = "Something went wrong";
        res.status(500).end();
    }
});

router.get("/searches", function(req, res, next) {
    const recent = Object.keys(req.session.cachedResults || {});
    res.json({ recent });
});

router.delete("/searches", function(req, res, next) {
    delete req.session.cachedResults;
    res.json({ recent: [] });
});

router.post("/api-key", function(req, res, next) {
    req.session.apiKey = req.body.apiKey;
    res.json({ success: true });
});

router.get("/api-key", function(req, res, next) {
    const hasApiKey = !!req.session.apiKey;
    res.json(hasApiKey);
});

router.delete("/api-key", function(req, res, next) {
    delete req.session.apiKey;
    res.json({ success: true });
});

module.exports = router;
