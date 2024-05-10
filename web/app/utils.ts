import { ProtocolParams } from "napi-pallas";
import { Dispatch, SetStateAction } from "react";
import { TopicMeta } from "./components/constructors";
import { DataProps, IProtocolParam, IValidation } from "./interfaces";

export const initialValidations: IValidation[] = [
  { name: "Non empty inputs", value: true, description: "", shown: true },
  {
    name: "Network id",
    value: true,
    description: "",
    shown: true,
  },
  { name: "Minting policy", value: true, description: "", shown: true },
  { name: "Well formedness", value: true, description: "", shown: true },
  { name: "Auxiliary data", value: true, description: "", shown: true },
  { name: "Minimum lovelace", value: true, description: "", shown: true },
  {
    name: "Transaction execution units",
    value: true,
    description: "",
    shown: true,
  },
  { name: "Transaction size", value: true, description: "", shown: true },
  { name: "Validity interval", value: true, description: "", shown: true },
  { name: "Output value size", value: true, description: "", shown: true },
];

export const initialProtPps: IProtocolParam[] = [
  { name: "Epoch", value: 478 },
  { name: "Min_fee_a", value: 44 },
  { name: "Min_fee_b", value: 155381 },
  { name: "Max_block_size", value: 90112 },
  { name: "Max_tx_size", value: 16384 },
  { name: "Max_block_header_size", value: 1100 },
  { name: "Key_deposit", value: 2000000 },
  { name: "Pool_deposit", value: 500000000 },
  { name: "E_max", value: 18 },
  { name: "N_opt", value: 500 },
  { name: "A0", value: 0.3 },
  { name: "Rho", value: 0.003 },
  { name: "Tau", value: 0.2 },
  { name: "Decentralisation_param", value: 0 },
  { name: "Extra_entropy", value: 0 },
  { name: "Protocol_major_ver", value: 8 },
  { name: "Protocol_minor_ver", value: 0 },
  { name: "Min_utxo", value: 4310 },
  { name: "Min_pool_cost", value: 170000000 },
  { name: "Price_mem", value: 0.0577 },
  { name: "Price_step", value: 0.0000721 },
  { name: "Max_tx_ex_mem", value: 14000000 },
  { name: "Max_tx_ex_steps", value: 10000000000 },
  { name: "Max_block_ex_mem", value: 62000000 },
  { name: "Max_block_ex_steps", value: 20000000000 },
  { name: "Max_val_size", value: 5000 },
  { name: "Collateral_percent", value: 150 },
  { name: "Max_collateral_inputs", value: 3 },
  { name: "Coins_per_utxo_size", value: 4310 },
  { name: "Coins_per_utxo_word", value: 4310 },
];

export const ByronPptParams = [
  { name: "Script_version", value: "0 " },
  { name: "Slot_duration", value: "20000 " },
  { name: "Max_block_size", value: "2000000 " },
  { name: "Max_header_size", value: "2000000 " },
  { name: "Max_tx_size", value: "4096 " },
  { name: "Max_proposal_size", value: "700 " },
  { name: "Mpc_thd", value: "20000000000000 " },
  { name: "Heavy_del_thd", value: "300000000000 " },
  { name: "Update_vote_thd", value: "1000000000000 " },
  { name: "Update_proposal_thd", value: "100000000000000 " },
  { name: "Update_implicit", value: "10000 " },
  {
    name: "Soft_fork_rule",
    value: "(900000000000000, 600000000000000, 50000000000000)",
  },
  { name: "Summand", value: "155381 " },
  { name: "Multiplier", value: "44 " },
  { name: "Unlock_stake_epoch", value: "18446744073709551615" },
];

export function decimalToFraction(decimal: number): [number, number] {
  let numerator = decimal;
  let denominator = 1;
  let prevNumerator = 0;
  let prevDenominator = 1;

  while (Math.abs(numerator - prevNumerator) > 6) {
    prevNumerator = numerator;
    prevDenominator = denominator;
    numerator = Math.floor(numerator);
    denominator = 1 / (decimal - numerator);
  }

  return [prevNumerator, prevDenominator];
}

export function getTopicMeta(
  key: string | undefined,
  all: Record<string, TopicMeta>
): TopicMeta {
  return (
    all[key!] || {
      title: key,
    }
  );
}

export function logCuriosity(data: DataProps) {
  if (data) {
    console.group("CURIOUS FELLOW, EH?");
    console.log("hello there! want to learn how we parse the data?");
    console.log(
      "we use the Pallas library on the backend. Pallas is a Rust library for Cardano. We compile it to native code and use FFI to trigger the logic from a NodeJS process."
    );
    console.log("https://github.com/txpipe/pallas");
    console.log(
      "here's the json payload for the data you see rendered on-screen:"
    );
    console.log(data);
    console.groupEnd();
  }
}

export function formDataToContext(formData: FormData) {
  const era = formData.get("Era");
  const net = formData.get("Network");
  const [a0Numerator, a0Denominator] = decimalToFraction(
    Number(formData.get("A0"))
  );
  const [rhoNumerator, rhoDenominator] = decimalToFraction(
    Number(formData.get("Rho"))
  );
  const [tauNumerator, tauDenominator] = decimalToFraction(
    Number(formData.get("Tau"))
  );
  const [decentralisationParamNumerator, decentralisationParamDenominator] =
    decimalToFraction(Number(formData.get("Decentralisation_param")));
  const [extraEntropyNumerator, extraEntropyDenominator] = decimalToFraction(
    Number(formData.get("Extra_entropy"))
  );
  const [priceMemNumerator, priceMemDenominator] = decimalToFraction(
    Number(formData.get("Price_mem"))
  );
  const [priceStepNumerator, priceStepDenominator] = decimalToFraction(
    Number(formData.get("Price_step"))
  );
  return {
    protocolParams: {
      epoch: Number(formData.get("Epoch")),
      minFeeA: Number(formData.get("Min_fee_a")),
      minFeeB: Number(formData.get("Min_fee_b")),
      maxBlockSize: Number(formData.get("Max_block_size")),
      maxTxSize: Number(formData.get("Max_tx_size")),
      maxBlockHeaderSize: Number(formData.get("Max_block_header_size")),
      keyDeposit: Number(formData.get("Key_deposit")),
      poolDeposit: Number(formData.get("Pool_deposit")),
      eMax: Number(formData.get("E_max")),
      nOpt: Number(formData.get("N_opt")),
      a0Numerator: a0Numerator,
      a0Denominator: a0Denominator,
      rhoNumerator: rhoNumerator,
      rhoDenominator: rhoDenominator,
      tauNumerator: tauNumerator,
      tauDenominator: tauDenominator,
      decentralisationParamNumerator: decentralisationParamNumerator,
      decentralisationParamDenominator: decentralisationParamDenominator,
      extraEntropyNumerator: extraEntropyNumerator,
      extraEntropyDenominator: extraEntropyDenominator,
      protocolMajorVer: Number(formData.get("Protocol_major_ver")),
      protocolMinorVer: Number(formData.get("Protocol_minor_ver")),
      minUtxo: Number(formData.get("Min_utxo")),
      minPoolCost: Number(formData.get("Min_pool_cost")),
      priceMemNumerator: priceMemNumerator,
      priceMemDenominator: priceMemDenominator,
      priceStepNumerator: priceStepNumerator,
      priceStepDenominator: priceStepDenominator,
      maxTxExMem: Number(formData.get("Max_tx_ex_mem")),
      maxTxExSteps: Number(formData.get("Max_tx_ex_steps")),
      maxBlockExMem: Number(formData.get("Max_block_ex_mem")),
      maxBlockExSteps: Number(formData.get("Max_block_ex_steps")),
      maxValSize: Number(formData.get("Max_val_size")),
      collateralPercent: Number(formData.get("Collateral_percent")),
      maxCollateralInputs: Number(formData.get("Max_collateral_inputs")),
      coinsPerUtxoSize: Number(formData.get("Coins_per_utxo_size")),
      coinsPerUtxoWord: Number(formData.get("Coins_per_utxo_word")),
    },
    blockSlot: Number(formData.get("Block_slot")),
    era: era?.toString() ?? "Babbage",
    network: net?.toString() ?? "Mainnet",
  };
}

export const exampleCbor =
  "84a400828258206c732139de33e916342707de2aebef2252c781640326ff37b86ec99d97f1ba8d0182582018f86700660fc88d0370a8f95ea58f75507e6b27a18a17925ad3b1777eb0d77600018783581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820923918e403bf43c34b4ef6b48eb2ee04babed17320d8d1b9ff9ad086e86f44ec83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a0582054ad3c112d58e8946480e21d6a35b2a215d1a9a8f540c13714ded86e4b0b6aea83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820ed33125018c5cbc9ae1b242a3ff8f3db2e108e4a63866d0b5238a34502c723ed83581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820b0ea85f16a443da7f60704a427923ae1d89a7dc2d6621d805d9dd441431ed70083581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820831a557bc2948e1b8c9f5e8e594d62299abff4eb1a11dc19da38bfaf9f2da40783581d703a888d65f16790950a72daee1f63aa05add6d268434107cfa5b67712821a000f52c6a05820c695868b4bfbf4c95714e707c69da1823bcf8cfc7c4b14b92c3645d4e1943be382581d60b6c8794e9a7a26599440a4d0fd79cd07644d15917ff13694f1f672351b00000001af62c125021a0002dfb10b58209dc070b08ae8dbd9ced77831308173284a19ab4839ce894fca45b8e3752a8a42a2008182582031ae74f8058527afb305d7495b10a99422d9337fc199e1f28044f2c477a0f94658409d9315424385661b9c17c0c9b96eeb61645d8f18cbefd43aa87677aae8cc2282642650d41004a11d1d0b66146da9fa22c824e6c1b9e0525268e9a43078fb670c049fd8799f413101ffd905039fa101423131d8798043313131ffd87980a10142313141319f0102fffff5f6";

export enum UIOptions {
  OPEN = "alwaysOpen",
  BEGINNING = "beginning",
}

const reducibleParams = [
  "A0",
  "Rho",
  "Tau",
  "DecentralisationParam",
  "ExtraEntropy",
  "PriceMem",
  "PriceStep",
];

export const paramsParser = (
  parsedParams: ProtocolParams,
  setParams: Dispatch<SetStateAction<IProtocolParam[] | undefined>>
) => {
  if (parsedParams && !("error" in parsedParams)) {
    const newParams: ProtocolParams = JSON.parse(JSON.stringify(parsedParams));

    const latestParams: IProtocolParam[] = Object.entries(newParams).map(
      ([key, value]) => {
        const parsedKey = key
          .split(/(?=[A-Z])/)
          .join(" ")
          .replace("Transaction", "Tx")
          .replace("Numerator", "");

        if (reducibleParams.includes(parsedKey)) {
          let denominator = Number(
            newParams[`${parsedKey}Denominator` as keyof ProtocolParams]
          );
          // If denominator is NaN, set it to 1
          denominator = denominator === denominator ? denominator : 1;
          return {
            name: parsedKey.charAt(0).toUpperCase() + parsedKey.slice(1),
            value: Number(value) / denominator,
          };
        }
        return {
          name: parsedKey.charAt(0).toUpperCase() + parsedKey.slice(1),
          value: Number(value),
        };
      }
    );
    setParams(
      latestParams.filter((param) => !param.name.includes("Denominator"))
    );
  }
};

export const ByronValidations = [
  "Non empty inputs",
  "Transaction size",
  "Non empty outputs",
  "Outputs have lovelace",
];
export const ShelleyMAValidations = [
  "Transaction size",
  "Non empty inputs",
  "Metadata",
  "Minting",
  "Minimum lovelace",
  "Fees",
  "TTL",
  "Network id",
];
export const AlonzoValidations = [
  "Non empty inputs",
  "Network ID",
  "Minting",
  "Auxiliary data",
  "Minimum lovelace",
  "Transaction size",
  "Script data hash",
  "Transaction validity interval",
  "Outputs value size",
  "Execution units",
  "Languages",
];
export const BabbageValidations = [
  "Non empty inputs",
  "Minting policy",
  "Well formedness",
  "Auxiliary data",
  "Minimum lovelace",
  "Output value size",
  "Transaction execution units",
  "Transaction size",
  "Validity interval",
  "Network id",
];
