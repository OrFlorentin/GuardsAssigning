import React from 'react';
import { useAppContext } from '../AppContext';
import LoggedInNavBar from './LoggedInNavBar';
import LoggedOutNavBar from './LoggedOutNavBar';

export default function NavBar() {
    const { isLoggedIn } = useAppContext();

    return isLoggedIn ? <LoggedInNavBar /> : <LoggedOutNavBar />;
}
