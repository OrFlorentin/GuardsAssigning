import { useSnackbar } from 'notistack';

export function useCustomSnackbar() {
    const { enqueueSnackbar } = useSnackbar();

    return {
        showSuccessSnackbar: (key, message) =>
            enqueueSnackbar(message, { variant: 'success', key: key, preventDuplicate: true }),
        showWarningSnackbar: (key, message) =>
            enqueueSnackbar(message, { variant: 'warning', key: key, preventDuplicate: true }),
        showErrorSnackbar: (key, message) =>
            enqueueSnackbar(message, { variant: 'error', key: key, preventDuplicate: true }),
    }
}
