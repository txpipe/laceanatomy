import { Attribute, type Section } from "napi-pallas";
import { PropsWithChildren, useEffect, useState } from "react";
import {
  DataProps,
  EraType,
  IContext,
  IValidation,
  NetworkType,
  ProtocolType,
  TabType,
} from "./interfaces";

export type TopicMeta = {
  title: string;
  description?: React.ReactElement;
};

function getTopicMeta(
  key: string | undefined,
  all: Record<string, TopicMeta>
): TopicMeta {
  return (
    all[key!] || {
      title: key,
    }
  );
}

export function PropBlock(props: {
  data: Attribute;
  topics: Record<string, TopicMeta>;
}) {
  const topic = getTopicMeta(props.data.topic, props.topics);

  return (
    <div className="mt-4">
      {topic.description}
      <div className="mt-4 p-4 border-2 bg-gray-200 border-gray-700 shadow shadow-black rounded-lg text-xl break-words">
        <div className="text-sm text-gray-600">{topic.title}</div>
        {props.data.value || "(empty)"}
      </div>
    </div>
  );
}

export function HexBlock(props: { name: string; value: string }) {
  return (
    <div className="mt-8 p-4 border-2 bg-green-200 border-green-700 shadow shadow-black rounded-lg text-2xl break-words">
      <div className="text-sm text-green-800">{props.name}</div>
      {props.value}
    </div>
  );
}

export function Paragraph(props: PropsWithChildren) {
  return <p className="text-gray-600 text-xl">{props.children}</p>;
}

export const P1 = Paragraph;

export function RootSection(props: {
  data: Section;
  topics: Record<string, TopicMeta>;
  validations: IValidation[];
  era: string;
}) {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);
  const topic = getTopicMeta(props.data.topic, props.topics);

  if (props.data.error)
    return (
      <div className="block mt-8 p-4 border-2 bg-red-200 border-red-700 shadow shadow-black rounded-lg text-2xl">
        <h4 className="text-3xl">{topic.description}</h4>
        {props.data.error}
      </div>
    );

  return (
    <div className="flex flex-col">
      <div className="mb-14">
        <button
          className={`flex items-center w-full text-left select-none duration-300`}
          onClick={handleClick}
        >
          <div
            className={`h-8 w-8 inline-flex items-center justify-center duration-300 `}
          >
            {open ? "▼" : "▶"}
          </div>
          <div className="flex justify-between w-full">
            <h4 className="text-3xl ">Tx Validations - {props.era}</h4>
          </div>
        </button>
        {open && <ValidationAccordion validations={props.validations} />}
      </div>
      <h4 className="text-3xl">{topic.title}</h4>
      {!!props.data.bytes && (
        <HexBlock name="bytes (hex)" value={props.data.bytes} />
      )}
      {props.data.attributes?.map((c) => (
        <PropBlock key={c.topic} data={c} topics={props.topics} />
      ))}
      {props.data.children?.map((c) => (
        <DataSection key={c.identity} data={c} topics={props.topics} />
      ))}
    </div>
  );
}

export function DataSection(props: {
  data: Section;
  topics: Record<string, TopicMeta>;
}) {
  const topic = getTopicMeta(props.data.topic, props.topics);
  const [open, setOpen] = useState(true);
  const handleClick = () => setOpen(!open);

  return (
    <blockquote className="mt-6 md:border-l-4 md:px-10 py-4 border-dashed">
      <button
        className={`flex items-center w-full text-left select-none duration-300`}
        onClick={handleClick}
      >
        <div
          className={`h-8 w-8 inline-flex items-center justify-center duration-300 `}
        >
          {open ? "▼" : "▶"}
        </div>
        <h4 className="text-3xl">{topic.title}</h4>
      </button>
      {open && (
        <>
          {topic.description}
          {!!props.data.error && (
            <div className="block mt-8 p-4 border-2 bg-red-200 border-red-700 shadow shadow-black rounded-lg text-2xl">
              {props.data.error}
            </div>
          )}
          {props.data.attributes?.map((c) => (
            <PropBlock key={c.topic} data={c} topics={props.topics} />
          ))}
          {props.data.children?.map((c) => (
            <DataSection key={c.identity} data={c} topics={props.topics} />
          ))}
          {!props.data.attributes?.length && !props.data.children?.length && (
            <EmptyBlock />
          )}
          {!!props.data.bytes && (
            <HexBlock
              name={`${topic.title} CBOR (hex)`}
              value={props.data.bytes}
            />
          )}
        </>
      )}
    </blockquote>
  );
}

export function EmptyBlock() {
  return (
    <div className="mt-8 p-4 border-2 bg-red-200 border-red-400 text-red-600 shadow shadow-black rounded-lg text-xl">
      Empty
    </div>
  );
}

export function Button(
  props: PropsWithChildren<{ type: "submit" | "button" }>
) {
  return (
    <button
      type={props.type}
      className="text-info-950 items-center shadow shadow-info-500 text-lg font-semibold inline-flex px-6 focus:outline-none justify-center text-center bg-info-300 focus:bg-info-500 border-info-500 ease-in-out duration-300 outline-none hover:bg-info-400 hover:text-white border-2 sm:w-auto rounded-lg py-2 tracking-wide w-full bg-blue-400 border-blue-950 shadow-black rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400"
    >
      {props.children}
    </button>
  );
}

export function TextArea(props: { name: string; placeholder?: string }) {
  return (
    <textarea
      name={props.name}
      className="block w-full h-64 p-4 mt-4 border-2 bg-white border-black shadow shadow-black rounded-lg rounded-b-xl border-b-8  appearance-none text-black placeholder-gray-400 text-xl outline-none break-words"
      placeholder={props.placeholder}
    />
  );
}

export function logCuriosity(data: DataProps) {
  if (data) {
    console.group("CURIOUS FELLOW, EH?");
    console.log("hello there! want to learn how we parse the data?");
    console.log(
      "we use the Pallas library on the backend. Pallas is a Rust library for Cardano. We compile it to native code and use FFI to trigger the logic from a NodeJS process."
    );
    console.log("https://github.com/txpipe/pallas");
    console.log(
      "here's the json payload for the data you see rendered on-screen:"
    );
    console.log(data);
    console.groupEnd();
  }
}

export function AccordionItem({ validation }: { validation: IValidation }) {
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

export function ValidationAccordion(props: { validations: IValidation[] }) {
  return (
    <div
      className="flex flex-col gap-3 relative w-full mx-auto lg:col-span-2
        accordion text-xl font-medium mt-10 overflow-hidden pb-1"
    >
      {props.validations.map((v) => (
        <AccordionItem key={v.name} validation={v} />
      ))}
    </div>
  );
}

export function ConfigsModal({
  closeModal,
  protocolParams,
  changeParam,
  otherContext,
  setOtherContext,
}: {
  closeModal: () => void;
  protocolParams: ProtocolType[];
  changeParam: (
    index: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  otherContext: IContext;
  setOtherContext: (c: IContext) => void;
}) {
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
      <div className="fixed inset-0 bg-gray-500 bg-opacity-70" />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="relative w-3/4 text-center ring-2 ring-inset ring-black text-black bg-white shadow-small rounded-xl p-8">
          <h3 className="text-4xl">Tx Validation Configurations</h3>
          <button
            className="absolute right-5 top-3 text-4xl cursor-pointer rotate-45 box-border"
            onClick={closeModal}
          >
            +
          </button>
          <Tabs
            otherContext={otherContext}
            protocolParams={protocolParams}
            changeParam={changeParam}
            setOtherContext={setOtherContext}
          />
          <button
            type="submit"
            className={`text-info-950 items-center shadow shadow-info-500 text-lg font-semibold inline-flex px-6 focus:outline-none justify-center text-center bg-info-300 focus:bg-info-500 border-info-500 ease-in-out duration-300 outline-none 
                  hover:bg-info-400 hover:bg-pink-400 border-2 sm:w-auto rounded-lg py-2 tracking-wide w-full border-blue-950 shadow-black rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400
                  mt-3`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function Tabs({
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
}) {
  const tabs = ["Protocol Parameters", "Other Context"];
  const networks = ["Mainnet", "Preprod", "Preview"];
  const eras = ["Byron", "Shelley MA", "Alonzo", "Babbage", "Conway"];
  const [selected, setSelected] = useState<TabType>("Protocol Parameters");

  const changeSelected = (tab: TabType) => () => setSelected(tab);
  const changeNetwork = (value: NetworkType) => () =>
    setOtherContext({ ...otherContext, selectedNetwork: value });
  const changeEra = (value: EraType) => () =>
    setOtherContext({ ...otherContext, selectedEra: value });
  const changeBlockSlot = (value: string) => {
    setOtherContext({ ...otherContext, blockSlot: Number(value) });
  };

  return (
    <div className="flex flex-col mt-5 justify-center">
      <div className="flex gap-3 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={changeSelected(tab as TabType)}
            className={`text-info-950 items-center shadow shadow-info-500 text-lg font-semibold inline-flex px-6 focus:outline-none justify-center text-center bg-info-300 focus:bg-info-500 border-info-500 ease-in-out duration-300 outline-none 
          hover:bg-blue-200 focus:bg-blue-400 border-2 sm:w-auto rounded-lg py-2 tracking-wide w-full border-blue-950 shadow-black rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400
            ${selected === tab ? "bg-blue-400" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-4 p-8 border-2 border-black rounded-2xl shadow">
        <div
          className={`grid xl:grid-cols-4 lg:grid-cols-2 gap-3 text-left w-full overflow-y-auto h-80 + ${
            selected === TabType.ProtocolParameters ? "block" : "hidden"
          }`}
        >
          {protocolParams.map((param, index) => (
            <div key={param.name}>
              <label htmlFor={param.name} className="text-lg">
                {param.name.replace(/_/g, " ")}
              </label>
              <input
                id={param.name}
                name={param.name}
                type="number"
                value={Number(param.value).toString() ?? 0}
                onChange={changeParam(index)}
                className="block w-full px-4 py-2 mt-1 border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400 text-2xl outline-none
                  focus:bg-pink-200 hover:bg-pink-200"
              />
            </div>
          ))}
        </div>

        <div
          className={`text-left flex flex-col gap-3 ${
            selected === TabType.Others ? "block" : "hidden"
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
                <button
                  key={net}
                  type="button"
                  name="network"
                  onClick={changeNetwork(net as NetworkType)}
                  className={`text-info-950 items-center shadow shadow-info-500 text-lg font-semibold inline-flex px-6 focus:outline-none justify-center text-center bg-info-300 focus:bg-info-500 border-info-500 ease-in-out duration-300 outline-none 
                  hover:bg-info-400 hover:bg-pink-200 focus:bg-pink-400 border-2 sm:w-auto rounded-lg py-2 tracking-wide w-full border-blue-950 shadow-black rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400
                  ${otherContext.selectedNetwork === net ? "bg-pink-400" : ""}
                  `}
                >
                  {net}
                </button>
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
                <button
                  key={era}
                  type="button"
                  onClick={changeEra(era as EraType)}
                  className={`text-info-950 items-center shadow shadow-info-500 text-lg font-semibold inline-flex px-6 focus:outline-none justify-center text-center bg-info-300 focus:bg-info-500 border-info-500 ease-in-out duration-300 outline-none 
                  hover:bg-info-400 hover:bg-pink-200 focus:bg-pink-400 border-2 sm:w-auto rounded-lg py-2 tracking-wide w-full border-blue-950 shadow-black rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400
                  ${otherContext.selectedEra === era ? "bg-pink-400" : ""}
                  `}
                >
                  {era}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xl">Select a Block Slot</div>
            <input
              type="number"
              name="Block_slot"
              value={otherContext.blockSlot}
              onChange={(e) => changeBlockSlot(e.target.value)}
              className="block w-full px-4 py-2 mt-4 border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400 text-2xl outline-none
                focus:bg-pink-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
