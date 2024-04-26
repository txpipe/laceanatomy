import { Attribute } from "napi-pallas";
import { PropsWithChildren } from "react";
import { getTopicMeta } from "../utils";

export type TopicMeta = {
  title: string;
  description?: React.ReactElement;
};

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

export function EmptyBlock() {
  return (
    <div className="mt-8 p-4 border-2 bg-red-200 border-red-400 text-red-600 shadow shadow-black rounded-lg text-xl">
      Empty
    </div>
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
