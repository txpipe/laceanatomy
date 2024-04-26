import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  className?: string;
  inputSize?: "small" | "medium";
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
}: InputProps) => {
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
