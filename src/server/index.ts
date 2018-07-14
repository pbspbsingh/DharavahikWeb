import express from 'express';
import path from 'path';

import logger from './logger';
import { startCrawler, getShows, startTor } from './util';
import videoController from './VideoController'

const app = express();

app.use('/public', express.static(path.resolve(__dirname, '../public')));
app.get('/serials', async (req, res, next) => {
    try {
        const shows = await getShows();
        logger.info('Number of shows fetched: ' + shows.length);
        const result: any = {};
        shows.forEach(show => {
            result[show.key] = { name: show.title };
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});
app.get('/episodes', async (req, res, next) => {
    try {
        const key = req.query.key;
        const shows = await getShows();
        logger.info(`Key: ${key}, number of shows fetched: ${shows.length}`);

        const selectedShow = shows.filter(show => show.key === key)[0];
        logger.info(`Selected show is: ${selectedShow.title}`);
        if (!selectedShow)
            throw new Error(`Key ${key} is not valid.`);

        const result: any = [];
        selectedShow.episodes.forEach(e => result.push({ date: e.date, hash: e.hash }));
        res.json(result);
    } catch (error) {
        logger.error(`Got an error while looking for episodes: ${error}`, error);
        next(error);
    }
});
app.use(videoController);

const home = (req: express.Request, res: express.Response) => res.sendFile(path.resolve(__dirname, '../public/index.html'))
app.use('/', home);
app.use('/index.html', home);


const port = 8000;
app.listen(port, () => logger.info(`Webserver started at ${port}.`));

startTor();
startCrawler();