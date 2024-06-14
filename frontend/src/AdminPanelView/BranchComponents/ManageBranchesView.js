import { Box, DialogContent, DialogTitle } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect } from "react";
import { useRef } from "react";
import { useCallback } from "react";
import { useState } from "react";
import styled from "styled-components";
import { useAppContext } from "../../Shared/AppContext";
import { useCustomSnackbar } from "../../Shared/SnackbarUtils";
import ColorCell from "./ColorCell";
import { getManageBranchesActions } from "./ManageBranchesActions";
import ManageBranchesToolbar from "./ManageBranchesToolbar";

const handleRowEditStart = (_, event) => {
    event.defaultMuiPrevented = true;
};

const handleRowEditStop = (_, event) => {
    event.defaultMuiPrevented = true;
};

const handleCellFocusOut = (_, event) => {
    event.defaultMuiPrevented = true;
};


export default function ManageBranchesView() {
    const { branches, setBranches } = useAppContext()
    const [rows, setRows] = useState([]);
    const [editRowsModel, setEditRowsModel] = useState({});
    const apiRef = useRef();

    const handleOnEditRowsModelChange = useCallback((model) => {
        setEditRowsModel(model);
    }, []);

    const getBranchesRows = () => {
        const branchesRows = branches.map(({_id: id, ...rest}) => ({id, ...rest}));
        return branchesRows;
    };

    useEffect(() => setRows(getBranchesRows()), [branches]);
    
    const renderColorCell = (readonly) => (cellValues) => {
        apiRef.current = cellValues.api;
        return (
            <ColorCell
                color={cellValues.value}
                readonly={readonly}
                mode={cellValues.cellMode}
                id={cellValues.id}
                api={cellValues.api}
                field={cellValues.field}
            />
        );
    };

    const columns = [
        { field: 'name', headerName: 'שם', minWidth: 200, flex: 1, align: 'right', editable: true },
        { 
          field: 'color', 
          headerName: 'צבע', 
          minWidth: 100, 
          editable: true,
          renderCell: renderColorCell(true),
          renderEditCell: renderColorCell(false)
        },
        { 
          field: 'actions', 
          headerName: 'אפשרויות', 
          type: 'actions', 
          minWidth: 100,
          getActions: getManageBranchesActions(apiRef, setBranches, useCustomSnackbar())
         }
    ];

    return (
        <>
            <Box dir="rtl" fullWidth>
                <DialogTitle>
                    ניהול קבוצות
                </DialogTitle>
                <DialogContent>
                    <LargeContainer>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            disableSelectionOnClick
                            editMode="row"
                            editRowsModel={editRowsModel}
                            onEditRowsModelChange={handleOnEditRowsModelChange}
                            onRowEditStart={handleRowEditStart}
                            onRowEditStop={handleRowEditStop}
                            onCellFocusOut={handleCellFocusOut}
                            components={{
                                Toolbar: ManageBranchesToolbar
                            }}
                            componentsProps={{
                                toolbar: { apiRef }
                            }}
                        />
                    </LargeContainer>
                </DialogContent>
            </Box>
        </>
    );
}

const LargeContainer = styled(Box)`
    height: ${0.75*window.innerHeight}px;
`;
