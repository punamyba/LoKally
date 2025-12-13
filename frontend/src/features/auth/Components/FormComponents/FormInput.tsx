import React from "react";
import "./FormInput.css";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string; // <-- IMPORTANT
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ icon, error, ...rest }, ref) => {
    return (
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}

        <input ref={ref} {...rest} className={`input-field ${error ? "error" : ""}`} />

        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);

export default FormInput;
