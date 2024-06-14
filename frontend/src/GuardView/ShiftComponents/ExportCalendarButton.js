import { Button, Box } from "@mui/material";

import { createRef } from 'react'
import axios from "axios";

export function AuthenticatedLink({ url, params, filename, children }) {
    const handleAction = async () => {
        const result = await axios.get(url, { params, responseType: 'blob' });
        const blob = result.data;
        const href = window.URL.createObjectURL(blob);

        const tempLink = document.createElement('a');
        tempLink.href = href;
        tempLink.setAttribute('download', filename);
        tempLink.click();
    }

    return (
        <Button
            variant="outlined"
            onClick={handleAction}>
            {children}
        </Button>
    )
}

const getDownloadLinkParams = (guard) => {
    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    return {
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        guard_id: guard?._id,
    };
};

export default function ExportCalendarButton({ guard }) {
    return (
        <Box m={4}>
            <AuthenticatedLink
                url='/export/ics'
                filename='games.ics'
                params={getDownloadLinkParams(guard)}
                target="_blank"
            >
                Export To Calendar
            </AuthenticatedLink>
        </Box>
    );
}
