import styled from 'styled-components';
import DayPicker from 'react-day-picker';

export const modifiersStyles = {
    selected: {
        backgroundColor: '#f44336',
    },
    newlySelectedDays: {
        backgroundColor: '#00bcd4',
        color: 'white',
    }
};

export const StyledDayPicker = styled(DayPicker)`
    .DayPicker-Month {
        font-size: xx-large;
    }
    .DayPicker-Day {
        font-size: xx-large;
    }
    @media only screen and (max-width : 500px) {
        .DayPicker-NavButton {
            padding: 5px 15px;
            height: 32px;
            width: 32px;
            color: #1976d2;
            font-size: 0;
        }
        .DayPicker-NavButton--prev {
            left: 1.5em;
            right: auto;
        }
        .DayPicker-Weekday {
            font-size: 0.6em;
        }
        .DayPicker-Caption {
            padding: 0 2em;
        }
        .DayPicker-Day {
            font-size: x-large;
            padding: ${0.02*window.innerHeight}px 1vw;
        }
        .DayPicker-Month {
            margin: 0;
        }
    }
`
