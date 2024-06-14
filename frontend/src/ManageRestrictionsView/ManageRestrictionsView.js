import styled from 'styled-components';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Box } from '@mui/system';
import { DataGrid } from '@mui/x-data-grid';
import { useAppContext } from '../Shared/AppContext';
import { Stack } from '@mui/material';
import { getOnlyPopulationSettingsAndAlert, isMobile } from '../Shared/Utils';
import { ResponsiveContainer } from '../Shared/Containers';
import { ManageButtons } from './ManageButtons';
import DeleteRestrictionsDialog from './DeleteRestrictionsDialog';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';

export default function ManageRestrictionsView() {
    const { filteredGuards } = useAppContext();
    const { showWarningSnackbar } = useCustomSnackbar();

    const [rows, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [objectsToDelete, setObjectsToDelete] = useState([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => setRows(getRestrictionRows()), [filteredGuards]);

    const columns = [
        { field: 'guard', headerName: 'שחקן', width: 200 },
        { field: 'date', headerName: 'תאריך', width: 200 },
        { field: 'reason', headerName: 'סיבה', width: 200 },
    ]

    const getGuardRestrictions = (guard) => getOnlyPopulationSettingsAndAlert(guard, showWarningSnackbar)
        ?.restrictions;

    const getRestrictionRows = () => {
        const restrictions = filteredGuards.reduce((result, guard) => {
            const guardRestrictions = getGuardRestrictions(guard).map(restriction =>
                ({ ...restriction, guard: guard?.name, guardId: guard?._id })
            );

            return result.concat(guardRestrictions);
        }, []);

        return restrictions
            .sort((left, right) => moment.utc(left.date).diff(moment.utc(right.date)))
            .map((restriction) => ({ ...restriction, date: moment(restriction.date).format('L')}))
            .map((restriction, index) => ({ ...restriction, id: index }));
    }

    const resetSelectedRows = () => {
        setSelectedRows([]);
    };
    const theme = {
        spacing: ['10px', isMobile() ? '0' : '20px', '20px'],
    }

    return (
        <>
            <LargeContainer>
                <ResponsiveContainerLeftAligned>
                <h1 style={{marginBottom: theme.spacing[1], marginTop: 'auto'}}>ניהול הסתייגויות</h1>

                    <ManageButtons
                        setSelectedRows={setSelectedRows}
                        setObjectsToDelete={setObjectsToDelete}
                        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        rowsToDelete={rows.filter((row) => selectedRows.includes(row.id))}
                    />

                </ResponsiveContainerLeftAligned>

                <DataGrid
                    rows={rows}
                    columns={columns}
                    selectionModel={selectedRows}
                    onSelectionModelChange={(selectedRows) => setSelectedRows(selectedRows)}
                    checkboxSelection
                    disableSelectionOnClick
                />
            </LargeContainer>

            <DeleteRestrictionsDialog
                isDialogOpen={isDeleteDialogOpen}
                setIsDialogOpen={setIsDeleteDialogOpen}
                objectsToDelete={objectsToDelete}
                resetSelectedRows={resetSelectedRows}
            />
        </>
    );
}

const LargeContainer = styled(Box)`
    height: ${0.75*window.innerHeight}px;
    margin-left: ${isMobile() ? 'auto' : '6em'};
    margin-right: ${isMobile() ? 'auto' : '6em'};
    margin-top: 6em;
    margin-bottom: 6em;
    max-width: 90%;
`;

const ResponsiveContainerLeftAligned = styled(ResponsiveContainer)`
    ${isMobile() ? '' : 'justify-content: left;' }
`;
