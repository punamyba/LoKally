import React from "react";
import { Controller } from "react-hook-form";

interface OptionType {
  value: string;
  label: string;
}

interface RadioInputProps {
  control: any;
  name: string;
  label: string;
  rules?: any;
  options: OptionType[];
  onChange?: (selected: any) => void;
}

const RadioInput = ({ control, name, label, rules, options, onChange }: RadioInputProps) => {
  return (
    <div className="radio-container">
      {/* LEFT ALIGNED LABEL */}
      <label className="radio-label">{label}</label>

      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <>
            <div className="radio-group">
              {options.map((opt, index) => (
                <label key={index} className="radio-option">
                  <input
                    type="radio"
                    value={opt.value}
                    checked={field.value === opt.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      onChange && onChange({ value: e.target.value });
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {fieldState.error && (
              <p className="radio-error">{fieldState.error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
};

export default RadioInput;
