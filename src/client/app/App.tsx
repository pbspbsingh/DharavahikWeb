import React from 'react';
import { hot } from 'react-hot-loader';

import Header from './Header';
import Nav from './Nav';
import Main from './Main';
import { Serial, Episode} from './common';

type AppState = {
    status: 'Loading' | 'Failed' | 'Done',
    serialKey: string,
    serialTitle: string,
    episodes: Episode[]
};

class App extends React.Component<{}, AppState> {
    state: AppState;
    controller?: AbortController;

    constructor(props: {}) {
        super(props);
        this.state = {
            status: 'Loading',
            serialKey: '',
            serialTitle: '',
            episodes: []
        };
    }

    loadEpisodes = async (serialKey: string, serial: Serial) => {
        this.setState({status: 'Loading'});
        try {
            if (this.controller) {
                this.controller.abort();
            }
            this.controller = new AbortController();
            const episodesRes = await fetch(`/episodes?key=${serialKey}`, { signal: this.controller.signal });
            const episodes: Episode[] = await episodesRes.json();
            delete this.controller;

            this.setState({
                status: 'Done',
                serialKey: serialKey,
                serialTitle: serial.name,
                episodes: episodes
            });
        } catch (error) {
            if (!(error instanceof DOMException)) {
                console.error('Error while trying to load serials info.', error);
                this.setState({ status: 'Failed' });
            }
        }
    };

    render() {
        return (
            <div>
                <Header />
                <div className="container-fluid">
                    <Nav loadEpisodes={this.loadEpisodes} />
                    <Main {...this.state} />
                </div>
            </div>
        );
    }
}

export default hot(module)(App);