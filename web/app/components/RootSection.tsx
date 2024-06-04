import { Section } from "napi-pallas";
import { EraType, IUiConfigs } from "~/interfaces";
import { ExampleCard } from "~/routes/tx";
import { getTopicMeta } from "~/utils";
import { HexBlock, PropBlock, TopicMeta } from "./constructors";
import { DataSection, ValidationInformation } from "./index";

export function RootSection({
  data,
  topics,
  era,
  uiConfigs,
}: {
  data: Section;
  topics: Record<string, TopicMeta>;
  era?: EraType;
  uiConfigs?: IUiConfigs;
}) {
  const goesBeginning = uiConfigs?.beginning;
  const topic = getTopicMeta(data.topic, topics);

  if (data.error)
    return (
      <>
        <div className="block mt-8 p-4 border-2 bg-red-200 border-red-700 shadow shadow-black rounded-lg text-2xl">
          <h4 className="text-3xl">{topic.description}</h4>
          {data.error}
          <br />
          Try other network or try checking your cbor.
        </div>
        <h2 className="mt-16 text-3xl text-gray-500">Or try this example:</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExampleCard />
        </div>
      </>
    );

  return (
    <div className="flex flex-col">
      {goesBeginning && era && uiConfigs && (
        <ValidationInformation era={era} initialOpen={uiConfigs.alwaysOpen} />
      )}
      <h4 className="text-3xl">{topic.title}</h4>
      {!!data.bytes && <HexBlock name="bytes (hex)" value={data.bytes} />}
      {data.attributes?.map((c) => (
        <PropBlock key={c.topic} data={c} topics={topics} />
      ))}
      {data.children?.map((c) => (
        <DataSection key={c.identity} data={c} topics={topics} />
      ))}
      {!goesBeginning && era && uiConfigs && (
        <ValidationInformation era={era} initialOpen={uiConfigs.alwaysOpen} />
      )}
    </div>
  );
}
