import React from "react";
import { logout } from '../LoginUtils';
import { useAppContext } from "../AppContext";
import { IconButton } from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';

export default function LogoutButton() {
    const { setCurrentUser } = useAppContext();

    return (
        <IconButton onClick={() => logout(setCurrentUser)}>
            <LogoutIcon sx={{color: 'white'}} />
        </IconButton>
    );
}