import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { Input } from "~/components/Input";
import { ValidationsContext } from "~/contexts/validations.context";
import { Eras, IUiConfigs } from "~/interfaces";
import {
  AlonzoValidations,
  BabbageValidations,
  ByronValidations,
  ShelleyMAValidations,
  UIOptions,
} from "~/utils";

export function UITab({
  uiConfigs,
  setUiConfigs,
}: {
  uiConfigs: IUiConfigs;
  setUiConfigs: Dispatch<SetStateAction<IUiConfigs>>;
}) {
  const { context, validations: contextValidations } =
    useContext(ValidationsContext);

  useEffect(() => {
    let newValidations = contextValidations.map((v) => v.name);
    switch (context.selectedEra) {
      case Eras.Byron:
        newValidations = ByronValidations;
        break;
      case Eras.ShelleyMA:
        newValidations = ShelleyMAValidations;
        break;
      case Eras.Alonzo:
        newValidations = AlonzoValidations;
        break;
      case Eras.Babbage:
        newValidations = BabbageValidations;
        break;
    }
    setUiConfigs((prev) => ({
      ...prev,
      validationsToSee: newValidations,
    }));
  }, [context.selectedEra]);

  const changeValidations =
    (validation: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      setUiConfigs((prev) => ({
        ...prev,
        validationsToSee: isChecked
          ? prev.validationsToSee.includes(validation)
            ? prev.validationsToSee
            : [...prev.validationsToSee, validation]
          : prev.validationsToSee.filter((v) => v !== validation),
      }));
    };

  const changeUIOptions =
    (q: UIOptions) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setUiConfigs((prev) => ({ ...prev, [q]: isChecked }));
    };

  const initialOpen = uiConfigs.alwaysOpen;
  const beginning = uiConfigs.beginning;

  const validations =
    context.selectedEra === Eras.Byron
      ? ByronValidations
      : context.selectedEra === Eras.ShelleyMA
      ? ShelleyMAValidations
      : context.selectedEra === Eras.Alonzo
      ? AlonzoValidations
      : context.selectedEra === Eras.Babbage
      ? BabbageValidations
      : [];

  return (
    <div className="flex flex-col overflow-y-auto h-96">
      <div
        className={`${
          context.selectedEra === Eras.Conway ? "hidden" : "block"
        }`}
      >
        <div className="text-left text-3xl mb-3">
          Select validations to show
        </div>
        {validations.map((validation, index, arr) => (
          <div key={validation}>
            <Input
              name={validation}
              id={validation}
              label={validation}
              isCheckbox
              checked={uiConfigs.validationsToSee.includes(validation)}
              onChange={changeValidations(validation)}
            />
            {index !== arr.length - 1 && <hr />}
          </div>
        ))}

        <hr className="border-2 border-black my-4" />
      </div>
      <div className="text-left text-3xl mt-3">Others</div>

      <Input
        name={"alwaysOpen"}
        id={"alwaysOpen"}
        label={"Validations section always open"}
        isCheckbox
        checked={initialOpen}
        onChange={changeUIOptions(UIOptions.OPEN)}
      />
      <Input
        name={"beginning"}
        id={"beginning"}
        label={"Show at beginning"}
        isCheckbox
        checked={beginning}
        onChange={changeUIOptions(UIOptions.BEGINNING)}
      />
    </div>
  );
}
