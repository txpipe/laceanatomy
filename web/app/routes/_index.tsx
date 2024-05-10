import { redirect, type MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Lace Anatomy" },
    { name: "description", content: "Lets dissect Cardano data" },
  ];
};

export const loader = async () => {
  return redirect("/address");
};

export default function Index() {
  return null;
}
