const express = require('express');
const router = express.Router();
const axios = require('axios');
const hbs = require('hbs');
const SpotifyWebApi = require('spotify-web-api-node');


hbs.registerHelper('each_upto', function (ary, max, options) {
    if (!ary || ary.length == 0)
        return options.inverse(this);

    var result = [];
    for (var i = 0; i < max && i < ary.length; i++)
        result.push(options.fn(ary[i]));
    return result.join('');
});

var spotifyApi = new SpotifyWebApi({
    clientId: '10108018aed74ed4aaf69a1e83cd5adb',
    clientSecret: '8f9cac2afdef49ed9ad0dd37f7598446'
});

spotifyApi.clientCredentialsGrant().then(
    function (data) {
        console.log('The access token is ' + data.body.access_token);
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body.access_token);

        exports.spotifyApi = spotifyApi;
        console.log(module.exports);
    },
    function (err) {
        console.log(
            'Something went wrong when retrieving an access token',
            err.message
        );
    }
);

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

router.post('/play', async (req, res) => {
    const recommendedTrackNames = [];
    const recommendedTracks = [];
    await spotifyApi.searchTracks(`${req.body.songName} ${req.body.albumName}`)// give track and artist name from jiosaavn api
        .then(async (data) => {
            // console.log("searching")
            const songId = data.body.tracks.items[0].id;// get the song id and feed it to recomm system
            await spotifyApi.getRecommendations({
                seed_tracks: [songId]
            }).then(data => {
                // console.log("recomm");
                const tracks = data.body.tracks;
                for (let i = 0; i < Math.min(tracks.length, 5); i++) {
                    // console.log(tracks[i].name);
                    recommendedTrackNames.push(tracks[i].name)
                }
                // recommendedTrackNames.forEach(name => console.log(name))
            }, (err) => console.log(err))
        });
    // console.log(recommendedTrackNames.length);
    for (let i = 0; i < recommendedTrackNames.length; i++) {
        await axios.get(`https://saavn.me/search/songs?query=${recommendedTrackNames[i]}&page=1&limit=1`)
            .then(data => {
                console.log("pushing");
                recommendedTracks.push(data.data.results[0]);
            })
    }
    // recommendedTrackNames.forEach((trackName) => {
    //     console.log("fetching");
    //     axios.get(`https://saavn.me/search/songs?query=${trackName}&page=1&limit=1`)
    //         .then(async data => {
    //             console.log("pushing")
    //             recommendedTracks.push(data.data.results[0]);
    //         }, err => console.log(err));
    // });
    console.log("random");
    res.render('nowPlaying', {
        songUrl: req.body.songUrl,
        recommendedTracks: recommendedTracks
    })
    console.log("playing")
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
