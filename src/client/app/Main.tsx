import React from 'react';
import $ from 'jquery';
import { Serial, Episode } from './common';

const Modal = require('bootstrap/js/src/modal');

type MainProps = {
    status: 'Loading' | 'Failed' | 'Done',
    serialKey: string,
    serialTitle: string,
    episodes: Episode[]
};
type MainState = {
    clickedIdx: number
};
export default class Main extends React.Component<MainProps, MainState> {
    state: MainState;
    private videoModelRef: React.RefObject<HTMLDivElement>;
    private videoRef: React.RefObject<HTMLVideoElement>;
    private autoPlayTimer?: NodeJS.Timer;

    constructor(props: MainProps) {
        super(props);
        this.state = {
            clickedIdx: -1
        };
        this.videoModelRef = React.createRef();
        this.videoRef = React.createRef();
    }

    public componentDidMount() {
        const modal = this.videoModelRef.current;
        if (modal) {
            $(modal).on('hidden.bs.modal', () => {
                this.videoRef.current!.pause();
                this.autoPlayTimer && clearTimeout(this.autoPlayTimer);
            });
        }

        this.videoRef.current!.onended = () => {
            this.autoPlayTimer && clearTimeout(this.autoPlayTimer);
            if (this.state.clickedIdx > 0)
                this.autoPlayTimer = setTimeout(() => this.launchEpisode(this.state.clickedIdx - 1, ''), 2000);
        };
    }

    launchEpisode = (idx: number, hash: string) => {
        this.setState({ clickedIdx: idx });
        const selectedSource = `/player?serialKey=${this.props.serialKey}&hash=${this.props.episodes[idx].hash}`;
        const video = this.videoRef.current;
        if (video) {
            if (video.played)
                video.pause();
            if (video.firstChild)
                video.removeChild(video.firstChild);
            const source = document.createElement('source')
            source.setAttribute('src', selectedSource);
            source.setAttribute('type', 'video/mp4');
            video.appendChild(source);
            video.load();
            video.play();
        }
    };

    renderMain() {
        const episodes: JSX.Element[] = [];
        this.props.episodes.forEach((e, i) => {
            episodes.push(
                <a key={e.hash}
                    href="#"
                    className={`list-group-item ${this.state.clickedIdx === i ? 'active' : ''}`}
                    onClick={event => { event.preventDefault(); this.launchEpisode(i, e.hash); }}
                    data-target="#videoModal" data-toggle="modal">
                    {e.date}
                </a>
            );
        });
        return (
            <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-none">
                    <h1 className="h2">{this.props.serialTitle}</h1>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        <div className="btn-group mr-2">
                            <button className="btn btn-sm btn-outline-secondary">
                                Refresh
                                <img src="/public/reload.svg" className="icon ml-1" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded box-shadow mr-2">
                    <div className="list-group">
                        {episodes}
                    </div>
                </div>
            </div>
        );
    }

    renderModal() {
        let selecteDate = "";
        let selectedSource = null;
        if (this.state.clickedIdx >= 0 && this.state.clickedIdx < this.props.episodes.length) {
            selecteDate = this.props.episodes[this.state.clickedIdx].date;
            selectedSource = `/player?serialKey=${this.props.serialKey}&hash=${this.props.episodes[this.state.clickedIdx].hash}`;
        }
        return (
            <div className="modal" tabIndex={-1} role="dialog" id="videoModal" ref={this.videoModelRef}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{this.props.serialTitle}: {selecteDate}</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <video
                                id="myVideo"
                                preload="auto"
                                width="100%"
                                autoPlay={true}
                                controls={true}
                                ref={this.videoRef} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        return (
            <main role="main" className="col-md-9 col-lg-9 ml-sm-auto px-4">
                {this.props.status == 'Loading' &&
                    <div className="d-flex justify-content-center loading">
                        <div className="align-self-center">
                            <img src="/public/loader.svg" />
                        </div>
                    </div>
                }
                {this.props.status == 'Failed' &&
                    <div className="d-flex justify-content-center loading">
                        <div className="align-self-center">
                            <h3>Failed to load the result.</h3>
                        </div>
                    </div>
                }
                {this.props.status === 'Done' && this.renderMain()}
                {this.renderModal()}
            </main>
        );
    }
}