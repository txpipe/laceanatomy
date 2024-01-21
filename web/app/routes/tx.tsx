import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import * as server from "./tx.server";
import { PropsWithChildren } from "react";
import { Button, DataSection, TextArea } from "~/components";

export const meta: MetaFunction = () => {
  return [
    { title: "Cardano Tx - Lovelace Anatomy" },
    { name: "description", content: "Lets dissect a Cardano transaction" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  let raw = formData.get("raw");

  if (!!raw) {
    const res = server.safeParseTx(raw.toString());
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
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Tx</h1>
      <p className="text-gray-600 text-xl">
        Lets dissect a Cardano transaction. Enter the corresponding CBOR to
        inspect its contents.
      </p>
      <div className="block mt-8">
        <Form method="POST">
          <TextArea
            name="raw"
            placeholder="Enter any Cardano tx in CBOR format"
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
