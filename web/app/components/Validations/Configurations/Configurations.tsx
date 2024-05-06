import { useEffect } from "react";
import { Button } from "~/components/Button";
import { IProtocolParam } from "~/interfaces";
import { Tabs } from "./Tabs";

interface ConfigsModalProps {
  closeModal: () => void;
  latestParams: IProtocolParam[] | undefined;
}

export function ConfigsModal({ closeModal, latestParams }: ConfigsModalProps) {
  // To close config modal on esc press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal]);

  return (
    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-70" />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="relative w-3/4 text-center ring-2 ring-inset ring-black text-black bg-white shadow-small rounded-xl p-8">
          <h3 className="text-4xl">Tx Validation Configurations</h3>
          <button
            className="absolute right-5 top-3 text-4xl cursor-pointer rotate-45 box-border"
            onClick={closeModal}
          >
            +
          </button>
          <Tabs latestParams={latestParams} />
          <div className="flex gap-3 h-full justify-center">
            <Button
              type="button"
              color="pink"
              className="hover:bg-pink-400 mt-3"
              onClick={closeModal}
            >
              Submit
            </Button>
            <Button
              type="submit"
              color="pink"
              className="hover:bg-pink-400 mt-3"
              onClick={closeModal}
            >
              Submit & Dissect
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
