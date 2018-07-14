import express from 'express';
import logger from './logger';
import { getShows, httpGet } from './util';

class VideController {
    middleware: express.Express;
    contentCache: { [x: string]: number }

    constructor() {
        this.middleware = express();
        this.contentCache = {};

        this.middleware.get('/player', this.player.bind(this));
    }

    private async player(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { serialKey, hash } = req.query;
            logger.info(`Receieved a video request with ${serialKey} and ${hash}`);

            const shows = await getShows();
            const selectedShow = shows.filter(show => show.key === serialKey)[0];
            if (!selectedShow)
                throw new Error(`Key ${serialKey} is not valid.`);

            const selectedEpisode = selectedShow.episodes.filter(e => e.hash === hash)[0];
            if (!selectedEpisode)
                throw new Error(`Hash ${hash} is not valid.`);

            logger.info(`Streaming ${selectedEpisode.videoUrl}`);
            this.stream(req, res, next, selectedEpisode.videoUrl);
        } catch (error) {
            logger.error(`Got an error while looking for episodes: ${error}`, error);
            next(error);
        }
    }

    private async stream(req: express.Request, res: express.Response,
        next: express.NextFunction, video: string) {
        const rangeHeader = <string>req.headers.range;
        if (rangeHeader) {
            logger.info(`Got playback request with header ${rangeHeader}`);
            const response = await httpGet(video, { 'range': rangeHeader });
            const positions = rangeHeader.replace('bytes=', '').split('-');
            const start = parseInt(positions[0]);
            const end = positions[1] ? parseInt(positions[1]) : start + parseInt(<string>response.headers["content-length"]) - 1;
            const totalLen = this.contentCache[video] ? this.contentCache[video] : parseInt(<string>response.headers["content-length"]);
            logger.info(`Start: ${start}, end: ${end} & total: ${totalLen}`);

            res.writeHead(206, {
                'Accept-Range': 'bytes',
                'Content-Type': `video/${this.getType(video)}`,
                'Content-Range': `bytes ${start}-${end}/${totalLen}`,
                'Content-Length': totalLen
            });
            response.on('error', error => {
                logger.error(`Error while trying to stream video ${video}, ${error}`, error);
                next(error);
            });
            response.on('data', data => res.write(data));
            response.on('end', () => res.end());
        } else {
            logger.info('Got playback request without range header.');
            const response = await httpGet(video);
            const totalLen = response.headers["content-length"];
            if (totalLen)
                this.contentCache[video] = parseInt(totalLen);
            res.writeHead(200, {
                'Accept-Range': 'bytes',
                'Content-Type': `video/${this.getType(video)}`,
                'Content-Length': totalLen
            });

            response.on('error', error => {
                logger.error(`Error while trying to stream video ${video}, ${error}`, error);
                next(error);
            });
            response.on('data', data => res.write(data));
            response.on('end', () => res.end());
        }
    }

    private getType(uri: string): string {
        const lastIdx = uri.lastIndexOf('.');
        if (lastIdx > 0) {
            return uri.substring(lastIdx + 1);
        }
        return 'mp4';
    }
}


export default new VideController().middleware;