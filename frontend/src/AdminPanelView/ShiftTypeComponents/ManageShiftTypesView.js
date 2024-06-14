import styled from 'styled-components';
import { DialogTitle, DialogContent, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useAppContext } from '../../Shared/AppContext';
import EditShiftTypeDialog from './EditShiftTypeDialog';
import { getManageShiftTypesActions } from './ManageShiftTypesActions';
import DeleteShiftTypesDialog from './DeleteShiftTypesDialog';
import CreateShiftTypeButton from './CreateShiftTypeButton';
import CreateShiftTypeDialog from './CreateShiftTypeDialog';


export default function ManageShiftTypesView() {
    const { shiftTypes } = useAppContext();

    const [rows, setRows] = useState([]);
    const [shiftTypesToDelete, setShiftTypesToDelete] = useState([]);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [activeShiftType, setActiveShiftType] = useState(undefined);

    useEffect(() => setRows(getShiftTypesRows()), [shiftTypes]);

    const columns = [
        { field: 'name', headerName: 'שם', minWidth: 200, align: 'right' },
        { field: 'description', headerName: 'תיאור', flex: 1 },
        { field: 'default_score_regular', headerName: 'ניקוד רגיל', minWidth: 50 },
        { field: 'default_score_thursday', headerName: 'ניקוד חמישי', minWidth: 50 },
        { field: 'default_score_weekend', headerName: 'ניקוד סופ"ש', minWidth: 50 },
        { field: 'slots_count', headerName: 'הקצאות ליום', width: 100, align: 'center' },
        { field: 'population_type', headerName: 'אוכלוסייה', minWidth: 100, align: 'center' },
        { field: 'actions', type: 'actions', headerName: 'אפשרויות', width: 100,
          getActions: getManageShiftTypesActions(
              shiftTypes, 
              setActiveShiftType, 
              setIsEditDialogOpen,
              setShiftTypesToDelete,
              setIsDeleteDialogOpen
          )
        }
    ];

    const getShiftTypesRows = () => {
        const shiftTypesRows = shiftTypes.map(({_id: id, score_config, ...rest}) => ({
            id,
            default_score_regular: score_config?.REGULAR_DAY,
            default_score_thursday: score_config?.THURSDAY,
            default_score_weekend: score_config?.WEEKEND,
            ...rest
        }));
        return shiftTypesRows;
    };

    return (
        <>
            <Box dir="rtl" fullWidth>
                <DialogTitle>
                    ניהול סוגי משחקים
                </DialogTitle>
                <DialogContent>
                    <LargeContainer>
                        <DataGrid 
                            rows={rows}
                            columns={columns}
                            disableSelectionOnClick
                        />
                        <CreateShiftTypeButton 
                            setIsCreateDialogOpen={setIsCreateDialogOpen}
                        />
                    </LargeContainer>
                </DialogContent>
            </Box>
            <EditShiftTypeDialog 
                isDialogOpen={isEditDialogOpen}
                setIsDialogOpen={setIsEditDialogOpen}
                activeShiftType={activeShiftType}
            />
            <CreateShiftTypeDialog 
                isDialogOpen={isCreateDialogOpen}
                setIsDialogOpen={setIsCreateDialogOpen}
            />
            <DeleteShiftTypesDialog
                isDialogOpen={isDeleteDialogOpen}
                setIsDialogOpen={setIsDeleteDialogOpen}
                shiftTypesToDelete={shiftTypesToDelete}
            />
        </>
    );
}

const LargeContainer = styled(Box)`
    height: ${0.75*window.innerHeight}px;
`;
