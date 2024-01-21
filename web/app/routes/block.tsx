import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, useActionData, useSubmit } from "@remix-run/react";
import * as server from "./block.server";
import { Button, DataSection, TextArea } from "~/components";
import { KeyboardEventHandler } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Cardano Block - Lovelace Anatomy" },
    { name: "description", content: "Lets dissect a Cardano block" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  let raw = formData.get("raw");

  if (!!raw) {
    const res = server.safeParseBlock(raw.toString());
    return json({ ...res });
  } else {
    return json({ error: "an empty value? seriously?" });
  }
}

export default function Index() {
  const data: any = useActionData();

  console.log(data);

  return (
    <main className="mt-10 px-4">
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Block</h1>
      <p className="text-gray-600 text-xl">
        Lets dissect a Cardano block. Enter the corresponding CBOR to inspect
        its contents.
      </p>
      <div className="block mt-8">
        <Form method="POST">
          <TextArea
            name="raw"
            placeholder="Enter any Cardano block in CBOR format"
          />
          <div className="flex flex-row justify-end mt-4">
            <Button type="submit">Parse</Button>
          </div>
        </Form>
      </div>
      {!!data && <DataSection data={data} />}
    </main>
  );
}
