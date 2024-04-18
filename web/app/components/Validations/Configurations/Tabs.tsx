import { useState } from "react";
import { Button, Input } from "../../../components";
import {
  EraType,
  Eras,
  IContext,
  NetworkType,
  Networks,
  ProtocolType,
  TabNames,
  TabType,
} from "../../../interfaces";
import { ByronPptParams } from "../../../utils";

export const Tabs = ({
  otherContext,
  protocolParams,
  changeParam,
  setOtherContext,
}: {
  otherContext: IContext;
  protocolParams: ProtocolType[];
  changeParam: (
    index: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  setOtherContext: (c: IContext) => void;
}) => {
  const tabs: TabType[] = [TabNames.ProtocolParameters, TabNames.Others];
  const networks: NetworkType[] = [
    Networks.Mainnet,
    Networks.Preprod,
    Networks.Preview,
  ];
  const eras = ["Byron", "Shelley MA", "Alonzo", "Babbage", "Conway"];
  const [selected, setSelected] = useState<TabType>(
    TabNames.ProtocolParameters
  );

  const changeSelected = (tab: TabType) => () => setSelected(tab);
  const changeNetwork = (value: NetworkType) => () =>
    setOtherContext({ ...otherContext, selectedNetwork: value });
  const changeEra = (value: EraType) => () =>
    setOtherContext({ ...otherContext, selectedEra: value });
  const changeBlockSlot = (value: string) => {
    setOtherContext({ ...otherContext, blockSlot: Number(value) });
  };

  const isByron = otherContext.selectedEra === Eras.Byron;
  const paramsList = isByron ? ByronPptParams : protocolParams;

  return (
    <div className="flex flex-col mt-5 justify-center">
      <div className="flex gap-3 justify-center">
        {tabs.map((tab) => (
          <Button
            key={tab}
            type="button"
            onClick={changeSelected(tab as TabType)}
            className={`hover:text-black 
            ${
              selected === tab
                ? "focus:bg-blue-400 bg-blue-400"
                : "bg-white hover:bg-blue-200"
            }`}
          >
            {tab}
          </Button>
        ))}
      </div>
      <div className="mt-4 p-8 border-2 border-black rounded-2xl shadow">
        <div
          className={`grid xl:grid-cols-4 lg:grid-cols-2 gap-3 text-left w-full overflow-y-auto h-80 + ${
            selected === TabNames.ProtocolParameters ? "block" : "hidden"
          }`}
        >
          {paramsList.map((param, index) => (
            <div key={param.name}>
              <label htmlFor={param.name} className="text-lg">
                {param.name.replace(/_/g, " ")}
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
              />
            </div>
          ))}
        </div>

        <div
          className={`text-left flex flex-col gap-3 ${
            selected === TabNames.Others ? "block" : "hidden"
          }`}
        >
          <div>
            <div className="text-xl">Select a Network</div>
            {/* To get the network from the form*/}
            <input
              value={otherContext.selectedNetwork}
              name="Network"
              className="hidden"
            />
            <div className="md:flex gap-4 p-2 grid grid-cols-2">
              {networks.map((net) => (
                <Button
                  key={net}
                  type="button"
                  name="network"
                  onClick={changeNetwork(net as NetworkType)}
                  color="pink"
                  className={`${
                    otherContext.selectedNetwork === net ? "bg-pink-400" : ""
                  }`}
                >
                  {net}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xl">Select an Era</div>
            {/* To get the era from the form*/}
            <input
              value={otherContext.selectedEra}
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
                  ${otherContext.selectedEra === era ? "bg-pink-400" : ""}
                  `}
                >
                  {era}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xl">Select a Block Slot</div>
            <Input
              type="number"
              name="Block_slot"
              value={otherContext.blockSlot}
              onChange={(e) => changeBlockSlot(e.target.value)}
              className="focus:bg-pink-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
