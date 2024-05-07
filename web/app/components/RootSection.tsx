import { Section } from "napi-pallas";
import { EraType, IUiConfigs } from "~/interfaces";
import { ExampleCard } from "~/routes/tx";
import { exampleCbor, getTopicMeta } from "~/utils";
import { HexBlock, PropBlock, TopicMeta } from "./constructors";
import { DataSection, ValidationInformation } from "./index";

export function RootSection(props: {
  data: Section;
  topics: Record<string, TopicMeta>;
  era: EraType;
  uiConfigs: IUiConfigs;
}) {
  const goesBeginning = props.uiConfigs.beginning;
  const topic = getTopicMeta(props.data.topic, props.topics);

  if (props.data.error)
    return (
      <>
        <div className="block mt-8 p-4 border-2 bg-red-200 border-red-700 shadow shadow-black rounded-lg text-2xl">
          <h4 className="text-3xl">{topic.description}</h4>
          {props.data.error}
          <br />
          Try other network or try checking your cbor.
        </div>
        <h2 className="mt-16 text-3xl text-gray-500">Or try this example:</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExampleCard title="Babbage Tx" address={exampleCbor} />
        </div>
      </>
    );

  return (
    <div className="flex flex-col">
      {goesBeginning && (
        <ValidationInformation
          era={props.era}
          initialOpen={props.uiConfigs.alwaysOpen}
        />
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
        <ValidationInformation
          era={props.era}
          initialOpen={props.uiConfigs.alwaysOpen}
        />
      )}
    </div>
  );
}
