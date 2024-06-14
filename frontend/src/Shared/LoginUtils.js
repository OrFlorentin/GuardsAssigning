import { getCurrentUser } from './Calls';

export function updateIsLoggedIn(hasFirstAcknowledgeReceived, currentUser, setIsLoggedIn) {
    const hasToken = () => !!localStorage.getItem('token');

    const isLoggedIn = (hasFirstAcknowledgeReceived && !!currentUser) || hasToken();
    setIsLoggedIn(isLoggedIn);
}

export function logout(setCurrentUser) {
    localStorage.removeItem('token');
    setCurrentUser(undefined);
}

export function reloadCurrentUser(setCurrentUser, setHasFirstAcknowledgeReceived) {
    getCurrentUser()
        .then((response) => {
            setCurrentUser(response.data);
        })
        .catch(() => {
            logout(setCurrentUser);
        })
        .finally(() => {
            setHasFirstAcknowledgeReceived(true);
        });
}
