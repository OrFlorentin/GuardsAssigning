import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import NavBar from './Shared/NavBar/NavBar';
import GuardShiftsView from './GuardView/GuardShiftsView';
import WeekView from './WeekView/WeekView';
import './App.css';
import ManageGuardsView from './ManageGuardsView/ManageGuardsView';
import MonthView from './MonthView/MonthView';
import AppContextProvider from './Shared/AppContext';
import LoginView from './LoginView/LoginView';
import GuardRestrictionsView from './GuardView/GuardRestrictionsView';
import ManageRestrictionsView from './ManageRestrictionsView/ManageRestrictionsView';
import RedirectToDefault from './Shared/Redirect/RedirectToDefault';
import BranchManagerRoute from './Shared/Routes/BranchManagerRoute';
import AdminRoute from './Shared/Routes/AdminRoute';
import AdminPanelView from './AdminPanelView/AdminPanelView';
import { SnackbarProvider } from 'notistack';
import { Box } from '@mui/material';

export default function App() {
    return (
        <Box height={`${window.innerHeight}px`}>
            <AppContextProvider>
                <SnackbarProvider maxSnack={2}>
                    <Router>
                        <RedirectToDefault />
                        <NavBar />

                        <Switch>
                            <Route path="/guard/shifts">
                                <GuardShiftsView />
                            </Route>
                            <Route path="/guard/restrictions">
                                <GuardRestrictionsView />
                            </Route>
                            <Route path="/month">
                                <MonthView />
                            </Route>
                            <Route path="/week">
                                <WeekView />
                            </Route>
                            
                            <BranchManagerRoute path="/manage_guards">
                                <ManageGuardsView />
                            </BranchManagerRoute>
                            <BranchManagerRoute path="/manage_restrictions">
                                <ManageRestrictionsView />
                            </BranchManagerRoute>
                            <AdminRoute path="/admin">
                                <AdminPanelView />
                            </AdminRoute>

                            <Route path="/login">
                                <LoginView />
                            </Route>
                        </Switch>
                    </Router>
                </SnackbarProvider>
            </AppContextProvider>
        </Box>
    );
}
