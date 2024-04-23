import { useLocation } from "@remix-run/react";
import { Section } from "napi-pallas";
import { useState } from "react";
import { SearchParams, getTopicMeta } from "../utils";
import { HexBlock, PropBlock, TopicMeta } from "./constructors";
import { DataSection, ValidationInformation } from "./index";

export function RootSection(props: {
  data: Section;
  topics: Record<string, TopicMeta>;
  era: string;
}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialOpen = searchParams.get(SearchParams.OPEN) === "true";
  const goesBeginning = searchParams.get(SearchParams.BEGINNING) === "true";
  const [open, setOpen] = useState<boolean | undefined>(undefined);
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
      {goesBeginning && (
        <div className="mb-14">
          <button
            className={`flex items-center w-full text-left select-none duration-300`}
            onClick={handleClick}
          >
            <div
              className={`h-8 w-8 inline-flex items-center justify-center duration-300 `}
            >
              {open ?? initialOpen ? "▼" : "▶"}
            </div>
            <div className="flex justify-between w-full">
              <h4 className="text-3xl ">Tx Validations - {props.era}</h4>
            </div>
          </button>
          {open ?? (initialOpen && <ValidationInformation />)}
        </div>
      )}
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
      {!goesBeginning && (
        <div className="mb-14">
          <button
            className={`flex items-center w-full text-left select-none duration-300`}
            onClick={handleClick}
          >
            <div
              className={`h-8 w-8 inline-flex items-center justify-center duration-300 `}
            >
              {open ?? initialOpen ? "▼" : "▶"}
            </div>
            <div className="flex justify-between w-full">
              <h4 className="text-3xl ">Tx Validations - {props.era}</h4>
            </div>
          </button>
          {open ?? (initialOpen && <ValidationInformation />)}
        </div>
      )}
    </div>
  );
}
