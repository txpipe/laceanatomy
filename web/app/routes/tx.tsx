import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { Validation } from "napi-pallas";
import { useContext, useEffect, useState } from "react";
import { Button, ConfigsModal, Input, RootSection } from "~/components";
import { ValidationsContext } from "~/contexts/validations.context";
import {
  DataProps,
  EraType,
  Eras,
  IProtocolParam,
  Networks,
} from "~/interfaces";
import * as server from "~/routes/tx.server";
import TOPICS from "~/routes/tx.topics";
import {
  SearchParams,
  exampleCbor,
  formDataToContext,
  initialProtPps,
  paramsParser,
} from "~/utils";
import SettingsIcon from "../../public/settings.svg";

export const meta: MetaFunction = () => {
  return [
    { title: "Cardano Tx - Lovelace Anatomy" },
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
    const mainnetParams = server.getLatestParams(Networks.Mainnet);
    const preprodParams = server.getLatestParams(Networks.Preprod);
    const previewParams = server.getLatestParams(Networks.Preview);
    return json({ mainnetParams, preprodParams, previewParams });
  } catch (error) {
    return json({ error: "Error fetching protocol parameters" });
  }
}

export function ExampleCard(props: { title: string; address: string }) {
  return (
    <Form method="POST" replace={false}>
      <button
        type="submit"
        className="border-2 rounded-lg p-4 shadow bg-gray-100 cursor-pointer flex flex-col w-full h-full text-left"
      >
        <h3 className="text-xl">{props.title}</h3>
        <input type="hidden" readOnly value={props.address} name="raw" />
        <input readOnly value="Mainnet" name="Network" className="hidden" />
        <input readOnly value="Babbage" name="Era" className="hidden" />
        <input name="Block_slot" readOnly value={72316896} className="hidden" />
        {initialProtPps.map((param) => (
          <input
            key={param.name}
            readOnly
            value={param.value}
            name={param.name}
            className="hidden"
          />
        ))}
        <code className="w-full break-words block mt-4 text-gray-400">
          {props.address.substring(0, 30)}...
        </code>
      </button>
    </Form>
  );
}

export default function Index() {
  const initData = useActionData<typeof action>();
  const latestParams = useLoaderData<typeof loader>();
  const {
    setValidations,
    context,
    validations: contextValidations,
  } = useContext(ValidationsContext);
  const [data, setData] = useState<DataProps | undefined>(undefined);
  const [params, setParams] = useState<IProtocolParam[] | undefined>(undefined);
  const [rawCbor, setRawCor] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const handleModal = () => setModalOpen((prev) => !prev);

  const navigate = useNavigate();

  useEffect(() => {
    if (initData) {
      const newSearchParams = new URLSearchParams(location.search);
      const parsedInitData = JSON.parse(JSON.stringify(initData));
      setData(parsedInitData);
      if (parsedInitData.validations) {
        setValidations(parsedInitData.validations);
        if (!newSearchParams.get(SearchParams.LIST))
          newSearchParams.set(
            SearchParams.LIST,
            contextValidations.map((v) => v.name).join(",")
          );
        // When era is changed, every validation is shown
        if (parsedInitData.era !== context.selectedEra) {
          newSearchParams.delete(SearchParams.LIST);
          newSearchParams.set(
            SearchParams.LIST,
            parsedInitData.validations.map((v: Validation) => v.name).join(",")
          );
        }
        // When the example is used
        if (rawCbor === "") setRawCor(exampleCbor);
        if (!newSearchParams.get(SearchParams.OPEN))
          newSearchParams.set(SearchParams.OPEN, "false");
        if (!newSearchParams.get(SearchParams.BEGINNING))
          newSearchParams.set(SearchParams.BEGINNING, "true");
      }
      navigate(`?${newSearchParams.toString()}`, { replace: false });
    }
    if (latestParams) {
      const parsedParams = JSON.parse(JSON.stringify(latestParams));
      if (context.selectedNetwork === Networks.Mainnet)
        paramsParser(parsedParams.mainnetParams, setParams);
      if (context.selectedNetwork === Networks.Preprod)
        paramsParser(parsedParams.preprodParams, setParams);
      if (context.selectedNetwork === Networks.Preview)
        paramsParser(parsedParams.previewParams, setParams);
    }
  }, [initData, context.selectedNetwork]);

  // if (data) logCuriosity(data);

  const era: EraType = data?.era || Eras.Babbage;

  return (
    <main className="mt-10 px-4">
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Tx</h1>
      <p className="text-gray-600 text-xl">
        Lets dissect a Cardano transaction. Enter the corresponding CBOR to
        inspect its contents.
      </p>
      <div className="block mt-8">
        <Form
          method="POST"
          onSubmit={() => {
            setModalOpen(false);
          }}
        >
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
              type="button"
              onClick={handleModal}
              color="pink"
              className="hover:bg-pink-400"
            >
              <img alt="" src={SettingsIcon} /> Configs
            </Button>
            <div className={`${modalOpen ? "block" : "hidden"}`}>
              <ConfigsModal closeModal={handleModal} latestParams={params} />
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
            <ExampleCard title="Babbage Tx" address={exampleCbor} />
          </div>
        </>
      )}

      {data && <RootSection data={data} topics={TOPICS} era={era} />}
    </main>
  );
}
