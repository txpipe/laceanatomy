import { Attribute, type Section } from "napi-pallas";
import { PropsWithChildren, useState } from "react";
import { IValidation } from "./routes/tx";

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
}) {
  const topic = getTopicMeta(props.data.topic, props.topics);

  return (
    <>
      <h4 className="text-3xl">{topic.title}</h4>
      {!props.data.error && topic.description}
      {!!props.data.error && (
        <div className="block mt-8 p-4 border-2 bg-red-200 border-red-700 shadow shadow-black rounded-lg text-2xl">
          {props.data.error}
        </div>
      )}
      {!!props.data.bytes && (
        <HexBlock name="bytes (hex)" value={props.data.bytes} />
      )}
      {props.data.attributes?.map((c) => (
        <PropBlock key={c.topic} data={c} topics={props.topics} />
      ))}
      {props.data.children?.map((c) => (
        <DataSection key={c.identity} data={c} topics={props.topics} />
      ))}
    </>
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

export function logCuriosity(data: any) {
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
      <div className="flex justify-between group">
        <button
          className={`flex items-center justify-between w-full px-4 pt-2 text-left select-none duration-300 ${
            validation.value
              ? "text-green-950 group-hover:text-green-500"
              : "text-red-950 group-hover:text-red-500"
          }`}
          onClick={handleClick}
        >
          {validation.value ? "✔" : "✘"}&nbsp;&nbsp;{validation.name}
        </button>
        <div
          className={`m-4 h-8 w-8 border-2 border-black inline-flex items-center justify-center 
        rounded-full shadow-tiny shadow-black bg-white duration-300 
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
      <div className="accordion-item-content transition-all ease-in-out transform scale-100 opacity-100">
        {open && (
          <p className="text-gray-600 pl-8 pb-4">{validation.description}</p>
        )}
      </div>
    </div>
  );
}

export function ValidationAccordion(props: { validations: IValidation[] }) {
  return (
    <div
      className="flex flex-col gap-3 relative w-full mx-auto lg:col-span-2
                    text-xl font-medium mt-10 overflow-hidden pb-1"
    >
      {props.validations.map((v) => (
        <AccordionItem key={v.name} validation={v} />
      ))}
    </div>
  );
}
