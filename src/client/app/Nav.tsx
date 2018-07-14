import React from 'react';
import { Serials } from './common';

type NavProps = {
    loadEpisodes: Function
};
type NavState = {
    serials: Serials,
    active: number
};

export default class Nav extends React.Component<NavProps, NavState> {
    controller?: AbortController;

    constructor(props: NavProps) {
        super(props);
        this.state = {
            serials: {},
            active: 0
        };
    }

    public async componentDidMount() {
        await this.loadSerials();
    }

    private async loadSerials() {
        try {
            if (this.controller) {
                this.controller.abort();
            }
            this.controller = new AbortController();
            const serialsResponse = await fetch('/serials', { signal: this.controller.signal });
            const serials = await serialsResponse.json();
            delete this.controller;

            this.setState({
                serials,
                active: this.state.active < Object.keys(serials).length ? this.state.active : 0
            });
            if (Object.keys(serials).length)
                this.serialChange(0);
        }
        catch (error) {
            if (!(error instanceof DOMException)) {
                console.log('Error while trying to load serials info.', error);
            }
        }
    }

    private serialChange(curIdx: number) {
        this.setState({ active: curIdx });

        const serialKey = Object.keys(this.state.serials)[curIdx];
        this.props.loadEpisodes(serialKey, this.state.serials[serialKey]);
    }

    public render() {
        const serailLi: JSX.Element[] = [];
        Object.keys(this.state.serials).forEach((serialKey, index) => {
            serailLi.push(
                <li className="nav-item" key={serialKey}>
                    <a href="#"
                        className={`nav-link ${this.state.active === index ? 'active' : ''}`}
                        onClick={e => { e.preventDefault(); this.serialChange(index); }}
                    >
                        {this.state.serials[serialKey].name}
                    </a>
                </li>
            );
        });

        return (
            <div className="row">
                <nav className="col-md-3 col-lg-3 d-none d-md-block bg-light sidebar">
                    <div className="sidebar-sticky">
                        <ul className="nav flex-column mt-2" id="serialList">
                            {serailLi}
                        </ul>
                    </div>
                </nav>
            </div>
        );
    }
}