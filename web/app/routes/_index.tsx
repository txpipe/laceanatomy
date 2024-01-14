import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
  type MetaFunction,
} from "@remix-run/node";
import { parseAddress } from "./address.server";
import { Form, Outlet, useActionData, useLoaderData } from "@remix-run/react";
import { PropsWithChildren } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Lovelace Anatomy" },
    { name: "description", content: "Lets dissect Cardano data" },
  ];
};

export const loader = async () => {
  return redirect("/address");
};

export default function Index() {
  return null;
}
