import { WhiteTextButton } from '../../Buttons';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { isMobile } from '../../Utils';

export default function NavBarButton({ to, children, onClick, icon }) {
    if ( isMobile() ) {
        return <Button 
            component={Link} 
            to={to} 
            children={children} 
            onClick={onClick}
            sx={{
                minHeight: '56px',
                alignItems: 'right',
                justifyContent: 'flex-end',
                paddingRight: '20px',
            }}
            endIcon={icon}
        />;
    }
    return <WhiteTextButton component={Link} to={to} children={children} onClick={onClick} />;
}
