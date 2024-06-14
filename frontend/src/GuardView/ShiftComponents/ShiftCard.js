import styled from 'styled-components';
import { Card, CardActions, CardContent, Button } from '@mui/material';
import ShiftDetails from './ShiftDetails';

export default function ShiftCard({ shift, setActiveShift, setIsShiftDetailsDialogOpen }) {
    const handleClick = () => {
        setActiveShift(shift);
        setIsShiftDetailsDialogOpen(true);
    };

    return (
        <WideCard elevation={3}>
            <CardContent>
                <ShiftDetails shift={shift} />
            </CardContent>
            <CardActions>
                <Button onClick={handleClick}>עוד פרטים</Button>
            </CardActions>
        </WideCard>
    );
}

const WideCard = styled(Card)`
    margin: 2px;
`;
