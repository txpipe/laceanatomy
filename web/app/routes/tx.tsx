import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useState } from "react";
import SettingsIcon from "../../public/settings.svg";
import { Button, ConfigsModal, RootSection, logCuriosity } from "../components";
import { DataProps, IContext, IValidation, ProtocolType } from "../interfaces";
import { decimalToFraction, initialProtPps } from "../utils";
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
  const era = formData.get("Era");
  const net = formData.get("Network");
  const [a0Numerator, a0Denominator] = decimalToFraction(
    Number(formData.get("A0"))
  );
  const [rhoNumerator, rhoDenominator] = decimalToFraction(
    Number(formData.get("Rho"))
  );
  const [tauNumerator, tauDenominator] = decimalToFraction(
    Number(formData.get("Tau"))
  );
  const [decentralisationParamNumerator, decentralisationParamDenominator] =
    decimalToFraction(Number(formData.get("Decentralisation_param")));
  const [extraEntropyNumerator, extraEntropyDenominator] = decimalToFraction(
    Number(formData.get("Extra_entropy"))
  );
  const [priceMemNumerator, priceMemDenominator] = decimalToFraction(
    Number(formData.get("Price_mem"))
  );
  const [priceStepNumerator, priceStepDenominator] = decimalToFraction(
    Number(formData.get("Price_step"))
  );

  if (raw) {
    const { section, validations } = server.safeParseTx(raw.toString(), {
      epoch: Number(formData.get("Epoch")),
      minFeeA: Number(formData.get("Min_fee_a")),
      minFeeB: Number(formData.get("Min_fee_b")),
      maxBlockSize: Number(formData.get("Max_block_size")),
      maxTxSize: Number(formData.get("Max_tx_size")),
      maxBlockHeaderSize: Number(formData.get("Max_block_header_size")),
      keyDeposit: Number(formData.get("Key_deposit")),
      poolDeposit: Number(formData.get("Pool_deposit")),
      eMax: Number(formData.get("E_max")),
      nOpt: Number(formData.get("N_opt")),
      a0Numerator: a0Numerator,
      a0Denominator: a0Denominator,
      rhoNumerator: rhoNumerator,
      rhoDenominator: rhoDenominator,
      tauNumerator: tauNumerator,
      tauDenominator: tauDenominator,
      decentralisationParamNumerator: decentralisationParamNumerator,
      decentralisationParamDenominator: decentralisationParamDenominator,
      extraEntropyNumerator: extraEntropyNumerator,
      extraEntropyDenominator: extraEntropyDenominator,
      protocolMajorVer: Number(formData.get("Protocol_major_ver")),
      protocolMinorVer: Number(formData.get("Protocol_minor_ver")),
      minUtxo: Number(formData.get("Min_utxo")),
      minPoolCost: Number(formData.get("Min_pool_cost")),
      priceMemNumerator: priceMemNumerator,
      priceMemDenominator: priceMemDenominator,
      priceStepNumerator: priceStepNumerator,
      priceStepDenominator: priceStepDenominator,
      maxTxExMem: Number(formData.get("Max_tx_ex_mem")),
      maxTxExSteps: Number(formData.get("Max_tx_ex_steps")),
      maxBlockExMem: Number(formData.get("Max_block_ex_mem")),
      maxBlockExSteps: Number(formData.get("Max_block_ex_steps")),
      maxValSize: Number(formData.get("Max_val_size")),
      collateralPercent: Number(formData.get("Collateral_percent")),
      maxCollateralInputs: Number(formData.get("Max_collateral_inputs")),
      coinsPerUtxoSize: Number(formData.get("Coins_per_utxo_size")),
      coinsPerUtxoWord: Number(formData.get("Coins_per_utxo_word")),
      blockSlot: Number(formData.get("Block_slot")),
      era: era?.toString() ?? "Babbage",
      network: net?.toString() ?? "Mainnet",
    });
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
  const data: DataProps | undefined = useActionData();
  const [modalOpen, setModalOpen] = useState(false);
  const [protocolParams, setProtocolParams] =
    useState<ProtocolType[]>(initialProtPps);

  const [otherContext, setOtherContext] = useState<IContext>({
    blockSlot: 72316896,
    selectedEra: "Babbage",
    selectedNetwork: "Mainnet",
  });

  if (data) logCuriosity(data);

  const validations: IValidation[] = data?.validations || [];
  const era = data?.era || "";

  const handleModal = () => setModalOpen((prev) => !prev);

  const changeParam =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setProtocolParams((prev: ProtocolType[]) => {
        const updatedParams = [...prev];
        updatedParams[index] = {
          ...updatedParams[index],
          value:
            Number(e.target.value) >= 0
              ? Number(e.target.value)
              : updatedParams[index].value,
        };
        return updatedParams;
      });
    };

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
          <input
            type="text"
            autoComplete="off"
            defaultValue={data?.raw}
            name="raw"
            className="block w-full px-4 py-2 mt-4 border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8  appearance-none text-black placeholder-gray-400 text-2xl outline-none"
            placeholder="Enter the CBOR for any Cardano Tx using HEX-encoding"
          />
          <div className="flex flex-row justify-end mt-4 gap-3">
            <button
              type="button"
              onClick={handleModal}
              className="text-info-950 items-center shadow shadow-info-500 text-lg font-semibold inline-flex px-6 focus:outline-none justify-center text-center bg-info-300 focus:bg-info-500 border-info-500 ease-in-out duration-300 outline-none hover:bg-info-400 hover:bg-pink-400 border-2 sm:w-auto rounded-lg py-2 tracking-wide w-full border-blue-950 shadow-black rounded-b-xl border-b-8 appearance-none text-black placeholder-gray-400"
            >
              <img alt="" src={SettingsIcon} /> Configs
            </button>
            <Button type="submit">Dissect</Button>
          </div>
          {modalOpen && (
            <ConfigsModal
              closeModal={handleModal}
              protocolParams={protocolParams}
              changeParam={changeParam}
              otherContext={otherContext}
              setOtherContext={setOtherContext}
            />
          )}
        </Form>
      </div>

      {!data && (
        <>
          <h2 className="mt-16 text-3xl text-gray-500">
            Or try one of these examples...
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExampleCard
              title="Babbage Tx"
              address="84a400828258206c732139de33e916342707de2aebef2252c781640326ff37b86ec99d97f1ba8d0182582018f86700660fc88d0370a8f95ea58f75507e6b27a18a17925ad3b1777eb0d77600018783581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820923918e403bf43c34b4ef6b48eb2ee04babed17320d8d1b9ff9ad086e86f44ec83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a0582054ad3c112d58e8946480e21d6a35b2a215d1a9a8f540c13714ded86e4b0b6aea83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820ed33125018c5cbc9ae1b242a3ff8f3db2e108e4a63866d0b5238a34502c723ed83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820b0ea85f16a443da7f60704a427923ae1d89a7dc2d6621d805d9dd441431ed70083581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820831a557bc2948e1b8c9f5e8e594d62299abff4eb1a11dc19da38bfaf9f2da40783581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820c695868b4bfbf4c95714e707c69da1823bcf8cfc7c4b14b92c3645d4e1943be382581d60b6c8794e9a7a26599440a4d0fd79cd07644d15917ff13694f1f672351b00000001af62c125021a0002dfb10b58209dc070b08ae8dbd9ced77831308173284a19ab4839ce894fca45b8e3752a8a42a2008182582031ae74f8058527afb305d7495b10a99422d9337fc199e1f28044f2c477a0f94658409d9315424385661b9c17c0c9b96eeb61645d8f18cbefd43aa87677aae8cc2282642650d41004a11d1d0b66146da9fa22c824e6c1b9e0525268e9a43078fb670c049fd8799f413101ffd905039fa101423131d8798043313131ffd87980a10142313141319f0102fffff5f6"
            />
          </div>
        </>
      )}

      {!!data && (
        <RootSection
          data={data}
          topics={TOPICS}
          validations={validations}
          era={era}
        />
      )}
    </main>
  );
}
