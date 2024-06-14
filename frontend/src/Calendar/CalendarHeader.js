import Button from '@mui/material/Button';
import styled from 'styled-components';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function CalendarHeader({ handleBack, handleNext, title }) {
    return (
        <MonthNavigator>
            <SmallButton variant="outlined" onClick={handleBack}>
                <ChevronLeftIcon />
            </SmallButton>
            <Title>{title}</Title>
            <SmallButton variant="outlined" onClick={handleNext}>
                <ChevronRightIcon />
            </SmallButton>
        </MonthNavigator>
    );
}

const MonthNavigator = styled.div`
    display: flex;
    align-items: center;
    margin-top: 0.5em;
    justify-content: center;
`;

const Title = styled.h2`
    font-weight: bold;
    width: 5em;
    text-align: center;
    margin: 0 0.5em;
`;

const SmallButton = styled(Button)`
    height: 3em;
`;
