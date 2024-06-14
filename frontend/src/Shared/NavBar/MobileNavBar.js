import React, { useState } from 'react';
import styled from 'styled-components';
import { WhiteTextButton } from '../Buttons';
import { useAppContext } from '../AppContext';
import { RowContainer } from '../Containers';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FlexibleSeparator from './FlexibleSeparator';
import { MenuContents } from './MenuContent';
import { logout } from '../LoginUtils';


export const MobileNavBar = () => {
    const { currentUser, setCurrentUser } = useAppContext();

    // Drawer
    const [isOpened, setIsOpened] = useState(false);
    function toggle() {
        setIsOpened(wasOpened => !wasOpened);
    }
    function close() {
        setIsOpened(false);
    }
    const DrawerHeader = styled('div')(({ theme }) => ({
        display: 'flex',
        alignItems: 'center',
        // padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        // ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
        minHeight: '56px',
        minWidth: '50vw',
        paddingRight: '20px',
    }));

    // User Menu
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    const openUser = Boolean(anchorElUser);
    const handleUserMenuClick = (event) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleUserMenuClose = () => {
        setAnchorElUser(null);
    };

    return (
        <RowContainer width='100%'>
            {isOpened && (
                <Drawer
                    anchor="left"
                    open={isOpened}
                    onClose={close}
                >
                    <DrawerHeader>
                        <Button endIcon={<ChevronLeftIcon />} onClick={close}>סגור</Button>
                    </DrawerHeader>
                    <Divider />
                    <MenuContents closeFunction={close} />
              </Drawer>
            )}
            <WhiteTextButton onClick={toggle}>
                <MenuIcon style={{paddingRight: '5px'}}/>
                Menu
            </WhiteTextButton>

            <FlexibleSeparator />
            <WhiteTextButton startIcon={<AccountCircleIcon />} onClick={handleUserMenuClick}>{currentUser?.name}</WhiteTextButton>
            <Menu
                anchorEl={anchorElUser}
                open={openUser}
                onClose={handleUserMenuClose}
            >

                <MenuItem onClick={() => {handleUserMenuClose(); logout(setCurrentUser);}}>Logout</MenuItem>
            </Menu>
        </RowContainer>
    );
}
