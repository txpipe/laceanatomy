import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useContext, useEffect, useState } from "react";
import { Button, ConfigsModal, Input, RootSection } from "~/components";
import { ValidationsContext } from "~/contexts/validations.context";
import { DataProps, EraType, Eras, IUiConfigs, Networks } from "~/interfaces";
import * as server from "~/routes/tx.server";
import TOPICS from "~/routes/tx.topics";
import {
  BabbageValidations,
  exampleCbor,
  formDataToContext,
  logCuriosity,
} from "~/utils";
import SettingsIcon from "../../public/settings.svg";

export const meta: MetaFunction = () => {
  return [
    { title: "Cardano Tx - Lace Anatomy" },
    { name: "description", content: "Lets dissect a Cardano transaction" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const raw = formData.get("raw");

  if (raw) {
    const { section, validations } = server.safeParseTx(
      raw.toString(),
      formDataToContext(formData)
    );
    if (!section.error) {
      return json({
        ...section,
        raw: String(raw),
        ...validations,
      });
    }
    return json({ error: section.error });
  }
  return json({ error: "an empty value? seriously?" });
}

export async function loader() {
  try {
    const mainnetParams = server.getLatestParameters(Networks.Mainnet);
    const preprodParams = server.getLatestParameters(Networks.Preprod);
    const previewParams = server.getLatestParameters(Networks.Preview);
    return json({ mainnetParams, preprodParams, previewParams });
  } catch (error) {
    return json({ error: "Error fetching protocol parameters" });
  }
}

export function ExampleCard() {
  const { context } = useContext(ValidationsContext);
  return (
    <Form method="POST" replace={false}>
      <button
        type="submit"
        className="border-2 rounded-lg p-4 shadow bg-gray-100 cursor-pointer flex flex-col w-full h-full text-left"
      >
        <h3 className="text-xl">Example Babbage Tx</h3>
        <input type="hidden" readOnly value={exampleCbor} name="raw" />
        <input
          readOnly
          value={context.selectedNetwork}
          name="Network"
          className="hidden"
        />
        <input
          readOnly
          value={context.selectedEra}
          name="Era"
          className="hidden"
        />
        <input name="Block_slot" readOnly value={72316896} className="hidden" />
        {context.pptParams.map((param) => (
          <input
            key={param.name}
            readOnly
            value={param.value}
            name={param.name}
            className="hidden"
          />
        ))}
        <code className="w-full break-words block mt-4 text-gray-400">
          {exampleCbor.substring(0, 30)}...
        </code>
      </button>
    </Form>
  );
}

export default function Index() {
  const initData = useActionData<typeof action>();
  const { setValidations } = useContext(ValidationsContext);
  const [data, setData] = useState<DataProps | undefined>(undefined);
  const [rawCbor, setRawCor] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [uiConfigs, setUiConfigs] = useState<IUiConfigs>({
    alwaysOpen: false,
    beginning: true,
    validationsToSee: BabbageValidations,
  });
  const handleModal = () => setModalOpen((prev) => !prev);

  useEffect(() => {
    if (initData) {
      const parsedInitData: DataProps = JSON.parse(JSON.stringify(initData));
      setData(parsedInitData);
      setRawCor(parsedInitData.raw);
      if (parsedInitData.validations) {
        setValidations(
          parsedInitData.validations.map((v) => ({
            ...v,
            shown: uiConfigs.validationsToSee.includes(v.name),
          }))
        );
        // When the example is used
        if (!rawCbor) {
          setRawCor(exampleCbor);
        }
      }
    }
  }, [initData]);

  if (data) logCuriosity(data);

  const era: EraType = data?.era || Eras.Babbage;

  return (
    <main className="mt-10 px-4">
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Tx</h1>
      <p className="text-gray-600 text-xl">
        Lets dissect a Cardano transaction. Enter the corresponding CBOR to
        inspect its contents.
      </p>
      <div className="block mt-8">
        <Form method="POST" onSubmit={() => setModalOpen(false)}>
          <Input
            type="text"
            autoComplete="off"
            value={rawCbor}
            onChange={(e) => setRawCor(e.target.value)}
            name="raw"
            placeholder="Enter the CBOR for any Cardano Tx using HEX-encoding"
          />
          <div className="flex flex-row justify-end mt-4 gap-3">
            <Button
              onClick={handleModal}
              color="pink"
              className="hover:bg-pink-400"
            >
              <img alt="" src={SettingsIcon} /> Configs
            </Button>
            <div className={`${modalOpen ? "block" : "hidden"}`}>
              <ConfigsModal
                closeModal={() => setModalOpen(false)}
                uiConfigs={uiConfigs}
                setUiConfigs={setUiConfigs}
              />
            </div>
            <Button type="submit">Dissect</Button>
          </div>
        </Form>
      </div>

      {!data && (
        <>
          <h2 className="mt-16 text-3xl text-gray-500">
            Or try one of these examples...
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExampleCard />
          </div>
        </>
      )}

      {data && (
        <RootSection
          data={data}
          topics={TOPICS}
          era={era}
          uiConfigs={uiConfigs}
        />
      )}
    </main>
  );
}
