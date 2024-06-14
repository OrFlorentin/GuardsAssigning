import { useAppContext } from '../../Shared/AppContext';
import { getBranchName, getShiftGuard, getShiftType } from '../../Shared/Utils';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
} from '@mui/material';

export default function DailyGuardsTable({ dailyShifts }) {
    const { guards, branches, shiftTypes } = useAppContext();

    return (
        <TableContainer component={Card} variant="outlined" dir="rtl">
            <Table aria-label="table">
                <TableHead>
                    <TableRow>
                        <TableCell component="th" align="right" />
                        <TableCell component="th" align="right">
                            שם השחקן                        </TableCell>
                        <TableCell component="th" align="right">
                            קבוצה
                        </TableCell>
                        <TableCell component="th" align="right">
                            סוג המשחק
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {dailyShifts.map((shift) => (
                        <TableRow
                            key={shift._id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell align="right">סבב {shift.order + 1}</TableCell>
                            <TableCell align="right">
                                {getShiftGuard(shift, guards)?.name}
                            </TableCell>
                            <TableCell align="right">{getBranchName(shift.branch, branches)}</TableCell>
                            <TableCell align="right">
                                {getShiftType(shift, shiftTypes)?.name}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
