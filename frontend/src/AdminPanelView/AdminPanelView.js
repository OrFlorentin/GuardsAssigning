import { Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';
import ManageShiftTypesView from './ShiftTypeComponents/ManageShiftTypesView';
import { AdminPanelContainer, TabsContainer, TabPanel, AdminPanelTitle } from './AdminPanelComponents';
import ManageBranchesView from './BranchComponents/ManageBranchesView';
import { useEffect } from 'react';
import { isMobile } from '../Shared/Utils';

export default function AdminPanelView() {
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);

    const tabIds = [
        '#manage-shift-types',
        '#manage-branches'
    ];

    useEffect(() => {
        const tab = tabIds.indexOf(window.location.hash);
        setSelectedTabIndex(tab < 0 ? 0 : tab);
    }, []);

    let currentTabIndex = 0;

    const handleChange = (_, newValue) => {
        window.location.hash = tabIds[newValue];
        setSelectedTabIndex(newValue);
    };

    return (
        <>
            <AdminPanelContainer>
                <AdminPanelTitle>
                    <h1>Admin Panel</h1>
                </AdminPanelTitle>
                <TabsContainer>
                    <Tabs 
                        orientation={isMobile() ? "horizontal" : "vertical"}
                        onChange={handleChange}
                        value={selectedTabIndex}
                        sx={{borderRight: 1, borderColor: 'divider'}}
                        variant='fullWidth'
                    >
                        <Tab label="Manage Game Types" />
                        <Tab label="Manage Groups" />
                    </Tabs>
                    <TabPanel
                        id="manage-shift-types"
                        selectedTabIndex={selectedTabIndex}
                        index={currentTabIndex++}
                    >
                        <ManageShiftTypesView />
                    </TabPanel>
                    <TabPanel
                        id="manage-branches"
                        selectedTabIndex={selectedTabIndex}
                        index={currentTabIndex++}
                    >
                        <ManageBranchesView />
                    </TabPanel>
                </TabsContainer>
            </AdminPanelContainer>
        </>
    );
}
