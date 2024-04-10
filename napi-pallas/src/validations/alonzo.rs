use pallas::{
  applying::{
    alonzo::{
      check_auxiliary_data, check_fee, check_ins_and_collateral_in_utxos, check_ins_not_empty,
      check_languages, check_min_lovelace, check_minting, check_network_id, check_output_val_size,
      check_preservation_of_value, check_script_data_hash, check_tx_ex_units, check_tx_size,
      check_tx_validity_interval, check_witness_set,
    },
    utils::{get_alonzo_comp_tx_size, AlonzoProtParams, FeePolicy},
    Environment, MultiEraProtParams, UTxOs,
  },
  ledger::primitives::alonzo::{MintedTx, TransactionBody},
};

use crate::{Validation, Validations};

use super::validate::set_description;

// & The following validation requires the size and the protocol params
fn validate_alonzo_tx_size(size: &Option<u64>, prot_pps: &AlonzoProtParams) -> Validation {
  match size {
    Some(size_value) => {
      let res = check_tx_size(&size_value, &prot_pps);
      let description = set_description(
        &res,
        "The transaction size does not exceed the protocol limit.".to_string(),
      );
      return Validation::new()
        .with_name("Transaction size".to_string())
        .with_value(res.is_ok())
        .with_description(description);
    }
    None => {
      return Validation::new()
        .with_name("Transaction size".to_string())
        .with_value(false)
        .with_description("The transaction size could not be obtained.".to_string());
    }
  }
}

// & The following validations require the transaction
fn validate_alonzo_ins_not_empty(mtx_a: &MintedTx) -> Validation {
  let res = check_ins_not_empty(&mtx_a.transaction_body);
  let description = set_description(
    &res,
    "The set of transaction inputs is not empty.".to_string(),
  );
  return Validation::new()
    .with_name("Non empty inputs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_auxiliary_data(mtx_a: &MintedTx) -> Validation {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let res = check_auxiliary_data(&tx_body, mtx_a);
  let description = set_description(
    &res,
    "The auxiliary data of the transaction is valid.".to_string(),
  );
  return Validation::new()
    .with_name("Auxiliary data".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_script_data_hash(mtx_a: &MintedTx) -> Validation {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let res = check_script_data_hash(&tx_body, mtx_a);
  let description = set_description(
    &res,
    "The script data integrity hash matches the hash of the redeemers, languages and datums of the transaction witness set.".to_string(),
  );
  return Validation::new()
    .with_name("Script data hash".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_minting(mtx_a: &MintedTx) -> Validation {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let res = check_minting(&tx_body, mtx_a);
  let description = set_description(
    &res,
    "Each minted / burned asset is paired with an appropriate native script or Plutus script."
      .to_string(),
  );
  return Validation::new()
    .with_name("Minting".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction and the protocol params
fn validate_alonzo_min_lovelace(mtx_a: &MintedTx, prot_pps: &AlonzoProtParams) -> Validation {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let res = check_min_lovelace(&tx_body, &prot_pps);
  let description = set_description(
    &res,
    "All transaction outputs (regular outputs and collateral outputs) should contain at least the minimum lovelace".to_string(),
  );
  return Validation::new()
    .with_name("Minimum lovelace".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_output_val_size(mtx_a: &MintedTx, prot_pps: &AlonzoProtParams) -> Validation {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let res = check_output_val_size(&tx_body, &prot_pps);
  let description = set_description(
    &res,
    "The size of the value in each of the transaction outputs (regular outputs and collateral outputs) is not greater than the maximum allowed".to_string(),
  );
  return Validation::new()
    .with_name("Minimum lovelace".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_tx_ex_units(mtx_a: &MintedTx, prot_pps: &AlonzoProtParams) -> Validation {
  let res = check_tx_ex_units(mtx_a, &prot_pps);
  let description = set_description(
    &res,
    "The size of the value in each of the transaction outputs (regular outputs and collateral outputs) is not greater than the maximum allowed".to_string(),
  );
  return Validation::new()
    .with_name("Minimum lovelace".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_languages(mtx_a: &MintedTx, prot_pps: &AlonzoProtParams) -> Validation {
  let res = check_languages(mtx_a, &prot_pps);
  let description = set_description(
    &res,
    "The required script languages are included in the protocol parameters.".to_string(),
  );
  return Validation::new()
    .with_name("Minimum lovelace".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validation requires the transaction and the network id
fn validate_alonzo_network_id(mtx_a: &MintedTx, network_id: &u8) -> Validation {
  let res = check_network_id(&mtx_a.transaction_body, network_id);
  let description = set_description(
    &res,
    "The network ID of each output matches the global network ID.".to_string(),
  );
  return Validation::new()
    .with_name("Network ID".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction and the block slot
fn validate_alonzo_tx_validity_interval(mtx_a: &MintedTx, block_slot: &u64) -> Validation {
  let res = check_tx_validity_interval(&mtx_a.transaction_body, mtx_a, block_slot);
  let description = set_description(
    &res,
    "The upper bound of the validity time interval is suitable for script execution: if there are minting policies, native scripts or Plutus scripts involved in the transaction, and if the upper bound of its validity interval is a finite number, then it can be translated to system time.".to_string(),
  );
  return Validation::new()
    .with_name("Transaction validity interval".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction and its utxos
fn validate_alonzo_ins_and_collateral_in_utxos(mtx_a: &MintedTx, utxos: &UTxOs) -> Validation {
  let res = check_ins_and_collateral_in_utxos(&mtx_a.transaction_body, utxos);
  let description = set_description(
    &res,
    "All transaction inputs and collateral inputs are in the set of (yet) unspent transaction outputs.".to_string(),
  );
  return Validation::new()
    .with_name("Inputs and collateral in UTxOs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_preservation_of_value(mtx_a: &MintedTx, utxos: &UTxOs) -> Validation {
  let res = check_preservation_of_value(&mtx_a.transaction_body, utxos);
  let description = set_description(
    &res,
    "The preservation of value property holds.".to_string(),
  );
  return Validation::new()
    .with_name("Preservation of value".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_witness_set(mtx_a: &MintedTx, utxos: &UTxOs) -> Validation {
  let res = check_witness_set(mtx_a, utxos);
  let description = set_description(&res, "The transaction witness set is valid.".to_string());
  return Validation::new()
    .with_name("Witness set".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validation requires the transaction, its utxos and the protocol params
fn validate_alonzo_fee(mtx_a: &MintedTx, utxos: &UTxOs, prot_pps: &AlonzoProtParams) -> Validation {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let size: &Option<u64> = &get_alonzo_comp_tx_size(tx_body);
  match size {
    Some(size_value) => {
      let res = check_fee(tx_body, size_value, mtx_a, utxos, prot_pps);
      let description = set_description(
        &res,
        "The fee paid by the transaction should be greater than or equal to the minimum fee."
          .to_string(),
      );
      return Validation::new()
        .with_name("Fee".to_string())
        .with_value(res.is_ok())
        .with_description(description);
    }
    None => {
      return Validation::new()
        .with_name("Fee".to_string())
        .with_value(false)
        .with_description("The size could not be obtained.".to_string());
    }
  }
}

pub fn validate_alonzo(mtx_a: &MintedTx) -> Validations {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let size: &Option<u64> = &get_alonzo_comp_tx_size(tx_body);
  let prot_params = AlonzoProtParams {
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
    prot_params: MultiEraProtParams::Alonzo(prot_params.clone()),
    prot_magic: 764824073, // Mainnet. For preprod: 1. For preview: 2
    block_slot: 72316896,  // TODO: Must be an input
    network_id: 1,         // Mainnet. For preprod: 0. For preview: 0
  };
  let out = Validations::new()
    .with_era("Alonzo".to_string())
    .add_new_validation(validate_alonzo_tx_size(size, &prot_params))
    .add_new_validation(validate_alonzo_ins_not_empty(mtx_a))
    .add_new_validation(validate_alonzo_auxiliary_data(mtx_a))
    .add_new_validation(validate_alonzo_script_data_hash(mtx_a))
    .add_new_validation(validate_alonzo_minting(mtx_a))
    .add_new_validation(validate_alonzo_min_lovelace(mtx_a, &prot_params))
    .add_new_validation(validate_alonzo_output_val_size(mtx_a, &prot_params))
    .add_new_validation(validate_alonzo_tx_ex_units(mtx_a, &prot_params))
    .add_new_validation(validate_alonzo_languages(mtx_a, &prot_params))
    .add_new_validation(validate_alonzo_network_id(mtx_a, &env.network_id))
    .add_new_validation(validate_alonzo_tx_validity_interval(mtx_a, &env.block_slot));
  out
}
