import { useState } from "react";
import { Button } from "~/components/Button";
import { IProtocolParam, TabNames, TabType } from "~/interfaces";
import { ContextTab } from "./ContextTab";
import { UITab } from "./UITab";

export const Tabs = ({
  latestParams,
}: {
  latestParams: IProtocolParam[] | undefined;
}) => {
  const tabs: TabType[] = [TabNames.Context, TabNames.UI_Options];
  const [selected, setSelected] = useState<TabType>(TabNames.Context);

  const changeSelected = (tab: TabType) => () => setSelected(tab);

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
        <div className={`${selected == TabNames.Context ? "block" : "hidden"}`}>
          <ContextTab latestParams={latestParams} />
        </div>

        <div
          className={`${selected == TabNames.UI_Options ? "block" : "hidden"}`}
        >
          <UITab />
        </div>
      </div>
    </div>
  );
};
