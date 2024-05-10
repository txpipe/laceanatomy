import { useLoaderData } from "@remix-run/react";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { Button } from "~/components/Button";
import { ValidationsContext } from "~/contexts/validations.context";
import {
  IProtocolParam,
  IUiConfigs,
  Networks,
  TabNames,
  TabType,
} from "~/interfaces";
import { loader } from "~/routes/tx";
import { paramsParser } from "~/utils";
import { ContextTab } from "./ContextTab";
import { UITab } from "./UITab";

interface ConfigsModalProps {
  closeModal: () => void;
  uiConfigs: IUiConfigs;
  setUiConfigs: Dispatch<SetStateAction<IUiConfigs>>;
}

export function ConfigsModal({
  closeModal,
  uiConfigs,
  setUiConfigs,
}: ConfigsModalProps) {
  const { context } = useContext(ValidationsContext);

  const tabs: TabType[] = [TabNames.Context, TabNames.UI_Options];
  const [selected, setSelected] = useState<TabType>(TabNames.Context);
  const latestParams = useLoaderData<typeof loader>();
  const [params, setParams] = useState<IProtocolParam[] | undefined>(undefined);

  useEffect(() => {
    if (latestParams) {
      const parsedParams = JSON.parse(JSON.stringify(latestParams));
      if (context.selectedNetwork === Networks.Mainnet)
        paramsParser(parsedParams.mainnetParams, setParams);
      if (context.selectedNetwork === Networks.Preprod)
        paramsParser(parsedParams.preprodParams, setParams);
      if (context.selectedNetwork === Networks.Preview)
        paramsParser(parsedParams.previewParams, setParams);
    }
  }, [context.selectedNetwork]);

  const changeSelected = (tab: TabType) => () => setSelected(tab);

  // To close config modal on esc press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal]);

  return (
    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-90" />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="relative w-3/4 text-center ring-2 ring-inset ring-black text-black bg-white shadow-small rounded-xl p-8">
          <h3 className="text-4xl">Tx Validation Configurations</h3>
          <button
            className="absolute right-5 top-3 text-4xl cursor-pointer rotate-45 box-border"
            onClick={closeModal}
            type="button"
          >
            +
          </button>
          <div className="flex flex-col mt-5 justify-center">
            <div className="flex gap-3 justify-center">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  onClick={changeSelected(tab as TabType)}
                  className={`hover:text-black ${
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
                className={`${
                  selected == TabNames.Context ? "block" : "hidden"
                }`}
              >
                <ContextTab latestParams={params} />
              </div>

              <div
                className={`${
                  selected == TabNames.UI_Options ? "block" : "hidden"
                }`}
              >
                <UITab uiConfigs={uiConfigs} setUiConfigs={setUiConfigs} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 h-full justify-center">
            <Button
              color="pink"
              className="hover:bg-pink-400 mt-3"
              onClick={closeModal}
            >
              Submit
            </Button>
            <Button
              type="submit"
              color="pink"
              className="hover:bg-pink-400 mt-3"
              onClick={closeModal}
            >
              Submit & Dissect
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
