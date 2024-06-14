import React from 'react';
import { useAppContext } from '../AppContext';
import FlexibleSeparator from './FlexibleSeparator';
import { RowContainer } from '../Containers';
import LogoutButton from './LogoutButton';
import { Typography } from '@mui/material';
import { MenuContents } from './MenuContent';
import { ReactComponent as SudokuLogoNoBG } from '../../assets/sudoku-no-bg.svg';

export const DesktopNavBar = () => {
    const { currentUser } = useAppContext();

    return (
        <RowContainer width='100%'>
            <a href="/"><SudokuLogoNoBG height="50px" width="50px" style={{padding: '0 10px'}}/></a>
            <MenuContents />
            <FlexibleSeparator />

            <LogoutButton />
            <Typography component="div" sx={{ m: 'auto' }}>שלום <b>{currentUser?.name}</b></Typography>
        </RowContainer>
    );
}
