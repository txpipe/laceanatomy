import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  className?: string;
  inputSize?: "small" | "medium";
  label?: string;
  isCheckbox?: boolean;
}

export const Input = ({
  name,
  disabled,
  id,
  type,
  value,
  onChange,
  placeholder,
  className: customClassName,
  inputSize = "medium",
  label,
  isCheckbox = false,
  checked,
}: InputProps) => {
  if (isCheckbox) {
    return (
      <div className="w-full text-left flex justify-between p-2">
        <label htmlFor={id} className="text-xl select-none cursor-pointer">
          {label}
        </label>
        <div className="relative inline-block w-10 mr-4 align-top select-none">
          <label className="cursor-pointer">
            <div
              className={`toggle-label flex items-center overflow-hidden h-7 rounded-full 
              border-2 border-black rounded-b-full border-b-4 px-6 shadow-black shadow-small 
              transition-all duration-400 ease-in-out ${
                checked ? "bg-green-200 " : "bg-red-200 "
              }`}
            >
              <input
                id={id}
                name={name}
                defaultChecked={checked}
                type="checkbox"
                onChange={onChange}
                className={`toggle-checkbox absolute block w-3 h-3 rounded-full appearance-none cursor-pointer 
                transition-all duration-400 ease-in-out bg-black ${
                  checked ? "left-8" : "left-2"
                }`}
              />
            </div>
          </label>
        </div>
      </div>
    );
  }
  return (
    <input
      name={name}
      disabled={disabled}
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`block w-full border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8 
      appearance-none text-black placeholder-gray-400 outline-none text-2xl ${customClassName} ${
        inputSize == "small" ? "px-2 py-1 h-14  mt-0.5" : "px-4 py-2 mt-1"
      }`}
    />
  );
};
