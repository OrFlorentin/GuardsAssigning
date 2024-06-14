import NavBarButton from './NavBarButton';
import { useAppContext } from '../../AppContext';
import { isUserRoleIn } from '../../Utils';

export default function PermittedNavBarButton({ permittedRoles, to, children, onClick, icon }) {
    const { currentUser } = useAppContext();

    if (!isUserRoleIn(currentUser, permittedRoles)) {
        return <></>;
    }

    return <NavBarButton to={to} children={children} onClick={onClick} icon={icon} />;
}
