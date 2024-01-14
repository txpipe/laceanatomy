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
            </nav>
          </header>
          <Outlet />
          <footer className="mt-32 p-10 grid grid-cols-3 bg-slate-100 border-t-2 border-gray-300 border-dashed">
            <div className="flex flex-col items-center">
              <p>Made by TxPipe</p>
              <p>Open-source tools for blockchain devs</p>
              <a href="https://txpipe.io">txpipe.io</a>
            </div>
            <div className="flex flex-col items-center">
              <p>Hosted in Demeter.run</p>
              <p>Cardano infrastructure made simple</p>
              <a href="https://demeter.run">demeter.run</a>
            </div>
            <div className="flex flex-col items-center">
              <p>Building a dApp?</p>
              <p>We can help!</p>
              <a href="https://txpipe.shop">txpipe.shop</a>
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
