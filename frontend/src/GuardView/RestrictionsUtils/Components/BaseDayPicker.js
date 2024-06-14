import { modifiersStyles, StyledDayPicker } from '../Styles';

export default function BaseDayPicker(props) {
    return (
        <StyledDayPicker
            {...props}
            firstDayOfWeek={0}
            modifiersStyles={modifiersStyles}
        />
    );
};
