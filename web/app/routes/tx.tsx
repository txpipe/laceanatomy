import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useState } from "react";
import {
  Button,
  logCuriosity,
  RootSection,
  ValidationAccordion,
} from "../components";
import * as server from "./tx.server";
import TOPICS from "./tx.topics";

export interface IValidation {
  name: string;
  value: boolean;
  description: string;
}

export interface IValidations {
  validations: IValidation[];
}

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
    const res = server.safeParseTx(raw.toString());
    return json({ ...res, raw });
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
        <input type="hidden" value={props.address} name="raw" />
        <code className="w-full break-words block mt-4 text-gray-400">
          {props.address.substring(0, 30)}...
        </code>
      </button>
    </Form>
  );
}

export default function Index() {
  const data = useActionData();

  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);

  logCuriosity(data);

  const validations: IValidation[] = [
    { name: "Non empty inputs", value: true, description: "Sucessful" },
    {
      name: "All inputs in utxos",
      value: false,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro id maiores exercitationem asperiores molestias assumenda doloremque magnam fugit. Iure dolorum fugit facilis autem incidunt vero necessitatibus consectetur ducimus recusandae blanditiis!",
    },
    { name: "Validity interval", value: true, description: "Sucessful" },
    { name: "Fee", value: true, description: "Sucessful" },
    {
      name: "Preservation of value",
      value: false,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro id maiores exercitationem asperiores molestias assumenda doloremque magnam fugit. Iure dolorum fugit facilis autem incidunt vero necessitatibus consectetur ducimus recusandae blanditiis!",
    },
    {
      name: "Min lovelace per UTxO",
      value: false,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro id maiores exercitationem asperiores molestias assumenda doloremque magnam fugit. Iure dolorum fugit facilis autem incidunt vero necessitatibus consectetur ducimus recusandae blanditiis!",
    },
    { name: "Output value size", value: true, description: "Successful" },
    { name: "Network Id", value: true, description: "Successful" },
    { name: "Tx size", value: true, description: "Successful" },
    { name: "Tx execution units", value: true, description: "Successful" },
    { name: "Minting", value: true, description: "Successful" },
    {
      name: "Well formed",
      value: false,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro id maiores exercitationem asperiores molestias assumenda doloremque magnam fugit. Iure dolorum fugit facilis autem incidunt vero necessitatibus consectetur ducimus recusandae blanditiis!",
    },
    { name: "Script witness", value: true, description: "Successful" },
    { name: "Languages", value: true, description: "Successful" },
    {
      name: "Auxiliary data hash",
      value: false,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro id maiores exercitationem asperiores molestias assumenda doloremque magnam fugit. Iure dolorum fugit facilis autem incidunt vero necessitatibus consectetur ducimus recusandae blanditiis!",
    },
    { name: "Script data hash", value: true, description: "Successful" },
  ];

  return (
    <main className="mt-10 px-4">
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Tx</h1>
      <p className="text-gray-600 text-xl">
        Lets dissect a Cardano transaction. Enter the corresponding CBOR to
        inspect its contents.
      </p>
      <div className="block mt-8">
        <Form method="POST">
          <input
            type="text"
            autoComplete="off"
            defaultValue={data?.raw}
            name="raw"
            className="block w-full px-4 py-2 mt-4 border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8  appearance-none text-black placeholder-gray-400 text-2xl outline-none"
            placeholder="Enter the CBOR for any Cardano Tx using HEX-encoding"
          />
          <div className="flex flex-row justify-end mt-4">
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
            <ExampleCard
              title="Babbage Tx"
              address="84a400828258206c732139de33e916342707de2aebef2252c781640326ff37b86ec99d97f1ba8d0182582018f86700660fc88d0370a8f95ea58f75507e6b27a18a17925ad3b1777eb0d77600018783581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820923918e403bf43c34b4ef6b48eb2ee04babed17320d8d1b9ff9ad086e86f44ec83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a0582054ad3c112d58e8946480e21d6a35b2a215d1a9a8f540c13714ded86e4b0b6aea83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820ed33125018c5cbc9ae1b242a3ff8f3db2e108e4a63866d0b5238a34502c723ed83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820b0ea85f16a443da7f60704a427923ae1d89a7dc2d6621d805d9dd441431ed70083581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820831a557bc2948e1b8c9f5e8e594d62299abff4eb1a11dc19da38bfaf9f2da40783581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820c695868b4bfbf4c95714e707c69da1823bcf8cfc7c4b14b92c3645d4e1943be382581d60b6c8794e9a7a26599440a4d0fd79cd07644d15917ff13694f1f672351b00000001af62c125021a0002dfb10b58209dc070b08ae8dbd9ced77831308173284a19ab4839ce894fca45b8e3752a8a42a2008182582031ae74f8058527afb305d7495b10a99422d9337fc199e1f28044f2c477a0f94658409d9315424385661b9c17c0c9b96eeb61645d8f18cbefd43aa87677aae8cc2282642650d41004a11d1d0b66146da9fa22c824e6c1b9e0525268e9a43078fb670c049fd8799f413101ffd905039fa101423131d8798043313131ffd87980a10142313141319f0102fffff5f6"
            />
          </div>
        </>
      )}

      {!!data && (
        <div className="flex flex-col">
          <div className="mb-14">
            <button
              className={`flex items-center w-full text-left select-none duration-300`}
              onClick={handleClick}
            >
              <div
                className={`h-8 w-8 inline-flex items-center justify-center duration-300 `}
              >
                {open ? "▼" : "▶"}
              </div>
              <h4 className="text-3xl ">Tx Validations</h4>
            </button>
            {open && <ValidationAccordion validations={validations} />}
          </div>
          <RootSection data={data} topics={TOPICS} />
        </div>
      )}
    </main>
  );
}
