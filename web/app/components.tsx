import { PropsWithChildren } from "react";
import { Attribute, type Section } from "napi-pallas";

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

export function Paragraph(props: PropsWithChildren<{}>) {
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

  return (
    <blockquote className="mt-6 md:border-l-4 md:px-10 py-4 border-dashed">
      <h4 className="text-3xl">{topic.title}</h4>
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
        <HexBlock name={`${topic.title} CBOR (hex)`} value={props.data.bytes} />
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
  if (!!data) {
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
