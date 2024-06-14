import {
    TextField,
    Avatar,
    Dialog,
    DialogTitle,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Button,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import styled from 'styled-components';

export default function DayDialog({ isDialogOpen, setIsDialogOpen, guards }) {
    const [activeGuard, setActiveGuard] = useState(undefined);

    const onSubmit = ({ name }) => {
        formik.resetForm();
    };

    const formik = useFormik({
        initialValues: {
            name: activeGuard,
        },
        onSubmit,
    });

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const handleListItemClick = (name) => {
        setActiveGuard(name);
    };

    return (
        <div>
            <Dialog onClose={handleClose} open={isDialogOpen} fullWidth>
                <DialogTitle>Guards</DialogTitle>
                <CenterContainer>
                    <RowContainer>
                        <List>
                            {guards &&
                                guards.map((guard) => (
                                    <ListItem
                                        button
                                        onClick={() => handleListItemClick(guard)}
                                        key={guard.name}
                                    >
                                        <ListItemAvatar>
                                            <Avatar>
                                                <PersonIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={guard.name} />
                                    </ListItem>
                                ))}
                        </List>
                        <ColumnForm onSubmit={formik.handleSubmit}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="name"
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <Button
                                style={{ marginTop: '2em', width: '20%' }}
                                color="primary"
                                variant="contained"
                                type="submit"
                            >
                                save
                            </Button>
                        </ColumnForm>
                    </RowContainer>
                </CenterContainer>
            </Dialog>
        </div>
    );
}

const CenterContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 1em;
`;

const ColumnForm = styled.form`
    display: flex;
    flex-direction: column;
`;

const RowContainer = styled.div`
    display: flex;
    flex-direction: row;
    width: 80%;
    justify-content: space-around;
`;
