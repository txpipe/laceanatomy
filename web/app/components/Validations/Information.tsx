import { useLocation } from "@remix-run/react";
import { useContext, useState } from "react";
import { ValidationsContext } from "~/contexts/validations.context";
import { IValidation } from "~/interfaces";
import { SearchParams } from "~/utils";

function AccordionItem({ validation }: { validation: IValidation }) {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);

  return (
    <div
      key={validation.name}
      className={`px-3 py-2 border-2 rounded-xl 
      shadow shadow-black 
        ${
          validation.value
            ? "bg-green-200 border-green-700"
            : "bg-red-200 border-red-700"
        }
    `}
    >
      <button
        className="w-full flex justify-between group"
        onClick={handleClick}
      >
        <div
          className={`flex items-center justify-between w-full px-4 pt-2 text-left select-none duration-300 ${
            validation.value
              ? "text-green-950 group-hover:text-green-500"
              : "text-red-950 group-hover:text-red-500"
          }`}
        >
          {validation.value ? "✔" : "✘"}&nbsp;&nbsp;{validation.name}
          <div
            className={`m-4 h-8 w-8 border-2 border-black inline-flex items-center justify-center 
          rounded-full shadow-tiny shadow-black bg-white duration-300 text-black
          ${open ? "rotate-45 duration-300" : ""}
          ${
            validation.value
              ? "group-hover:bg-green-400"
              : "group-hover:bg-red-400"
          }
        `}
          >
            +
          </div>
        </div>
      </button>
      <div
        style={{
          maxHeight: open ? "500px" : "0",
          overflow: "hidden",
          transition: open
            ? "max-height 0.5s ease-in"
            : "max-height 0.1s ease-out",
        }}
        className="overflow-hidden accordion-item-content "
      >
        <p className="text-gray-600 pl-8 pb-4">{validation.description}</p>
      </div>
    </div>
  );
}

export function ValidationInformation() {
  const { validations } = useContext(ValidationsContext);
  const location = useLocation();
  const shownValidations =
    new URLSearchParams(location.search).get(SearchParams.LIST)?.split(",") ??
    [];
  return (
    <div
      className="flex flex-col gap-3 relative w-full mx-auto lg:col-span-2
        accordion text-xl font-medium mt-10 overflow-hidden pb-1"
    >
      {validations
        .filter((v) => shownValidations.includes(v.name))
        .map((v) => (
          <AccordionItem key={v.name} validation={v} />
        ))}
    </div>
  );
}
