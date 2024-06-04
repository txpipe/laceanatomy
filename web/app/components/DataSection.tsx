import { Section } from "napi-pallas";
import { useState } from "react";
import { getTopicMeta } from "~/utils";
import { EmptyBlock, HexBlock, PropBlock, TopicMeta } from "./constructors";

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
