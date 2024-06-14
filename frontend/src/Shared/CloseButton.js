import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function CloseButton({ onClick }) {
    return (
        <IconButton
            aria-label="close"
            onClick={onClick}
            sx={{
                position: 'absolute',
                left: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
            }}
        >
            <CloseIcon />
        </IconButton>
    );
}
