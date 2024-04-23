import { useLocation, useNavigate } from "@remix-run/react";
import { useContext } from "react";
import { ValidationsContext } from "../../../contexts/validations.context";
import { SearchParams } from "../../../utils";

export const UITab = () => {
  const { validations } = useContext(ValidationsContext);
  const navigate = useNavigate();
  const location = useLocation();
  const shownValidations =
    new URLSearchParams(location.search).get(SearchParams.LIST)?.split(",") ??
    [];

  const changeValidations =
    (validation: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      const newSearchParams = new URLSearchParams(location.search);
      const currentValues =
        newSearchParams.get(SearchParams.LIST)?.split(",") ?? [];

      if (isChecked && !currentValues.includes(validation)) {
        currentValues.push(validation);
      } else {
        const index = currentValues.indexOf(validation);
        if (index > -1) currentValues.splice(index, 1);
      }

      if (currentValues.length > 0)
        newSearchParams.set(SearchParams.LIST, currentValues.join(","));
      else newSearchParams.delete(SearchParams.LIST);

      navigate(`?${newSearchParams.toString()}`);
    };

  const changeQuery =
    (q: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      const newSearchParams = new URLSearchParams(location.search);

      newSearchParams.set(q, `${isChecked}`);

      navigate(`?${newSearchParams.toString()}`, { replace: true });
    };

  const searchParams = new URLSearchParams(location.search);
  const initialOpen = searchParams.get(SearchParams.OPEN) === "true";
  const beginning = searchParams.get(SearchParams.BEGINNING) === "true";

  return (
    <div className="flex flex-col overflow-y-auto h-96">
      <div className="text-left text-3xl mb-3">Select validations to show</div>
      {validations.map((validation, index, arr) => (
        <div key={validation.name}>
          <div className="w-full text-left flex justify-between p-2">
            <label htmlFor={validation.name} className="text-xl">
              {validation.name}
            </label>
            <input
              id={validation.name}
              name={validation.name}
              checked={shownValidations.includes(validation.name)}
              type="checkbox"
              className=""
              onChange={changeValidations(validation.name)}
            />
          </div>
          {index !== arr.length - 1 && <hr />}
        </div>
      ))}
      <hr className="border-2 border-black my-4" />
      <div>
        <div className="text-left text-3xl mt-3">Others</div>

        <div className="w-full text-left flex justify-between p-2">
          <label htmlFor={"alwaysOpen"} className="text-xl">
            Validations section always open
          </label>
          <input
            id={"alwaysOpen"}
            checked={initialOpen}
            type="checkbox"
            className=""
            onChange={changeQuery(SearchParams.OPEN)}
          />
        </div>
        <div className="w-full text-left flex justify-between p-2">
          <label htmlFor={"beginning"} className="text-xl">
            Validations section at the beginning
          </label>
          <input
            id={"beginning"}
            checked={beginning}
            type="checkbox"
            className=""
            onChange={changeQuery(SearchParams.BEGINNING)}
          />
        </div>
      </div>
    </div>
  );
};
