import React, { ReactNode } from 'react';

export type OptionType = {
    label: string;
    badge?: string;
};

export type OptionsConfig<T extends string> = Record<T, OptionType>;

export class Options<T extends string> {
    constructor(private config: OptionsConfig<T>) { }

    get(key: T | null | undefined): OptionType {
        if (!key || !(key in this.config)) {
            return { label: "Unknown", badge: "badge-neutral" };
        }
        return this.config[key];
    }

    select(value: T | null | undefined, onChange: (value: T) => void): ReactNode {
        const selectedValue = value || "";
        return React.createElement(
            "select",
            {
                className: "select select-bordered",
                value: selectedValue,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T)
            },
            (Object.entries(this.config) as [string, OptionType][]).map(([key, opt]) =>
                React.createElement(
                    "option",
                    { key, value: key },
                    opt.label
                )
            )
        );
    }

    badge(key: T | null | undefined): ReactNode {
        const option = this.get(key);
        return React.createElement(
            "span",
            { className: `badge ${option.badge || "badge-neutral"}` },
            option.label
        );
    }
}

export const createOptions = <T extends string>(config: OptionsConfig<T>): Options<T> => {
    return new Options(config);
};
