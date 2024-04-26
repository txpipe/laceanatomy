import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  type: "submit" | "button";
  className?: string;
  color?: "blue" | "pink";
}

export const Button = ({
  type,
  children,
  className: customClassName,
  color = "blue",
  onClick: onClickFn,
}: ButtonProps) => {
  return (
    <button
      onClick={onClickFn}
      type={type}
      className={`items-center shadow text-lg font-semibold inline-flex px-6 focus:outline-none justify-center text-center 
      ease-in-out duration-300 outline-none  border-2 sm:w-auto rounded-lg py-2 tracking-wide w-full select-none
      border-blue-950 shadow-black rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400  
      ${
        color === "blue"
          ? "bg-blue-400  hover:text-white"
          : "hover:bg-pink-200 focus:bg-pink-400"
      }
      ${customClassName}`}
    >
      {children}
    </button>
  );
};
