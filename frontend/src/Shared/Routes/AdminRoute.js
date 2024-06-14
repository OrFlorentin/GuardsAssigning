import PermittedRoute from "./PermittedRoute";
import { UserRole } from "../Enums";

export default function AdminRoute({ path, children }) {
    return (
        <PermittedRoute
            permittedRoles={[UserRole.ADMIN]}
            path={path}
            children={children}
        />
    );
}
