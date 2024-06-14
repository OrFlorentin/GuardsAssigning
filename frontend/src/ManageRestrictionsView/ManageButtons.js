import { useAppContext } from '../Shared/AppContext';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import styled from 'styled-components';
import DeleteObjectsButton from './DeleteObjectsButton';
import { ResponsiveContainer } from '../Shared/Containers';
import { isMobile } from '../Shared/Utils';
import ManagedBranchesToggle from '../Shared/ManagedBranchesToggle';
import ManagedPopulationTypesToggle from '../Shared/ManagedPopulationTypesToggle';

export function ManageButtons({ setSelectedRows, setObjectsToDelete, rowsToDelete, setIsDeleteDialogOpen }) {
    const {
        setFilteredBranch,
        setFilteredPopulationType,
    } = useAppContext();

    const handleBranchSelectChange = (_, value) => {
        const newFilteredBranch = value;
        setFilteredBranch(newFilteredBranch);
        resetSelectedRows();
    };

    const handlePopulationTypeSelectChange = (_, value) => {
        const newFilteredPopulationType = value;
        setFilteredPopulationType(newFilteredPopulationType);
        resetSelectedRows();
    };

    const resetSelectedRows = () => {
        setSelectedRows([]);
    };

    const theme = {
        spacing: ['10px', isMobile() ? '0' : '20px', '20px'],
    }

    return (
        <ResponsiveButtonsContainer>
            <ResponsiveContainer>
                <DeleteObjectsButton
                    sx={{ mt: theme.spacing[0], mb: theme.spacing[1], mr: theme.spacing[1] }}
                    variant="outlined"
                    rowsToDelete={rowsToDelete}
                    setObjectsToDelete={setObjectsToDelete}
                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                />

                <ManagedBranchesToggle
                    sx={{ mt: theme.spacing[0], mb: theme.spacing[1], mr: theme.spacing[1] }}
                    color="primary"
                    onChange={handleBranchSelectChange}
                />

                <ManagedPopulationTypesToggle
                    sx={{ mt: theme.spacing[0], mb: theme.spacing[2] }}
                    color="primary"
                    onChange={handlePopulationTypeSelectChange}
                />
            </ResponsiveContainer>
        </ResponsiveButtonsContainer>
    );
}

const ResponsiveButtonsContainer = styled.div`
    padding-top: 16px;
    width: ${isMobile() ? '100%' : ''};
    margin-left: ${isMobile() ? '0' : '20px'};
`;
