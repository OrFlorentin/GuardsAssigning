import { useState } from "react";
import TextField from "./TextField";

export function DateField({ label, defaultValue, onChange, type, ...props })
{
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!defaultValue);

    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);

    return (
        <TextField
            type={(hasValue || isFocused) ? "date" : "text"}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={(e) => {
                if (e.target.value) setHasValue(true);
                else setHasValue(false);
                onChange(e);
            }}
            label={label}
            defaultValue={defaultValue}
            {...props}
        />
    );
}

