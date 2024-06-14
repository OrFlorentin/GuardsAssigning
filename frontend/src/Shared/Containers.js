import styled from 'styled-components';
import { Box } from '@mui/system';
import { Form } from 'formik';
import { isMobile } from './Utils';

export const CenterContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100%;
`;

export const FlexForm = styled(Form)`
    width: 80%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

export const BoldText = styled.span`
    font-weight: 500;
`;

export const ScollableContainer = styled.div`
    display: block;
    overflow: auto;
`

export const RowContainer = styled.div`
    display: flex;
    flex-direction: row;
    width: ${({ width }) => width};
    margin-top: ${({ marginTop }) => marginTop};
    margin-bottom: ${({ marginBottom }) => marginBottom};
`;

export const RowContainerSpaceBetween = styled(RowContainer)`
    justify-content: space-between;
`;

export const ResponsiveContainer = styled(RowContainer)`
    justify-content: space-between;
    flex-direction: ${isMobile() ? 'column' : 'row'};
`

export const RowContainerCentered = styled(RowContainer)`
    justify-content: center;
`;

export const ColumnContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

export const ConstantHeader = styled.div`
    height: 35px;
`;

export const ViewContainer = ({ children }) => (
    <Box m={{ xs: 5, md: 10, lg: 25 }} mt={{ xs: 7, md: 12, lg: 12 }}>
        <CenterContainer>
            {children}
        </CenterContainer>
    </Box>
);
