import PermittedNavBarButton from "./PermittedNavBarButton";
import { UserRole } from "../../Enums";

export default function AdminNavBarButton({ to, children, onClick, icon }) {
    return (
        <PermittedNavBarButton
            permittedRoles={[UserRole.ADMIN]}
            to={to}
            children={children}
            onClick={onClick}
            icon={icon}
        />
    );
}
