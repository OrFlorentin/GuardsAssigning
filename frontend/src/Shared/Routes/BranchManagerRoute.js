import PermittedRoute from "./PermittedRoute";
import { UserRole } from "../Enums";

export default function BranchManagerRoute({ path, children }) {
    return (
        <PermittedRoute
            permittedRoles={[UserRole.BRANCH_MANAGER, UserRole.ADMIN]}
            path={path}
            children={children}
        />
    );
}
