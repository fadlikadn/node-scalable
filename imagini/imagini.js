const express       = require("express");
const sharp         = require("sharp");
const app           = express();
const bodyparser    = require('body-parser');
const path          = require('path');
const fs            = require('fs');

app.get(/\/thumbnail\.(jpg|png)/, (req, res, next) => {
    let format    = (req.params[0] == "png" ? "png" : "jpeg");
    // let width     = 300;
    // let height    = 200;
    // let border    = 5;
    // let bgcolor   = "#fcfcfc";
    // let fgcolor   = "#ddd";
    // let textcolor = "#aaa";
    // let textsize  = 24;
    let width     = +req.query.width || 300;
    let height    = +req.query.height || 200;
    let border    = +req.query.border || 5;
    let bgcolor   = req.query.bgcolor || "#fcfcfc";
    let fgcolor   = req.query.fgcolor || "#ddd";
    let textcolor = req.query.textcolor || "#aaa";
    let textsize  = req.query.textsize || 24;
    let image     = sharp({
        create : {
            width      : width,
            height     : height,
            channels   : 4,
            background : { r: 0, g: 0, b: 0 },
       }
    });

    const thumbnail = new Buffer.from(
`<svg width="${width}" height="${height}">
    <rect
        x="0" y="0"
        width="${width}" height="${height}"
        fill="${fgcolor}" />
    <rect
        x="${border}" y="${border}"
        width="${width - border * 2}" height="${height - border * 2}"
        fill="${bgcolor}" />
    <line
        x1="${border * 2}" y1="${border * 2}"
        x2="${width - border * 2}" y2="${height - border * 2}"
        stroke-width="${border}" stroke="${fgcolor}" />
    <line
        x1="${width - border * 2}" y1="${border * 2}"
        x2="${border * 2}" y2="${height - border * 2}"
        stroke-width="${border}" stroke="${fgcolor}" />
    <rect
        x="${border}" y="${(height - textsize) / 2}"
        width="${width - border * 2}" height="${textsize}"
        fill="${bgcolor}" />
    <text
        x="${width / 2}" y="${height / 2}" dy="8"
        font-family="Helvetica" font-size="${textsize}"
        fill="${textcolor}" text-anchor="middle">${width} x ${height}</text>
</svg>`
    );

    image.overlayWith(thumbnail)[format]().pipe(res);
    // image.composite([{input: thumbnail, blend: 'dest-in' }])
});

// Uploading images
app.post("/uploads/:image", bodyparser.raw({
    limit: "10mb",
    type: "image/*",
}), (req, res) => {
    /*let image = req.params.image.toLowerCase();

    if (!image.match(/\.(png|jpg)$/)) {
        return res.status(403).end();
    }
    // validation handle by app.params("image")

    let len = req.body.length;
    let fd = fs.createWriteStream(path.join(__dirname, "uploads", image), {
        flags: "w+",
        encoding: "binary"
    });

    fd.write(req.body);
    fd.end();

    fd.on("close", () => {
        res.send({ status: "ok", size: len });
    });*/

    // optimized
    let fd = fs.createWriteStream(req.localpath, {
        flags: "w+",
        encoding: "binary"
    });

    fd.end(req.body);

    fd.on("close", () => {
        res.send({ status: "ok", size: req.body.length });
    });
});

// check whether an image exists
app.head("/uploads/:image", (req, res) => {
    /*fs.access(
        path.join(__dirname, "uploads", req.params.image),
        fs.constants.R_OK,
        (err) => {
            res.status(err ? 404 : 200);
            res.end();
        }
    )*/
    fs.access(req.localpath, fs.constants.R_OK, (err) => {
        res.status(err ? 404 : 200).end();
    });
});

app.param("image", (req, res, next, image) => {
    if (!image.match(/\.(png|jpg)$/i)) {
        return res.status(req.method == "POST" ? 403 : 404).end();
    }

    req.image = image;
    req.localpath = path.join(__dirname, "uploads", req.image);

    return next();
});

app.param("width", (req, res, next, width) => {
    req.width = +width;

    return next();
});

app.param("height", (req, res, next, height) => {
    req.height = +height;

    return next();
});

app.param("greyscale", (req, res, next, greyscale) => {
    if (greyscale != "bw") return next("route");

    req.greyscale = true;

    return next();
});

/** 
 * Allow 3 different download scenarios :
 * 
 * - A particular fixed-size image
 * - An aspect ratio resize by passing only width or height
 * - A full-size image
 * */ 
app.get("/uploads/:width(\\d+)x:height(\\d+)-:greyscale-:image", download_image);
app.get("/uploads/:width(\\d+)x:height(\\d+)-:image", download_image);
app.get("/uploads/_x:height(\\d+)-:greyscale-:image", download_image);
app.get("/uploads/_x:height(\\d+)-:image", download_image);
app.get("/uploads/:width(\\d+)x_-:greyscale-:image", download_image);
app.get("/uploads/:width(\\d+)x_-:image", download_image);
// optimized
app.get("/uploads/:greyscale-:image", download_image);
app.get("/uploads/:image", download_image);

function download_image(req, res) {
    fs.access(req.localpath, fs.constants.R_OK, (err) => {
        if (err) return res.status(404).end();

        let image = sharp(req.localpath);

        console.log(req.width, req.height);
        if (req.width  && req.height) {
            image.resize({
                fit: sharp.fit.fill,
            });
        }

        if (req.width || req.height) {
            image.resize(req.width, req.height);
        }

        if (req.greyscale) {
            image.greyscale();
        }

        res.setHeader("Content-Type", "image/" + path.extname(req.image).substr(1));

        image.pipe(res);
    });
}

app.listen(3000, () => {
    console.log("ready");
});

// Downloading images
// app.get("/uploads/:image", (req, res) => {
    /*let ext = path.extname(req.params.image);

    if (!ext.match(/^\.(png|jpg)$/)) {
        return res.status(404).end();
    }

    let fd = fs.createReadStream(path.join(__dirname, "uploads", req.params.image));

    fd.on("error", (e) => {
        if (e.code == "ENOENT") {
            // return res.status(404).end();
            res.status(404);

            if (req.accepts('html')) {
                res.setHeader("Content-Type", "text/html");

                res.write("<strong>Error:</strong> image not found");
            }

            return res.end();
        }

        res.status(500).end();
    });

    res.setHeader("Content-Type", "image/" + ext.substr(1));

    fd.pipe(res);*/

    // Improved
    /*let fd = fs.createReadStream(req.localpath);

    fd.on("error", (e) => {
        res.status(e.code == "ENOENT" ? 404 : 500).end();
    });

    res.setHeader("Content-Type", "image/" + path.extname(req.image).substr(1));

    fd.pipe(res);*/
// });