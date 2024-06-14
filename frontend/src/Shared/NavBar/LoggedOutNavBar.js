import { AppBar, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import React from 'react';
import { WhiteTextButton } from '../Buttons';
import FlexibleSeparator from './FlexibleSeparator';

export default function LoggedOutNavBar() {
    return (
        <AppBar position="static">
            <Toolbar>
                <FlexibleSeparator/>
                <WhiteTextButton component={Link} to="/login">התחברות</WhiteTextButton>
            </Toolbar>
        </AppBar>
    );
}
