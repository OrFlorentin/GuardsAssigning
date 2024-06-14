import PermittedNavBarButton from "./PermittedNavBarButton";
import { UserRole } from "../../Enums";

export default function BranchManagerNavBarButton({ to, children, onClick, icon }) {
    return (
        <PermittedNavBarButton
            permittedRoles={[UserRole.BRANCH_MANAGER, UserRole.ADMIN]}
            to={to}
            children={children}
            onClick={onClick}
            icon={icon}
        />
    );
}
