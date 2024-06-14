import styled from 'styled-components';
import { isMobile } from '../Shared/Utils';

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function DayNames() {
    if (isMobile())
        return DAYS_SHORT.map((day) => <DayNameTile key={day}>{day}</DayNameTile>);
    return DAYS.map((day) => <DayNameTile key={day}>{day}</DayNameTile>);
}

const DayNameTile = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    border-width: 1px;
    font-weight: bold;
`;
