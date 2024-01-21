import { EventHandler, PropsWithChildren, useCallback } from "react";
import { type Section } from "napi-pallas";

export function PropBlock(props: { name?: string; value?: string }) {
  return (
    <div className="mt-8 p-4 border-2 bg-gray-200 border-gray-700 shadow shadow-black rounded-lg text-xl">
      <div className="text-sm text-gray-600">{props.name}</div>
      {props.value}
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

export function DataSection(props: { data: Section }) {
  return (
    <blockquote className="mt-6 md:border-l-4 md:px-10 py-4 border-dashed">
      <h4 className="text-3xl">{props.data.topic}</h4>
      {!!props.data.error && (
        <div className="block mt-8 p-4 border-2 bg-red-200 border-red-700 shadow shadow-black rounded-lg text-2xl">
          {props.data.error}
        </div>
      )}
      {!!props.data.bytes && (
        <HexBlock name="bytes (hex)" value={props.data.bytes} />
      )}
      {props.data.attributes?.map((c) => (
        <PropBlock name={c.topic} value={c.value} />
      ))}
      {props.data.children?.map((c) => (
        <DataSection key={c.identity} data={c} />
      ))}
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
