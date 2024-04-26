import { Dispatch, SetStateAction, createContext } from "react";
import {
  Eras,
  IContext,
  IProtocolParam,
  IValidation,
  Networks,
} from "../interfaces";

export interface ValidationsContextType {
  validations: IValidation[];
  setValidations: Dispatch<SetStateAction<IValidation[]>>;
  context: { pptParams: IProtocolParam[] } & IContext;
  setContext: Dispatch<
    SetStateAction<{ pptParams: IProtocolParam[] } & IContext>
  >;
}

export const ValidationsContext = createContext<ValidationsContextType>({
  validations: [],
  setValidations: () => {},
  context: {
    pptParams: [],
    blockSlot: 72316896,
    selectedEra: Eras.Babbage,
    selectedNetwork: Networks.Mainnet,
  },
  setContext: () => {},
});
