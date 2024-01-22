import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, useActionData, useSubmit } from "@remix-run/react";
import * as server from "./block.server";
import {
  Button,
  DataSection,
  logCuriosity,
  RootSection,
  TextArea,
} from "~/components";
import { KeyboardEventHandler } from "react";
import TOPICS from "./block.topics";

export const meta: MetaFunction = () => {
  return [
    { title: "Cardano Block - Lovelace Anatomy" },
    { name: "description", content: "Lets dissect a Cardano block" },
  ];
};

export default function Index() {
  return (
    <main className="mt-10 px-4">
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Block</h1>
      <p className="text-gray-600 text-xl">Lets dissect a Cardano block!</p>
      <div className="block mt-8 p-4 border-2 bg-violet-300 border-violet-700 shadow text-violet-950 shadow-black rounded-lg text-2xl">
        Coming soon!
      </div>
    </main>
  );
}
