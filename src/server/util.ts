import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import https from 'https';
import url from 'url';
import path from 'path';

import logger from './logger';

const SocksProxyAgent = require('socks-proxy-agent');
const proxy = 'socks://127.0.0.1:9050';

let torValidator: NodeJS.Timer;
export function startTor() {
    const workingDir = 'C:\\Utils\\TorBrowser\\Browser';
    const tor = spawn(path.resolve(workingDir, 'TorBrowser\\Tor\\tor.exe'), ['DataDirectory', path.resolve('./data/tor/'),
        '--defaults-torrc', path.resolve(workingDir, 'TorBrowser\\Data\\Tor\\torrc-defaults')], { cwd: workingDir });
    logger.info('Staring tor for proxy service, pid: ' + tor.pid);
    
    tor.stdout.on('data', chunk => logger.info(`Tor: ${chunk.toString()}`));
    tor.stdout.on('error', err => logger.warn(`Tor: error: ${err}`));
    tor.on('close', (code, signal) => logger.error('Tor process is dead.'));

    if (torValidator) {
        logger.info('Clearing the existing timer...');
        clearInterval(torValidator);
    }
    const pingUri = 'http://hindistopa.com/crime-patrol/?e=944590&h=knilelgnisdhenpayalp';
    torValidator = setInterval(async () => {
        const link = pingUri + '&cachebuster=' + Math.random();
        logger.info(`Pinging ${link} to see if cloudflare is blocking the traffic.`);
        const response = await httpGet(link);
        if (response.statusCode == 403) {
            logger.error('Looks like cloudflar is blocking the traffic.');
            logger.info('Killing the tor process with pid: ' + tor.pid);
            tor.kill();
            startTor();
        } else {
            logger.info('Everything is ok: ' + response.statusCode);
        }
    }, 30000);
}

export function startCrawler(waitTime = 6) {
    const cralwer = spawn('java', ['-jar', 'crawler.jar', waitTime + '']);
    cralwer.stderr.on('data', chunk => logger.error(`Crawler: ${chunk.toString()}`));
    cralwer.on('close', chunk => {
        logger.error(`crawler process with pid: ${cralwer.pid} died.`);
        logger.info('Lets start the crawler process again.');
        startCrawler();
    });

    logger.info(`Spawned a child java process pid: ${cralwer.pid} for crawling.`);
}

export function getShows(): Promise<Show[]> {
    return new Promise((accept, reject) => {
        fs.readFile('./data/serials.json', (err, data) => {
            if (err) {
                logger.error('Error reading the file', err);
                reject(err);
            }
            else if (data) {
                const strVal = data.toString();
                logger.info(`Read the file successfully: ${strVal.length}`);
                accept(JSON.parse(strVal));
            } else {
                logger.warn("Couldn't get any data from file, returning empty list.");
                accept([]);
            }
        });
    });
}

export type Show = {
    key: string,
    title: string,
    href: string,
    episodes: Episode[]
};

export type Episode = {
    date: string,
    hash: string,
    videoUrl: string
}

const httpAgent = new SocksProxyAgent(proxy);
const httpsAgent = new SocksProxyAgent(proxy, true);

export function httpGet(uri: string, headers: { [k: string]: string | string[] } = {}): Promise<http.IncomingMessage> {
    const { protocol, host, path } = url.parse(uri);
    logger.info(`GET request with ${protocol}, ${host} & ${path}`);

    const options = {
        protocol,
        host,
        path,
        agent: protocol === 'https:' ? httpsAgent : httpAgent,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
            ...headers
        }
    };
    return new Promise((accept, reject) => {
        if (protocol === 'https:') {
            https.get(options, res => accept(res));
        } else {
            http.get(options, res => accept(res));
        }
    });
}