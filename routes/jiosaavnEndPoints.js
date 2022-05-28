const express = require('express');
const router = express.Router();
const axios = require('axios');
const hbs = require('hbs');
const SpotifyWebApi = require('spotify-web-api-node');
const randomWords = require('random-words');
const storage = require('node-sessionstorage')


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
    axios.get('https://saavn.me/home')
        .then(function (data) {
            const trendingAlbums = data.data.results.new_trending.filter(data => data.type === "album").slice(0, 6);
            const trendingSongs = data.data.results.new_trending.filter(data => data.type === "song").slice(0, 6);
            res.render('index', {
                trendingAlbums: trendingAlbums,
                trendingSongs: trendingSongs
            });
        });
});

router.get('/trending', function (req, res) {
    console.log("jiosaavn api");
    axios.get('https://saavn.me/trending')
        .then(function (data) {
            var trending = data.data.results.filter((data) => {
                return data.type === "album";
            });
            res.render('trending', {
                trending: trending
            });
        });
});

router.get('/random', (req, res) => {
    let randomSeed = "";
    randomWords(2).forEach(word => randomSeed += (word + ' '));

    axios.get(`https://saavn.me/search/songs?query=${randomSeed}&page=1&limit=10`)
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
})

router.post('/play', async (req, res) => {
    if (storage.getItem('time') == undefined) {
        storage.setItem('time', parseInt(req.body.duration));
    } else {
        const val = parseInt(storage.getItem('time'));
        storage.setItem('time', parseInt(val) + parseInt(req.body.duration));
    }
    const durationListened = parseInt(storage.getItem('time'));

    const searchQuery = `${req.body.songName} ${req.body.albumName}`;
    let recommendedTrackNames = [];
    let recommendedTracks = [];
    let display = true;

    await spotifyApi.searchTracks(searchQuery)// give track and artist name from jiosaavn api
        .then(async (data) => {
            try {
                const fetchedSong = data.body.tracks.items[0];
                const songId = fetchedSong.id;// get the song id and feed it to recomm system
                const artistId = fetchedSong.artists[0].id;

                await spotifyApi.getRecommendations({
                    seed_tracks: songId,
                    seed_artists: artistId
                }).then(data => {
                    const tracks = data.body.tracks.sort((a, b) => {
                        return a.popularity - b.popularity;
                    });
                    for (let i = 0; i < Math.min(tracks.length, 5); i++) {
                        recommendedTrackNames.push(tracks[i].name)
                    }
                }, (err) => {
                    display = false;
                    console.log(err);
                })
            } catch (err) {
                display = false;
                console.log(err);
            }
        }, err => {
            display = false;
            console.log(err);
        });
    for (let i = 0; i < recommendedTrackNames.length; i++) {
        await axios.get(`https://saavn.me/search/songs?query=${recommendedTrackNames[i]}&page=1&limit=1`)
            .then(data => {
                recommendedTracks.push(data.data.results[0]);
            })
    }
    res.render('nowPlaying', {
        songUrl: req.body.songUrl,
        recommendedTracks: recommendedTracks,
        display: display,
        durationListened: durationListened
    })
    recommendedTrackNames = [];
    recommendedTracks = [];
    if (durationListened > 600) {
        storage.setItem('time', 0);
    }
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
                ar.forEach(data => {
                    const imageUrl = data.image;
                    const imageUrlLength = imageUrl.length;
                    data.image = imageUrl.slice(0, imageUrlLength - 9) + '1' + imageUrl.slice(imageUrlLength - 9, imageUrlLength - 6) + '1' + imageUrl.slice(imageUrlLength - 6);
                })
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
