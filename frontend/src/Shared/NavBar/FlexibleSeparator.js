import React from 'react';
import { Typography } from "@mui/material";

export default function FlexibleSeparator() {
    return (<Typography component="div" sx={{ flexGrow: 1 }} />);
}
