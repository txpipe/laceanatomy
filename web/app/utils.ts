import { ProtocolType } from "./interfaces";

export const initialProtPps: ProtocolType[] = [
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
