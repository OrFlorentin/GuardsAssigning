import { Box } from "@mui/material";
import { isMobile } from "../Shared/Utils";

export const TabsContainer = ({children}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexGrow: 1,
                height: '100%',
                width: '100%',
                'flex-direction': isMobile() ? 'column' : '',
            }}
        >
            {children}
        </Box>
    );
}

export const TabPanel = (props) => {
    const {selectedTabIndex, index, children, ...other} = props;
    
    return (
        <Box
            hidden={selectedTabIndex !== index}
            sx={{ width: '100%' }}
            {...other}
        >
        <Box
            sx={{ p: 3 }}
        >
            {children}
        </Box>
        </Box>
    );
}

export const AdminPanelContainer = ({children}) => {
    return (
        <Box
            sx={{
                m: 0,
                mt: { xs: 12, md: 11, lg: 11}
            }}
        >
            {children}
        </Box>
    );
}

export const AdminPanelTitle = ({children}) => {
    return (
        <Box
            sx={{
                m: 0,
                pl: 3,
                borderBottom: 1,
                borderColor: 'lightGrey'
            }}
        >
            {children}
        </Box>
    );
}
