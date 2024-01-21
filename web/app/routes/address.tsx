import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { parseAddress } from "./address.server";
import { Form, useActionData } from "@remix-run/react";
import { Button, EmptyBlock, HexBlock, PropBlock } from "~/components";
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
    return json({ error: "an empty value? seriously?" });
  }
}

function Section(props: PropsWithChildren<{ title: string }>) {
  return (
    <blockquote className="mt-6 md:border-l-4 md:px-10 py-4 border-dashed">
      <h4 className="text-3xl">{props.title}</h4>
      {props.children}
    </blockquote>
  );
}

function ByronSection(props: { data: any }) {
  const { data } = props;

  return (
    <Section title="Decoded Base58">
      <p className="text-gray-600 text-xl">
        Your address is a valid base58 address value. By decoding the base58
        content we obtain a bytestring that can be interpreted according
        to&nbsp;
        <a
          className="underline hover:text-blue-500 text-blue-700"
          href="https://cips.cardano.org/cip/CIP-0019"
          target="_blank"
        >
          CIP-0019
        </a>
        . The CIP explains that there are 3 types of possible address, each one
        following a different encoding format: Shelley, Stake or Byron.
      </p>
      <HexBlock name="address bytes (hex)" value={data?.bytes} />
      <Section title="Parsed Address">
        <p className="text-gray-600 text-xl">
          The address entered is of type&nbsp;
          <code>Byron</code>. Byron addresses are actually CBOR structures with
          several pieces of information. Since Byron addresses are deprecated
          and kept only for backward compatibility, we won't go into much more
          detail.
        </p>
        <PropBlock name="type" value={data?.address.kind} />
        <Section title="CBOR">
          <p className="text-gray-600 text-xl">
            The following bytes are CBOR-encoded structures, you can continue
            your decoding journey using these (hex-encoded) bytes and a CBOR
            decoder.
          </p>
          <HexBlock name="CBOR (hex) " value={data?.address.byronCbor} />
        </Section>
      </Section>
    </Section>
  );
}

function StakeSection(props: { data: any }) {
  const { data } = props;

  return (
    <Section title="Decoded Bech32">
      <p className="text-gray-600 text-xl">
        Your address is a valid bech32 address value. By decoding the bech32
        content we obtain a bytestring that can be interpreted according
        to&nbsp;
        <a
          className="underline hover:text-blue-500 text-blue-700"
          href="https://cips.cardano.org/cip/CIP-0019"
          target="_blank"
        >
          CIP-0019
        </a>
        . The CIP explains that there are 3 types of possible address, each one
        following a different encoding format: Shelley, Stake or Byron.
      </p>
      <HexBlock name="address bytes (hex)" value={data?.bytes} />
      <Section title="Parsed Address">
        <p className="text-gray-600 text-xl">
          The address entered is of type&nbsp;
          <code>Stake</code>. Stake addresses contain two pieces of information:
          network tag and delegation info.
        </p>
        <PropBlock name="type" value={data?.address.kind} />
        <Section title="Network Tag">
          <p className="text-gray-600 text-xl">
            The netword tag is a flag to indicate to which network it belongs
            (either mainnet or a testnet).
          </p>
          <PropBlock name="network tag" value={data?.address.network} />
        </Section>
        {(!!data.address.delegationPart.hash ||
          !!data.address.delegationPart.pointer) && (
          <Section title="Delegation Info">
            <p className="text-gray-600 text-xl">
              The delegation part describes who has control of the staking of
              the locked values. There are two options: a verification key or a
              script. The address includes a flag to differentiate the two.
            </p>
            <PropBlock
              name="kind"
              value={
                data.address.delegationPart.isScript
                  ? "script"
                  : "verification key"
              }
            />
            {data.address.delegationPart.hash && (
              <HexBlock name="hash" value={data.address.delegationPart.hash} />
            )}
            {data.address.delegationPart.pointer && (
              <HexBlock
                name="pointer"
                value={data.address.delegationPart.pointer}
              />
            )}
          </Section>
        )}
      </Section>
    </Section>
  );
}

function ShelleySection(props: { data: any }) {
  const { data } = props;

  return (
    <Section title="Decoded Bech32">
      <p className="text-gray-600 text-xl">
        Your address is a valid bech32 address value. By decoding the bech32
        content we obtain a bytestring that can be interpreted according
        to&nbsp;
        <a
          className="underline hover:text-blue-500 text-blue-700"
          href="https://cips.cardano.org/cip/CIP-0019"
          target="_blank"
        >
          CIP-0019
        </a>
        . The CIP explains that there are 3 types of possible address, each one
        following a different encoding format: Shelley, Stake or Byron.
      </p>
      <HexBlock name="address bytes (hex)" value={data?.bytes} />
      <Section title="Parsed Address">
        <p className="text-gray-600 text-xl">
          The address entered is of type&nbsp;
          <code>Shelley</code>. Shelley addresses contain three pieces of
          information: network id, payment part and a delegation part.
        </p>
        <PropBlock name="type" value={data?.address.kind} />
        <Section title="Network Id">
          <p className="text-gray-600 text-xl">
            The netword id is a flag to indicate to which network it belongs
            (either mainnet or a testnet).
          </p>
          <PropBlock name="network id" value={data?.address.network} />
        </Section>
        {!!data.address.paymentPart && (
          <Section title="Payment Part">
            <p className="text-gray-600 text-xl">
              The payment part describes who has control of the ownership of the
              locked values. There are two options: a verification key or a
              script. The address includes a flag to differentiate the two.
            </p>
            <PropBlock
              name="kind"
              value={
                data.address.paymentPart.isScript
                  ? "script"
                  : "verification key"
              }
            />
            <HexBlock name="hash" value={data.address.paymentPart.hash} />
          </Section>
        )}
        {(!!data.address.delegationPart.hash ||
          !!data.address.delegationPart.pointer) && (
          <Section title="Delegation Part">
            <p className="text-gray-600 text-xl">
              The delegation part describes who has control of the staking of
              the locked values. There are two options: a verification key or a
              script. The address includes a flag to differentiate the two.
            </p>
            <PropBlock
              name="kind"
              value={
                data.address.delegationPart.isScript
                  ? "script"
                  : "verification key"
              }
            />
            {data.address.delegationPart.hash && (
              <HexBlock name="hash" value={data.address.delegationPart.hash} />
            )}
            {data.address.delegationPart.pointer && (
              <HexBlock
                name="pointer"
                value={data.address.delegationPart.pointer}
              />
            )}
          </Section>
        )}
        {!data.address.delegationPart.hash &&
          !data.address.delegationPart.pointer && (
            <Section title="Delegation Part">
              <p className="text-gray-600 text-xl">
                The delegation part describes who has control of the staking of
                the locked values. This address doesn't specify a delegation
                part, this means there's no way to delegate the locked values of
                this address.
              </p>
              <EmptyBlock />
            </Section>
          )}
      </Section>
    </Section>
  );
}

export default function Index() {
  const data: any = useActionData();

  console.log(data);

  return (
    <main className="mt-10 px-4">
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Address</h1>
      <p className="text-gray-600 text-xl">
        Lets dissect a Cardano address. Enter any valid address to inspect its
        contents.
      </p>
      <div className="block mt-8">
        <Form method="POST">
          <input
            type="text"
            autoComplete="off"
            name="address"
            className="block w-full px-4 py-2 mt-4 border-2 bg-white border-black h-16 shadow shadow-black rounded-lg rounded-b-xl border-b-8  appearance-none text-black placeholder-gray-400 text-2xl outline-none"
            placeholder="Enter any Cardano address in Bech32, Base58 or Hex encoding"
          />
          <div className="flex flex-row justify-end mt-4">
            <Button type="submit">Parse</Button>
          </div>
        </Form>
      </div>
      {!!data?.error && (
        <div className="block mt-8 p-4 border-2 bg-red-200 border-red-700 shadow shadow-black rounded-lg text-2xl">
          {data.error}
        </div>
      )}
      {data?.address?.kind == "Shelley" && <ShelleySection data={data} />}
      {data?.address?.kind == "Stake" && <StakeSection data={data} />}
      {data?.address?.kind == "Byron" && <ByronSection data={data} />}
    </main>
  );
}
