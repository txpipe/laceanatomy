import * as server from "./routes/tx.server";

export interface IValidation {
  name: string;
  value: boolean;
  description: string;
}

export interface IValidations {
  validations: IValidation[];
  era: string;
}

export interface DataProps extends server.Section {
  validations: IValidation[];
  era: string;
  raw?: string;
}

export interface ProtocolType {
  name: string;
  value: number;
}

export const TabNames = {
  ProtocolParameters: "Protocol Parameters",
  Others: "Other Context",
} as const;

export type TabType = (typeof TabNames)[keyof typeof TabNames];

export const Networks = {
  Mainnet: "Mainnet",
  Preprod: "Preprod",
  Preview: "Preview",
} as const;

export type NetworkType = (typeof Networks)[keyof typeof Networks];

export const Eras = {
  Byron: "Byron",
  ShelleyMA: "Shelley MA",
  Alonzo: "Alonzo",
  Babbage: "Babbage",
  Conway: "Conway",
} as const;

export type EraType = (typeof Eras)[keyof typeof Eras];

export interface IContext {
  blockSlot: number;
  selectedEra: EraType;
  selectedNetwork: NetworkType;
}
