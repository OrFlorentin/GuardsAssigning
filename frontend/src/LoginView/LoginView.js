import { Box, Button, CircularProgress, Stack, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import { ReactComponent as SudokuLogoCircle } from '../assets/sudoku-circle.svg';
import { useAppContext } from '../Shared/AppContext';
import { devLogin, getLoginRedirectUrl, microsoftLogin } from '../Shared/Calls';
import { CenterContainer } from '../Shared/Containers';
import { reloadCurrentUser } from '../Shared/LoginUtils';
import RedirectToDefault from '../Shared/Redirect/RedirectToDefault';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';
import MicrosoftLoginButton from './MicrosoftLoginButton';


export default function LoginView() {
    const { isLoggedIn, setCurrentUser, setHasFirstAcknowledgeReceived } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const commitPostLoginActions = (token) => {
        localStorage.setItem('token', token);

        console.log(`Successful login to user`);
        showSuccessSnackbar('login-success', `Successful login to user`);

        reloadCurrentUser(setCurrentUser, setHasFirstAcknowledgeReceived);
    };

    const search = useLocation().search;
    const token = new URLSearchParams(search).get('token');
    const isErrorReturned = new URLSearchParams(search).get('error');

    useEffect(() => {
        if (token) {
            commitPostLoginActions(token);
        }
        if (isErrorReturned) {
            setIsLoggingIn(false);
            showErrorSnackbar('login-failed', `Login failed`);
        }
    }, [token]);

    const handleSubmit = (values) => {
        devLogin(values)
            .then((response) => {
                const token = response.data.access_token;
                commitPostLoginActions(token);
            })
            .catch((error) => {
                const errorMsg = error?.response?.data?.detail || 'Unknown error'

                console.log(`Login failed: ${errorMsg}`);
                showErrorSnackbar('login-failed', `Login failed: ${errorMsg}`);
            });
    };

    const onLoginWithMicrosoftClick = () => {
        setIsLoggingIn(true);
        getLoginRedirectUrl()
            .then((response) => {
                microsoftLogin(response.data);
            })
            .catch((error) => {
                setIsLoggingIn(false);
                const errorMsg = error?.response?.data?.detail || 'Unknown error'

                console.log(`Login failed: ${errorMsg}`);
                showErrorSnackbar('login-failed', `Login failed: ${errorMsg}`);
            });
    };

    if (isLoggedIn) {
        return <RedirectToDefault />;
    }

    return (
        <Box height={`${window.innerHeight - 64}px`}>
            <CenterContainer>
                <SudokuLogoCircle height="128px" width="128px" style={{ marginBottom: '60px' }} />
                <Formik initialValues={{ username: " ", password: " " }} onSubmit={handleSubmit}>
                    {({ setFieldValue }) => (
                        <Form>
                            <Stack spacing={2} mr={1} ml={1} width='100vw' maxWidth={300}>
                                {process.env.REACT_APP_HOST_ENV === 'development' &&
                                    <>
                                        <TextField
                                            id="username"
                                            label="שם משתמש"
                                            onChange={(e) => setFieldValue('username', e.target.value)}
                                        />
                                        <Button type="submit" variant="outlined">
                                            התחברות
                                        </Button>
                                    </>
                                }
                                <MicrosoftLoginButton onClick={onLoginWithMicrosoftClick} />
                                {isLoggingIn &&
                                    <CenterContainer>
                                        <CircularProgress />
                                    </CenterContainer>
                                }
                            </Stack>
                        </Form>
                    )}
                </Formik>
            </CenterContainer>
        </Box>
    );
}
