import { Button, Box } from '@mui/material';

export default function PickGuardButton({ onDrawerOpen }) {
    return (
        <Box my={5}>
            <Button variant="contained" color="primary" onClick={onDrawerOpen}>
                בחר שחקן
            </Button>
        </Box>
    );
}
