const express = require('express');
const router = express.Router();
const axios = require('axios');
const hbs = require('hbs');

hbs.registerHelper('each_upto', function (ary, max, options) {
    if (!ary || ary.length == 0)
        return options.inverse(this);

    var result = [];
    for (var i = 0; i < max && i < ary.length; ++i)
        result.push(options.fn(ary[i]));
    return result.join('');
});

router.get('/', function (req, res) {
    console.log("jiosaavn api");
    axios.get('https://saavn.me/trending')
        .then(function (data) {
            var trending = data.data.results.filter((data) => {
                return data.type === "album";
            });
            res.render('index', {
                trending: trending
            });
        });
});

router.get('/albumtrack/:alid', function (req, res) {
    axios.get(`https://saavn.me/albums?id=${req.params.alid}`)
        .then((data) => {
            let resultOne = data.data.results.songs;
            let display = true;
            res.render('albumtrack', {
                resultOne: resultOne,
                display: display
            });
        }, function (err) {
            console.log('Something went wrong!', err);
        })
});

router.get('/search', (req, res) => {
    if (req.query.searchby === "albums") {
        axios.get(`https://saavn.me/search/all?query=${req.query.artist}`)
            .then((data) => {
                var ar = data.data.results.albums.data;
                let display = true;
                res.render('albums', {
                    ar: ar,
                    display: display
                });
            }, (err) => {
                console.log('Something went wrong!', err);
            })
    }
    else {
        axios.get(`https://saavn.me/search/songs?query=${req.query.artist}&page=1&limit=10`)
            .then((data) => {
                var ar = data.data.results;
                let display = true;
                res.render('stracks', {
                    ar: ar,
                    display: display
                });
            }, (err) => {
                console.error(err);
            })
    }
});

module.exports.jiosaavnRoutes = router;
