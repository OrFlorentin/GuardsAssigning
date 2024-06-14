import RedirectToDefault from '../Redirect/RedirectToDefault';
import { Route } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { isUserRoleIn } from '../Utils';

export default function PermittedRoute({ permittedRoles, path, children }) {
    const { currentUser } = useAppContext();

    if (!isUserRoleIn(currentUser, permittedRoles)) {
        return <RedirectToDefault />;
    }

    return <Route path={path} children={children} />;
}
