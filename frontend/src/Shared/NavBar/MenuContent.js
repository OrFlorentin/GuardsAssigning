import { ResponsiveContainer } from '../Containers';
import NavBarButton from './Buttons/NavBarButton';
import styled from 'styled-components';
import BranchManagerNavBarButton from './Buttons/BranchManagerNavBarButton';
import AdminNavBarButton from './Buttons/AdminNavBarButton';
import Divider from '@mui/material/Divider';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import EventNoteIcon from '@mui/icons-material/EventNote';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import GroupIcon from '@mui/icons-material/Group';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import { isMobile } from '../Utils';


export const MenuContents = ({ closeFunction }) => {
    return (
        <ResponsiveContainerMobileRight>
            <NavBarButton onClick={closeFunction} icon={<EventNoteIcon />} to="/guard/shifts">המשחקים שלי</NavBarButton>
            <NavBarButton onClick={closeFunction} icon={<EventBusyIcon />} to="/guard/restrictions">הגשת הסתייגויות</NavBarButton>
            <NavBarButton onClick={closeFunction} icon={<EventIcon />} to="/month">תצוגה חודשית</NavBarButton>
            <NavBarButton onClick={closeFunction} icon={<CalendarViewWeekIcon />} to="/week">תצוגה שבועית</NavBarButton>
            {isMobile() && (<Divider />) }
            <BranchManagerNavBarButton onClick={closeFunction} icon={<GroupIcon />} to="/manage_guards">ניהול משתמשים</BranchManagerNavBarButton>
            <BranchManagerNavBarButton onClick={closeFunction} icon={<EventNoteIcon />} to="/manage_restrictions">ניהול הסתייגויות</BranchManagerNavBarButton>
            {isMobile() && (<Divider />) }
            <AdminNavBarButton onClick={closeFunction} icon={<SettingsIcon />} to="/admin">ניהול אדמין</AdminNavBarButton>
        </ResponsiveContainerMobileRight>
    );
}

const ResponsiveContainerMobileRight = styled(ResponsiveContainer)`
    justify-content: flex-end;
`
