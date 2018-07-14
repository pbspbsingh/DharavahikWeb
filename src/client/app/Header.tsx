import React from 'react';

export default class Nav extends React.PureComponent {

    render() {
        return (
            <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 pr-2 shadow">
                <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="#" style={{ fontSize: 23 }}>Hindi TV Serials</a>
                <input className="form-control form-control-dark w-100" type="text" placeholder="Search" aria-label="Search" id="search" />
            </nav>
        );
    }
}