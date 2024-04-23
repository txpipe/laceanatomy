import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigate } from "@remix-run/react";
import { useContext, useEffect, useState } from "react";
import SettingsIcon from "../../public/settings.svg";
import { Button, ConfigsModal, Input, RootSection } from "../components";
import { ValidationsContext } from "../contexts/validations.context";
import { DataProps } from "../interfaces";
import {
  SearchParams,
  exampleCbor,
  formDataToContext,
  initialProtPps,
  logCuriosity,
} from "../utils";
import * as server from "./tx.server";
import TOPICS from "./tx.topics";

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
    return json({
      ...section,
      raw,
      ...validations,
    });
  } else {
    return json({ error: "an empty value? seriously?" });
  }
}

function ExampleCard(props: { title: string; address: string }) {
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
  const initData: DataProps | undefined = useActionData();
  const { setValidations, context, validations } =
    useContext(ValidationsContext);
  const [data, setData] = useState<DataProps | undefined>(initData);
  const [rawCbor, setRawCor] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initData) {
      const newSearchParams = new URLSearchParams(location.search);
      setData(initData);
      if (initData.validations) {
        setValidations(initData.validations);
        if (!newSearchParams.get(SearchParams.LIST))
          newSearchParams.set(
            SearchParams.LIST,
            validations.map((v) => v.name).join(",")
          );
        // When era is changed, every validation is shown
        if (initData.era !== context.selectedEra) {
          newSearchParams.delete(SearchParams.LIST);
          newSearchParams.set(
            SearchParams.LIST,
            initData.validations.map((v) => v.name).join(",")
          );
        }
        // When the example is used
        if (rawCbor === "") setRawCor(exampleCbor);
        if (!newSearchParams.get(SearchParams.OPEN))
          newSearchParams.set(SearchParams.OPEN, "false");
        if (!newSearchParams.get(SearchParams.BEGINNING))
          newSearchParams.set(SearchParams.BEGINNING, "true");
      }
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.selectedEra, initData]);

  if (data) logCuriosity(data);

  const era = data?.era || "";

  const handleModal = () => setModalOpen((prev) => !prev);

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
            <Button type="submit">Dissect</Button>
          </div>
          {modalOpen && <ConfigsModal closeModal={handleModal} />}
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
