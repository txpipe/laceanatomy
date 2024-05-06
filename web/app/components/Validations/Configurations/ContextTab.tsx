import { useContext } from "react";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import { ValidationsContext } from "~/contexts/validations.context";
import {
  EraType,
  Eras,
  IProtocolParam,
  NetworkType,
  Networks,
} from "~/interfaces";
import { ByronPptParams } from "~/utils";

export const ContextTab = ({
  latestParams,
}: {
  latestParams: IProtocolParam[] | undefined;
}) => {
  const { context, setContext } = useContext(ValidationsContext);
  const isByron = context.selectedEra === Eras.Byron;
  const paramsList = isByron ? ByronPptParams : context.pptParams;
  const networks: NetworkType[] = [
    Networks.Mainnet,
    Networks.Preprod,
    Networks.Preview,
  ];
  const eras = [
    Eras.Byron,
    Eras.ShelleyMA,
    Eras.Alonzo,
    Eras.Babbage,
    Eras.Conway,
  ];
  const changeParam =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setContext((prev) => {
        const updatedParams = [...prev.pptParams];
        updatedParams[index] = {
          ...updatedParams[index],
          value:
            Number(e.target.value) >= 0
              ? Number(e.target.value)
              : updatedParams[index].value,
        };
        return { ...prev, pptParams: updatedParams };
      });
    };
  const changeNetwork = (value: NetworkType) => () =>
    setContext({ ...context, selectedNetwork: value });
  const changeEra = (value: EraType) => () =>
    setContext({ ...context, selectedEra: value });
  const changeBlockSlot = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContext({ ...context, blockSlot: Number(e.target.value) });
  };

  function setLatestParams() {
    if (!latestParams) return;
    setContext((prev) => ({
      ...prev,
      pptParams: latestParams,
    }));
  }

  return (
    <div className="flex flex-col overflow-y-auto h-96">
      <div>
        <div className="text-left text-3xl mt-3">Select a Network</div>
        {/* To get the network from the form*/}
        <input
          defaultValue={context.selectedNetwork}
          name="Network"
          className="hidden"
        />
        <div className="md:flex gap-4 p-2 grid grid-cols-2">
          {networks.map((net) => (
            <Button
              key={net}
              type="button"
              onClick={changeNetwork(net as NetworkType)}
              color="pink"
              className={`${
                context.selectedNetwork === net ? "bg-pink-400" : ""
              }`}
            >
              {net}
            </Button>
          ))}
        </div>
      </div>
      <hr className="border-2 border-black my-4" />
      <div>
        <div className="text-left text-3xl mt-3">Select an Era</div>
        {/* To get the era from the form*/}
        <input
          defaultValue={context.selectedEra}
          name="Era"
          className="hidden"
        />
        <div className="xl:flex gap-4 p-2 grid grid-cols-2">
          {eras.map((era) => (
            <Button
              key={era}
              type="button"
              onClick={changeEra(era as EraType)}
              color="pink"
              className={`
                  ${context.selectedEra === era ? "bg-pink-400" : ""}
                  `}
            >
              {era}
            </Button>
          ))}
        </div>
      </div>
      <hr className="border-2 border-black my-4" />
      <div>
        <div className="text-left text-3xl m-3">Select a Block Slot</div>
        <Input
          type="number"
          name="Block_slot"
          value={context.blockSlot}
          onChange={changeBlockSlot}
          className="focus:bg-pink-200 mb-3"
          inputSize="small"
        />
      </div>

      <hr className="border-2 border-black my-4" />
      <div className="flex items-center justify-between">
        <div className="text-left text-3xl mb-3">Protocol Parameters</div>

        <Button type="button" onClick={setLatestParams}>
          Get latest Protocol Parameters
        </Button>
      </div>
      <div className="grid xl:grid-cols-5 lg:grid-cols-2 gap-3 text-left w-full p-2">
        {paramsList.map((param, index) => (
          <div key={param.name}>
            <label htmlFor={param.name} className="">
              {param.name
                .split("_")
                .map((word) => word[0].toUpperCase() + word.slice(1))
                .join(" ")}
            </label>
            <Input
              id={param.name}
              name={param.name}
              type="number"
              disabled={isByron}
              value={Number(param.value).toString() ?? 0}
              onChange={changeParam(index)}
              className={`block w-full px-4 py-2 mt-1 border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400 text-2xl outline-none
            ${
              isByron
                ? "bg-slate-300 cursor-not-allowed"
                : "focus:bg-pink-200 hover:bg-pink-200"
            }`}
              inputSize="small"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
