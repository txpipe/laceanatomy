import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  className?: string;
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
      className={`block w-full px-4 py-2 mt-1 border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8 
      appearance-none text-black placeholder-gray-400 text-2xl outline-none ${customClassName}`}
    />
  );
};
