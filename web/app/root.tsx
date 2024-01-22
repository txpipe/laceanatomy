import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  NavLink,
} from "@remix-run/react";

import styles from "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&amp;display=swap",
  },
];

function MenuItem(props: { to: string; label: string }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        isActive ? "nav-item-active" : "nav-item-inactive"
      }
    >
      {props.label}
    </NavLink>
  );
}

// styles inspired by:
// https://flabbergasted.lexingtonthemes.com

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div
          style={{
            fontFamily:
              "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif",
            lineHeight: "1.8",
          }}
          className="container max-w-screen-xl m-auto"
        >
          <header className="flex flex-row justify-between py-6 px-4 align-middle border-b-2 border-b-gray-300 border-dashed">
            <h3 className="text-4xl text-gray-400">Lace Anatomy</h3>
            <nav className="flex-row justify-between align-middle hidden md:flex">
              <MenuItem to="address" label="Address" />
              <MenuItem to="tx" label="Tx" />
              <MenuItem to="block" label="Block" />
              <MenuItem to="datum" label="Datum" />
              <a
                href="https://github.com/txpipe/laceanatomy"
                className="nav-item-active bg-slate-200 border-slate-700 text-slate-600 ml-20"
              >
                Github
              </a>
            </nav>
          </header>
          <Outlet />
          <footer className="mt-32 p-8 grid grid-cols-1 md:grid-cols-3 bg-slate-100 border-t-2 border-gray-300 border-dashed">
            <div className="flex flex-col items-center text-center mt-6">
              <p className="text-lg font-extrabold">Open Source</p>
              <p className="text-gray-700">
                This is an fun, open-source
                <br />
                utility maintained by TxPipe
              </p>
              <a className="text-blue-400" href="https://txpipe.io">
                https://txpipe.io
              </a>
            </div>
            <div className="flex flex-col items-center text-center mt-6">
              <p className="text-lg font-extrabold">Hosted on Demeter.run</p>
              <p className="text-gray-700">
                Cardano infrastructure
                <br /> made simple
              </p>
              <a className="text-blue-400" href="https://demeter.run">
                https://demeter.run
              </a>
            </div>
            <div className="flex flex-col items-center text-center mt-6">
              <p className="text-lg font-extrabold">Building a dApp?</p>
              <p className="text-gray-700">
                We can help!
                <br />
                Schedule an intro call
              </p>
              <a className="text-blue-400" href="https://txpipe.shop">
                https://txpipe.shop
              </a>
            </div>
          </footer>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
