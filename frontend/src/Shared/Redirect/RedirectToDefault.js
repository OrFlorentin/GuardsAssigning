import { Redirect } from "react-router";
import { useAppContext } from "../AppContext";
import { isBranchManager } from "../Utils";

export default function RedirectToDefault() {
    const { isLoggedIn, currentUser } = useAppContext();
    
    if (!isLoggedIn) {
        return <Redirect to="/login" />;
    }

    if (isBranchManager(currentUser)) {
        return <Redirect to='/month' />;
    }
    
    return <Redirect to='/guard/shifts' />;
}
