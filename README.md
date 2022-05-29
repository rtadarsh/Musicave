# Musicave

Musicave is a music-streaming service built upon `JioSaavn` and `Spotify` API. It can **stream** various songs and gives you option to **download** the songs. It has various features such as :

- Stream songs
- Download songs
- Get trending songs
- Get trending albums
- Search songs by name
- Search songs by albums
- Get recommendations based on current playing song

#### Special Features
- **Random Songs** : Stuck in the boring loop of popular recommendation engines ? This feature fetches a completely random track which is not influenced by your playlists or your listening history. A great tool for discovering less-known tracks
- **Digital Wellbeing** : If the user listens to searched tracks for more than 10 minutes, an alert will be displayed to take a break. This feature is not for tracks played from randomly fetched tracks.

## Built with
- [Handlebars](https://handlebarsjs.com/) - A simple **templating** language
- [Node.js](https://nodejs.org/) - Used for back-end web-server
- [Express.js](https://expressjs.com/) - Used as web-application framework
- [SpotifyAPI](https://developer.spotify.com/documentation/web-api/) - Returns JSON metadata about music artists, albums, and tracks, directly from the Spotify Data Catalogue
- [JioSaavnAPI](https://docs.saavn.me/) - Unofficial JioSaavn API 

## Installation

Clone the github [repo](https://github.com/rtadarsh/Musicave) or download zipped file

```bash
git clone https://github.com/rtadarsh/Musicave
```
Download [Node.JS](https://nodejs.org/en/download/) (Version >= 16.15.0)

Install dependencies

Run the following commnad in the root folder of the project (`package.json` must be visible on `ls` command)

```bash
npm install
```

## Start the server

```bash
npm start
```

Go to localhost:4000 in your browser

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)