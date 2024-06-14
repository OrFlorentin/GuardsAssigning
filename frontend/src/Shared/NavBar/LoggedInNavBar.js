import { AppBar, Toolbar } from '@mui/material';
import React from 'react';
import { isMobile } from '../Utils';

import { MobileNavBar } from './MobileNavBar';
import { DesktopNavBar } from './DesktopNavBar';


export default function LoggedInNavBar() {

    return (
        <AppBar position="fixed">
            <Toolbar style={{paddingLeft: '0'}}>
                {isMobile() ? (<MobileNavBar />) : (<DesktopNavBar />)}
            </Toolbar>
        </AppBar>
    );
}
