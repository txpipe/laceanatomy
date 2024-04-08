use crate::{Validation, Validations};
use pallas::{
  applying::{
    babbage::{
      check_all_ins_in_utxos, check_auxiliary_data, check_fee, check_ins_not_empty,
      check_languages, check_min_lovelace, check_minting, check_network_id, check_output_val_size,
      check_preservation_of_value, check_script_data_hash, check_tx_ex_units, check_tx_size,
      check_tx_validity_interval, check_well_formedness, check_witness_set,
    },
    utils::{get_babbage_tx_size, BabbageProtParams, FeePolicy},
    Environment, MultiEraProtParams, UTxOs,
  },
  ledger::primitives::babbage::{MintedTransactionBody, MintedTx as BabbageMintedTx},
};

use super::validate::set_description;

// &The following validations only require the tx
fn validate_babbage_ins_not_empty(mtx: &BabbageMintedTx) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_ins_not_empty(tx_body);
  let description = set_description(
    &res,
    "The set of transaction inputs is not empty.".to_string(),
  );
  return Validation::new()
    .with_name("Non empty inputs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_babbage_minting(mtx: &BabbageMintedTx) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_minting(tx_body, mtx);
  let description = set_description(
    &res,
    "Each minted / burned asset is paired with an appropriate native script or Plutus script"
      .to_string(),
  );
  return Validation::new()
    .with_name("Minting policy".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_babbage_well_formed(mtx: &BabbageMintedTx) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_well_formedness(tx_body, mtx);
  let description = set_description(&res, "The transaction is well-formed".to_string());
  return Validation::new()
    .with_name("Well formedness".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_babbage_auxiliary_data(mtx: &BabbageMintedTx) -> Validation {
  let tx_body = &mtx.transaction_body.clone();
  let res = check_auxiliary_data(tx_body, mtx);
  let description = set_description(
    &res,
    "The metadata of the transaction is valid.".to_string(),
  );
  return Validation::new()
    .with_name("Auxiliary data".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// &The following validations also require the protocol parameters
fn validate_babbage_min_lovelace(
  mtx: &BabbageMintedTx,
  prot_pps: &BabbageProtParams,
) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();

  let res = check_min_lovelace(tx_body, prot_pps);
  let description = set_description(
    &res,
    "All transaction outputs (regular outputs and collateral outputs) contains at least the minimum lovelace.".to_string(),
  );
  return Validation::new()
    .with_name("Minimum lovelace".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_babbage_output_val_size(
  mtx: &BabbageMintedTx,
  prot_pps: &BabbageProtParams,
) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_output_val_size(tx_body, prot_pps);
  let description = set_description(
    &res,
    "The size of the value in each of the outputs is not greater than the maximum allowed."
      .to_string(),
  );
  return Validation::new()
    .with_name("Output value size".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_babbage_tx_ex_units(mtx: &BabbageMintedTx, prot_pps: &BabbageProtParams) -> Validation {
  let res = check_tx_ex_units(mtx, prot_pps);
  let description = set_description(
    &res,
    "The number of execution units of the transaction does not exceed the maximum allowed."
      .to_string(),
  );
  return Validation::new()
    .with_name("Transaction execution units".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// &The following validation also requires the tx size
fn validate_babbage_tx_size(size: &Option<u64>, prot_pps: &BabbageProtParams) -> Validation {
  match size {
    Some(size_value) => {
      let res = check_tx_size(size_value, prot_pps);
      let description = set_description(
        &res,
        "The size of the transaction does not exceed the maximum allowed.".to_string(),
      );
      Validation::new()
        .with_name("Transaction size".to_string())
        .with_value(res.is_ok())
        .with_description(description)
    }
    None => {
      // Handle the case where size is None
      // For example, return a specific validation result indicating that the size is not provided
      Validation::new()
        .with_name("Transaction size".to_string())
        .with_value(false)
        .with_description("The transaction size could not be obtained.".to_string())
    }
  }
}

// &The following validation also requires the tx utxos
fn validate_babbage_fee(
  mtx: &BabbageMintedTx,
  size: &Option<u64>,
  utxos: &UTxOs,
  prot_pps: &BabbageProtParams,
) -> Validation {
  match size {
    Some(size_value) => {
      let tx_body = &mtx.transaction_body.clone();
      let res = check_fee(tx_body, size_value, mtx, utxos, prot_pps);
      let description = set_description(&res, "The fee of the transaction is valid.".to_string());
      return Validation::new()
        .with_name("Fee".to_string())
        .with_value(res.is_ok())
        .with_description(description);
    }
    None => {
      // Handle the case where size is None
      // For example, return a specific validation result indicating that the size is not provided
      Validation::new()
        .with_name("Fee".to_string())
        .with_value(false)
        .with_description("The transaction size could not be obtained.".to_string())
    }
  }
}

// &The following validations require the transaction and its utxos
fn validate_babbage_witness_set(mtx: &BabbageMintedTx, utxos: &UTxOs) -> Validation {
  let res = check_witness_set(mtx, utxos);
  let description = set_description(
    &res,
    "The witness set of the transaction is valid.".to_string(),
  );
  return Validation::new()
    .with_name("Witness set".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_babbage_all_ins_in_utxos(mtx: &BabbageMintedTx, utxos: &UTxOs) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_all_ins_in_utxos(tx_body, utxos);
  let description = set_description(
    &res,
    "All transaction inputs, collateral inputs and reference inputs are in the UTxO".to_string(),
  );
  return Validation::new()
    .with_name("All inputs in UTxOs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_babbage_preservation_of_value(mtx: &BabbageMintedTx, utxos: &UTxOs) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_preservation_of_value(tx_body, utxos);
  let description = set_description(
    &res,
    "The preservation of value property holds.".to_string(),
  );
  return Validation::new()
    .with_name("Preservation of value".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// &The following validation also require the network and the block slot
fn validate_babbage_languages(
  mtx: &BabbageMintedTx,
  utxos: &UTxOs,
  network_magic: &u32,
  network_id: &u8,
  block_slot: u64,
) -> Validation {
  let res = check_languages(mtx, utxos, &network_magic, &network_id, &block_slot);
  let description = set_description(
    &res,
    "The Plutus scripts and native scripts of the transaction are valid.".to_string(),
  );
  return Validation::new()
    .with_name("Languages".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_babbage_script_data_hash(
  mtx: &BabbageMintedTx,
  utxos: &UTxOs,
  network_magic: &u32,
  network_id: &u8,
  block_slot: u64,
) -> Validation {
  let tx_body = &mtx.transaction_body.clone();
  let res = check_script_data_hash(
    tx_body,
    mtx,
    utxos,
    &network_magic,
    &network_id,
    &block_slot,
  );
  let description = set_description(
    &res,
    "The Plutus scripts and native scripts of the transaction are valid.".to_string(),
  );
  return Validation::new()
    .with_name("Languages".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// &The following validation requires the tx and the block slot
fn validate_babbage_tx_validity_interval(mtx: &BabbageMintedTx, block_slot: u64) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_tx_validity_interval(tx_body, &block_slot);
  let description = set_description(
    &res,
    "The block slot is contained in the transaction validity interval.".to_string(),
  );
  return Validation::new()
    .with_name("Validity interval".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// &The following validation requires the tx and its network id
fn validate_babbage_network_id(mtx: &BabbageMintedTx, network_id: u8) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_network_id(tx_body, &network_id);
  let description = set_description(
    &res,
    "The network ID of each regular output as well as that of the collateral output match the global network ID."
      .to_string(),
  );
  return Validation::new()
    .with_name("Network id".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

pub fn validate_babbage(mtx_b: &BabbageMintedTx) -> Validations {
  let tx_body: &MintedTransactionBody = &mtx_b.transaction_body.clone();
  let size: &Option<u64> = &get_babbage_tx_size(tx_body);
  let prot_params = BabbageProtParams {
    fee_policy: FeePolicy {
      summand: 155381,
      multiplier: 44,
    },
    max_tx_size: 16384,
    max_block_ex_mem: 62000000,
    max_block_ex_steps: 20000000000,
    max_tx_ex_mem: 14000000,
    max_tx_ex_steps: 10000000000,
    max_val_size: 5000,
    collateral_percent: 150,
    max_collateral_inputs: 3,
    coins_per_utxo_word: 4310,
  };

  let env: Environment = Environment {
    prot_params: MultiEraProtParams::Babbage(prot_params.clone()),
    prot_magic: 764824073, // Mainnet. For preprod: 1. For preview: 2
    block_slot: 72316896,  // TODO: Must be an input
    network_id: 1,         // Mainnet. For preprod: 0. For preview: 0
  };

  let out = Validations::new()
    .with_era("Babbage".to_string())
    .add_new_validation(validate_babbage_ins_not_empty(&mtx_b))
    .add_new_validation(validate_babbage_minting(&mtx_b))
    .add_new_validation(validate_babbage_well_formed(&mtx_b))
    .add_new_validation(validate_babbage_auxiliary_data(&mtx_b))
    .add_new_validation(validate_babbage_min_lovelace(&mtx_b, &prot_params))
    .add_new_validation(validate_babbage_output_val_size(&mtx_b, &prot_params))
    .add_new_validation(validate_babbage_tx_ex_units(&mtx_b, &prot_params))
    .add_new_validation(validate_babbage_tx_size(&size, &prot_params))
    .add_new_validation(validate_babbage_tx_validity_interval(
      &mtx_b,
      env.block_slot,
    ))
    .add_new_validation(validate_babbage_network_id(&mtx_b, env.network_id));
  out
}