const express = require('express');
const router = express.Router();
const axios = require('axios');
const hbs = require('hbs');
const SpotifyWebApi = require('spotify-web-api-node');
const randomWords = require('random-words');
const storage = require('node-sessionstorage')

// Storing Spotify API clientId and clientSecret
var spotifyApi = new SpotifyWebApi({
    clientId: '10108018aed74ed4aaf69a1e83cd5adb',
    clientSecret: '8f9cac2afdef49ed9ad0dd37f7598446'
});


// Obtaining Authorization Token for accessing Spotify API
spotifyApi.clientCredentialsGrant().then(
    (data) => {
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body.access_token);
        exports.spotifyApi = spotifyApi;
    },
    (err) => {
        console.log(
            'Something went wrong when retrieving an access token',
            err.message
        );
    }
);

// Router for Homepage - fetches trending albums and trending songs
router.get('/', function (req, res) {

    axios.get('https://saavn.me/home')
        .then((data) => {
            const trendingAlbums = data.data.results.new_trending.filter(data => data.type === "album").slice(0, 6);
            const trendingSongs = data.data.results.new_trending.filter(data => data.type === "song").slice(0, 6);

            // render the index.hbs page
            res.render('index', {
                trendingAlbums: trendingAlbums,
                trendingSongs: trendingSongs
            });
        });
});

// Router for Trending Albums page - fetches trending albums
router.get('/trending', function (req, res) {

    axios.get('https://saavn.me/trending')
        .then((data) => {
            var trending = data.data.results.filter((data) => {
                return data.type === "album";
            });

            // render the trending page
            res.render('trending', {
                trending: trending
            });
        });
});

// Router for random songs page - suggests random songs based on randomly generated two-word search terms.
router.get('/random', (req, res) => {

    // generate a random search query containing two words
    let randomSeed = "";
    randomWords(2).forEach(word => randomSeed += (word + ' '));

    axios.get(`https://saavn.me/search/songs?query=${randomSeed}&page=1&limit=10`)
        .then((data) => {
            var ar = data.data.results;
            let display = true;
            res.render('stracks', {
                ar: ar,
                display: display,
                randomPlayer: true
            });
        }, (err) => {
            console.error(err);
        })
})

// Router for nowPlaying - plays the clicked song and suggests five songs based on the current song
router.post('/play', async (req, res) => {

    // Digital Wellbeing - Store the current songs duration in sessionStorage
    if (storage.getItem('time') == undefined) {
        storage.setItem('time', parseInt(req.body.duration));
    } else {
        const val = parseInt(storage.getItem('time'));
        storage.setItem('time', parseInt(val) + parseInt(req.body.duration));
    }
    const durationListened = parseInt(storage.getItem('time'));

    // Obtain the song ID of current song from Spotify and recommend songs using the song ID
    const searchQuery = `${req.body.songName} ${req.body.albumName}`.substring(0, 20);
    let recommendedTrackNames = [];
    let recommendedTracks = [];
    let display = true;

    // Obtain the song ID of current song
    await spotifyApi.searchTracks(searchQuery)// give track and artist name from jiosaavn api
        .then(async (data) => {
            try {
                const fetchedSong = data.body.tracks.items[0];
                const songId = fetchedSong.id;// get the song id and feed it to recomm system
                const artistId = fetchedSong.artists[0].id;

                // Get recommendations based on current song
                await spotifyApi.getRecommendations({
                    seed_tracks: songId,
                    seed_artists: artistId
                }).then((data) => {
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
        }, (err) => {
            display = false;
            console.log(err);
        });

    // Search the Recommended songs on jiosaavn and fetch them
    for (let i = 0; i < recommendedTrackNames.length; i++) {
        await axios.get(`https://saavn.me/search/songs?query=${recommendedTrackNames[i]}&page=1&limit=1`)
            .then(data => {
                recommendedTracks.push(data.data.results[0]);
            })
    }

    // render the nowPlaying page
    res.render('nowPlaying', {
        songUrl: req.body.songUrl,
        recommendedTracks: recommendedTracks,
        display: display,
        durationListened: durationListened
    })
    recommendedTrackNames = [];
    recommendedTracks = [];

    // Once the user is alerted about listening for too long, reset the timer
    if (durationListened > 600) {
        storage.setItem('time', 0);
    }
});

// Router for Album Tracks
router.get('/albumtrack/:alid', function (req, res) {

    axios.get(`https://saavn.me/albums?id=${req.params.alid}`)
        .then((data) => {
            let resultOne = data.data.results.songs;
            let display = true;
            res.render('albumtrack', {
                resultOne: resultOne,
                display: display
            });
        }, (err) => {
            console.log('Something went wrong!', err);
        })
});

// Router for search - Can search tracks (default) or albums
router.get('/search', (req, res) => {

    // search for albums
    if (req.query.searchby === "albums") {

        axios.get(`https://saavn.me/search/all?query=${req.query.artist}`)
            .then((data) => {
                var ar = data.data.results.albums.data;

                // upgrading the image quality from 50x50 to 150x150
                ar.forEach(data => {
                    const imageUrl = data.image;
                    const imageUrlLength = imageUrl.length;
                    data.image = imageUrl.slice(0, imageUrlLength - 9) + '1' + imageUrl.slice(imageUrlLength - 9, imageUrlLength - 6) + '1' + imageUrl.slice(imageUrlLength - 6);
                })

                let display = true;

                // rendering albums page
                res.render('albums', {
                    ar: ar,
                    display: display
                });
            }, (err) => {
                console.log('Something went wrong!', err);
            })
    }

    // Searching for tracks
    else {

        axios.get(`https://saavn.me/search/songs?query=${req.query.artist}&page=1&limit=10`)
            .then((data) => {
                var ar = data.data.results;

                // cleaning the song name and album name of irrelevant keywords
                ar.forEach(song => {
                    song.name = song.name.replaceAll('&quot;', '');
                    song.album.name = song.album.name.replaceAll('&quot;', '');
                })

                let display = true;

                // rendering the tracks page
                res.render('stracks', {
                    ar: ar,
                    display: display,
                    randomPlayer: false
                });
            }, (err) => {
                console.error(err);
            })
    }
});

module.exports.jiosaavnRoutes = router;
