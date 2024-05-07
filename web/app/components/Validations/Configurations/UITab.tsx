import { useLocation, useNavigate } from "@remix-run/react";
import { useContext } from "react";
import { Input } from "~/components/Input";
import { ValidationsContext } from "~/contexts/validations.context";
import { SearchParams } from "~/utils";

export const UITab = () => {
  const { validations } = useContext(ValidationsContext);
  const navigate = useNavigate();
  const location = useLocation();
  const shownValidations =
    new URLSearchParams(location.search).get(SearchParams.LIST)?.split(",") ??
    [];

  const changeValidations =
    (validation: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = !event.target.checked;
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
    (q: SearchParams) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
          <Input
            name={validation.name}
            id={validation.name}
            label={validation.name}
            isCheckbox
            checked={shownValidations.includes(validation.name)}
            onChange={changeValidations(validation.name)}
          />
          {index !== arr.length - 1 && <hr />}
        </div>
      ))}
      <hr className="border-2 border-black my-4" />
      <div>
        <div className="text-left text-3xl mt-3">Others</div>

        <Input
          name={"alwaysOpen"}
          id={"alwaysOpen"}
          label={"Validations section always open"}
          isCheckbox
          checked={initialOpen}
          onChange={changeQuery(SearchParams.OPEN)}
        />
        <Input
          name={"beginning"}
          id={"beginning"}
          label={"Show at beginning"}
          isCheckbox
          checked={beginning}
          onChange={changeQuery(SearchParams.BEGINNING)}
        />
      </div>
    </div>
  );
};
