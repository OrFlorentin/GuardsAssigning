import { useEffect, useState } from 'react';
import { Box } from '@mui/system';
import { DataGrid } from '@mui/x-data-grid';
import { useAppContext } from '../Shared/AppContext';
import { Button, IconButton, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { getManageGuardsActions } from './ManageGuardsActions';
import { isMobile } from '../Shared/Utils';
import styled from 'styled-components';
import DeleteGuardsButton from './DeleteGuardsButton';
import CreateGuardDialog from './CreateGuardDialog';
import EditGuardDialog from './EditGuardDialog';
import EditScoreDialog from './EditScoreDialog';
import DeleteGuardsDialog from './DeleteGuardsDialog';
import { getOnlyPopulationSettingsAndAlert, formatDate, getBranchName } from '../Shared/Utils';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';
import RefreshIcon from '@mui/icons-material/Refresh';
import { fetchAndUpdateGuards } from '../Shared/Calls';
import UserRolesDialog from './UserRolesDialog';
import { ResponsiveContainer } from '../Shared/Containers';
import ManagedBranchesToggle from '../Shared/ManagedBranchesToggle';
import ManagedPopulationTypesToggle from '../Shared/ManagedPopulationTypesToggle';

export default function ManageGuardsView() {
    const {
        filteredGuards,
        branches,
        setFilteredBranch,
        setFilteredPopulationType,
        currentScoreSchema,
    } = useAppContext();
    const { showWarningSnackbar } = useCustomSnackbar();

    const [rows, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [activeGuard, setActiveGuard] = useState(undefined);
    const [guardsToDelete, setGuardsToDelete] = useState([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);

    const { setGuards } = useAppContext();

    const calcTimeInDuty = (joinDate) => {
        const joined = new Date(joinDate);
        const now = new Date();
        const diff = Math.abs(now - joined);
        return diff / (1000 * 60 * 60 * 24 * 30);
    }

    const calcWeightedScore = (score, timeInDuty) => {
        if (timeInDuty == 0) {
            return 0;
        }

        return parseFloat((score / timeInDuty).toFixed(2));
    };

    const createGuardRow = (guard, index) => {
        const guardPopulationSettings = getOnlyPopulationSettingsAndAlert(guard, showWarningSnackbar);
        const guardScore = guardPopulationSettings?.score;
        const timeInDuty = calcTimeInDuty(guardPopulationSettings.join_date);
        const guardWeightedScore = {
            'weighted_regular': calcWeightedScore(guardScore.regular_score, timeInDuty),
            'weighted_weekend': calcWeightedScore(guardScore.weekend_score, timeInDuty)
        };
        const guardExtraParams = guardPopulationSettings?.extra_params;
        let guardRows = {};
        guardRows = Object.assign(guardRows, guard);
        guardRows.branch = getBranchName(guardRows.branch, branches);

        return { ...guardRows, ...guardScore, ...guardWeightedScore, ...guardPopulationSettings, ...guardExtraParams, id: index };
    }

    useEffect(() => fetchAndUpdateGuards(setGuards), []);

    useEffect(() => {
        setRows(filteredGuards.map(createGuardRow))
    }, [filteredGuards]);

    const getScoreColumns = () => {
        if (!currentScoreSchema) {
            return [];
        }

        return currentScoreSchema.map((column) => ({
            field: column.column_id,
            headerName: column.display_name,
            type: column.type,
            hide: column.hide_from_table,
            width: 120,
        }));
    };

    const formatJoinDate = (params) => formatDate(params.value);

    const columns = [
        { field: 'name', headerName: 'שם', width: 140 },
        { field: 'username', headerName: 'שם משתמש', width: 140 },
        { field: 'branch', headerName: 'קבוצה', width: 120 },
        { field: 'population_types', headerName: 'אוכלוסייה', width: 120 },
        { field: 'score_multiplier', headerName: 'מכפיל ניקוד', width: 100 },
        { field: 'join_date', headerName: 'תאריך הצטרפות', width: 120, valueGetter: formatJoinDate },
        { field: 'weighted_regular', headerName: 'ניקוד יחסי', width: 120, type:'number' },
        { field: 'weighted_weekend', headerName: 'ניקוד סופ"ש יחסי', width: 120, type:'number' },
        ...getScoreColumns(),
        {
            field: 'actions',
            type: 'actions',
            headerName: 'אפשרויות',
            width: 140,
            getActions: getManageGuardsActions(
                filteredGuards,
                setActiveGuard,
                setGuardsToDelete,
                setIsEditDialogOpen,
                setIsScoreDialogOpen,
                setIsDeleteDialogOpen,
                setIsRolesDialogOpen
            ),
        },
    ];

    const handleBranchSelectChange = (_, value) => {
        if (!value) return;
        const newFilteredBranch = value;
        setFilteredBranch(newFilteredBranch);
        resetSelectedRows();
    };

    const handlePopulationTypeSelectChange = (_, value) => {
        if (!value) return;

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
        <>
            <LargeContainer>
                <ResponsiveContainerLeftAligned>
                    <h1 style={{ marginBottom: theme.spacing[1], marginTop: 'auto' }}>ניהול משתמשים</h1>
                    <ButtonsContainer style={{ width: isMobile() ? '100%' : '', marginLeft: theme.spacing[1] }}>
                        <ResponsiveContainer>
                            <Button
                                sx={{ mt: theme.spacing[0], mb: theme.spacing[1], mr: theme.spacing[1] }}
                                variant="outlined"
                                onClick={() => {
                                    setIsCreateDialogOpen(true);
                                }}
                            >
                                Create User
                            </Button>

                            <DeleteGuardsButton
                                sx={{ mt: theme.spacing[0], mb: theme.spacing[1], mr: theme.spacing[1] }}
                                variant="outlined"
                                selectedGuardRows={rows.filter((row) =>
                                    selectedRows.includes(row.id)
                                )}
                                setGuardsToDelete={setGuardsToDelete}
                                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                            />

                            <ManagedBranchesToggle
                                sx={{ mt: theme.spacing[0], mb: theme.spacing[1], mr: theme.spacing[1] }}
                                color="primary"
                                onChange={handleBranchSelectChange}
                            />

                            <ManagedPopulationTypesToggle
                                sx={{ mt: theme.spacing[0], mb: theme.spacing[2], mr: theme.spacing[1] }}
                                color="primary"
                                onChange={handlePopulationTypeSelectChange}
                            />

                            {isMobile() || (
                                <IconButton sx={{ mt: theme.spacing[0], mb: theme.spacing[1] }} onClick={() => {
                                    fetchAndUpdateGuards(setGuards);
                                }}>
                                    <RefreshIcon />
                                </IconButton>
                            )}
                        </ResponsiveContainer>
                    </ButtonsContainer>

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

            <CreateGuardDialog
                isDialogOpen={isCreateDialogOpen}
                setIsDialogOpen={setIsCreateDialogOpen}
            />

            <EditGuardDialog
                isDialogOpen={isEditDialogOpen}
                setIsDialogOpen={setIsEditDialogOpen}
                activeGuard={activeGuard}
            />

            <EditScoreDialog
                isDialogOpen={isScoreDialogOpen}
                setIsDialogOpen={setIsScoreDialogOpen}
                activeGuard={activeGuard}
            />

            <DeleteGuardsDialog
                isDialogOpen={isDeleteDialogOpen}
                setIsDialogOpen={setIsDeleteDialogOpen}
                guardsToDelete={guardsToDelete}
                resetSelectedRows={resetSelectedRows}
            />

            <UserRolesDialog
                isDialogOpen={isRolesDialogOpen}
                setIsDialogOpen={setIsRolesDialogOpen}
                activeGuard={activeGuard}
                setActiveGuard={setActiveGuard}
            />
        </>
    );
}

const LargeContainer = styled(Box)`
    height: ${0.75*window.innerHeight}px;
    // my={12} mx={isMobile() ? 'auto' : 10} maxWidth="90%"
    margin-left: ${isMobile() ? 'auto' : '6em'};
    margin-right: ${isMobile() ? 'auto' : '6em'};
    margin-top: 6em;
    margin-bottom: 6em;
    max-width: 90%;
`;

const ButtonsContainer = styled.div`
    padding-top: 16px;
`;

const ResponsiveContainerLeftAligned = styled(ResponsiveContainer)`
    ${isMobile() ? '' : 'justify-content: left;'}
`;
