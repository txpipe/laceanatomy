import { type MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Cardano Datum - Lovelace Anatomy" },
    { name: "description", content: "Lets dissect a Cardano datum" },
  ];
};

export default function Index() {
  return (
    <main className="mt-10 px-4">
      <h1 className="text-5xl lg:text-7xl text-black">Cardano Datum</h1>
      <p className="text-gray-600 text-xl">Lets dissect a Cardano datum!</p>
      <div className="block mt-8 p-4 border-2 bg-violet-300 border-violet-700 shadow text-violet-950 shadow-black rounded-lg text-2xl">
        Coming soon!
      </div>
    </main>
  );
}
