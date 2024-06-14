import { Divider, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import { useAppContext } from "../Shared/AppContext";
import SelectField from "../Shared/FormFields/SelectField";

export default function AddRoleExtraParameters({
    role,
    setFieldValue,
    activeGuard
}) {
    const { branches, populationTypes } = useAppContext();
    const [branch, setBranch] = useState(null);
    const [populationType, setPopulationType] = useState(null);

    const default_branch = activeGuard?.branch;
    const default_population_type = activeGuard?.population_types.length > 0 ? activeGuard.population_types[0] : null;

    useEffect(() => {
        if (role === "admin") {
            setFieldValue('extra_parameters', null);
        }
        else if (role === "manager") {
            setBranch(default_branch);
            setPopulationType(default_population_type);
        }
    }, [role]);
    
    useEffect(() => {
        if (role === "manager") {
            setFieldValue('extra_parameters', {branch: branch, population_type: populationType})
        }
    }, [branch, populationType]);

    if (role === "manager") {
        return (
            <>
                <Divider textAlign="left">פרמטרים נוספים</Divider>
                <SelectField
                    label="ענף"
                    defaultValue={default_branch}
                    onChange={(e) => setBranch(e.target.value)}
                >
                    {branches.map((branch, index) => (
                        <MenuItem key={index} value={branch._id}>
                            {branch.name}
                        </MenuItem>
                    ))}
                </SelectField>
                <SelectField
                    label="סוג אוכלוסייה"
                    defaultValue={default_population_type}
                    onChange={(e) => setPopulationType(e.target.value)}
                >
                    {populationTypes.map((populationType, index) => (
                        <MenuItem key={index} value={populationType}>
                            {populationType}
                        </MenuItem>
                    ))}
                </SelectField>
            </>
        );
    }
    return (
        <></>
    );
}
