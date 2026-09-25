/**
 * dev-server - fast, rock-solid static server for Earth & Incursio
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PUBLIC_DIR = path.resolve(__dirname, "public");

const MIME_TYPES = {
    ".html": "text/html; charset=UTF-8",
    ".css": "text/css; charset=UTF-8",
    ".js": "application/javascript; charset=UTF-8",
    ".json": "application/json; charset=UTF-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
};

function handler(req, res) {
    let reqUrl = req.url.split("?")[0];
    if (reqUrl === "/" || reqUrl === "") {
        reqUrl = "/index.html";
    }

    const safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, "");
    const filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=UTF-8" });
            res.end("404 Not Found");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const acceptEncoding = req.headers["accept-encoding"] || "";

        const headers = {
            "Content-Type": contentType,
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=120"
        };

        const compress = /text|javascript|json|svg/.test(contentType);

        if (compress && acceptEncoding.includes("gzip")) {
            headers["Content-Encoding"] = "gzip";
            res.writeHead(200, headers);
            fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
        } else {
            headers["Content-Length"] = stats.size;
            res.writeHead(200, headers);
            fs.createReadStream(filePath).pipe(res);
        }
    });
}

const server = http.createServer(handler);

const portArg = process.env.PORT || process.argv[2] || "3000,8080";
const ports = portArg.split(",").map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));

ports.forEach(port => {
    const s = http.createServer(handler);
    s.listen(port, () => {
        console.log(`Incursio Server listening on http://localhost:${port}`);
    });
    s.on("error", err => {
        console.warn(`Could not listen on port ${port}: ${err.message}`);
    });
});
