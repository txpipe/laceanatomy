import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { parseAddress } from "./address.server";
import { Form, useActionData } from "@remix-run/react";
import { PropsWithChildren } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Cardano Address - Lovelace Anatomy" },
    { name: "description", content: "Lets dissect a Cardano address" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  let addressRaw = formData.get("address")?.toString();

  if (!!addressRaw) {
    const res = parseAddress(addressRaw);
    return json({ ...res });
  } else {
    return json({ error: "empty" });
  }
}

function DataSection(props: PropsWithChildren<{ title: string }>) {
  return (
    <blockquote className="mt-6 md:border-l-4 md:px-10 py-4 border-dashed">
      <h4 className="text-3xl">{props.title}</h4>
      {props.children}
    </blockquote>
  );
}

function HexBlock(props: { name: string; value: string }) {
  return (
    <div className="mt-8 p-4 border-2 bg-green-200 border-green-700 shadow shadow-black rounded-lg text-2xl break-words">
      <div className="text-sm text-green-800">{props.name}</div>
      {props.value}
    </div>
  );
}

function PropBlock(props: { name: string; value: string }) {
  return (
    <div className="mt-8 p-4 border-2 bg-gray-200 border-gray-700 shadow shadow-black rounded-lg text-xl">
      <div className="text-sm text-gray-600">{props.name}</div>
      {props.value}
    </div>
  );
}

export default function Index() {
  const data: any = useActionData();

  return (
    <main className="mt-10 px-4">
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Address</h1>
      <p className="text-gray-600 text-xl">
        Lets dissect a Cardano address. Enter any valid Bech32 value of an
        address to inspect its contents.
      </p>
      <div className="block mt-8">
        <Form method="POST">
          <input
            type="text"
            autoComplete="off"
            name="address"
            className="block w-full px-4 py-2 mt-4 border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8  appearance-none text-black placeholder-gray-400 text-2xl outline-none"
            placeholder="Type your Cardano Bech32 address"
          />
        </Form>
      </div>
      {!!data?.error && (
        <div className="block mt-8 p-4 border-2 bg-red-200 border-red-700 shadow shadow-black rounded-lg text-2xl">
          {data.error}
        </div>
      )}
      {!!data?.address && (
        <DataSection title="Decoded Bech32">
          <p className="text-gray-600 text-xl">
            By decoding the bech32 content we obtain a bytestring that can be
            interpreted according to CIP-XX.
          </p>
          <HexBlock name="address bytes (hex)" value={data?.bytes} />
          <DataSection title="Parsed Address">
            <p className="text-gray-600 text-xl">
              The CIP explains that there are 3 types of possible address, each
              one following a different encoding format.
            </p>

            <PropBlock name="network id" value={data?.address.network} />
            <PropBlock name="kind" value={data?.address.kind} />

            <DataSection title="Payment Part">
              <p className="text-gray-600 text-xl">
                The payment part describes who has control of the ownership of
                the locked values. There are two options: a verification key or
                a script. The address includes a flag to differentiate the two.
              </p>
              <PropBlock
                name="kind"
                value={data.address.paymentPart.isScript ? "script" : "vkey"}
              />
              <HexBlock
                name="public key hash"
                value={data.address.paymentPart.pubkeyHash}
              />
            </DataSection>
            <DataSection title="Delegation Part">
              <p className="text-gray-600 text-xl">
                The delegation part describes who has control of the staking of
                the locked values. There are two options: a verification key or
                a script. The address includes a flag to differentiate the two.
              </p>
              <PropBlock
                name="kind"
                value={data.address.delegationPart.isScript ? "script" : "vkey"}
              />
              <HexBlock
                name="public key hash"
                value={data.address.delegationPart.pubkeyHash}
              />
            </DataSection>
          </DataSection>
        </DataSection>
      )}
    </main>
  );
}
