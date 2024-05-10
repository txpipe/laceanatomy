use pallas::{
  applying::{
    alonzo::{
      check_auxiliary_data, check_fee, check_ins_and_collateral_in_utxos, check_ins_not_empty,
      check_languages, check_min_lovelace, check_minting, check_network_id, check_output_val_size,
      check_preservation_of_value, check_script_data_hash, check_tx_ex_units, check_tx_size,
      check_tx_validity_interval, check_witness_set,
    },
    utils::{get_alonzo_comp_tx_size, AlonzoProtParams},
    Environment, MultiEraProtocolParameters, UTxOs,
  },
  ledger::primitives::{
    alonzo::{ExUnitPrices, Language, MintedTx, TransactionBody},
    conway::{ExUnits, Nonce, NonceVariant, RationalNumber},
  },
};

use crate::{Validation, ValidationContext, Validations};

use super::validate::set_description;
use pallas::codec::utils::KeyValuePairs;

// & The following validation requires the size and the protocol params
fn validate_alonzo_tx_size(size: &Option<u32>, prot_pps: &AlonzoProtParams) -> Validation {
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
    .with_name("Outputs value size".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_alonzo_tx_ex_units(mtx_a: &MintedTx, prot_pps: &AlonzoProtParams) -> Validation {
  let res = check_tx_ex_units(mtx_a, &prot_pps);
  let description = set_description(
    &res,
    "The number of execution units of the transaction should not exceed the maximum allowed"
      .to_string(),
  );
  return Validation::new()
    .with_name("Execution units".to_string())
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
    .with_name("Languages".to_string())
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
  let size: &Option<u32> = &get_alonzo_comp_tx_size(tx_body);
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

pub fn validate_alonzo(mtx_a: &MintedTx, context: ValidationContext) -> Validations {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let ppt_params = context.protocol_params;
  let size: &Option<u32> = &get_alonzo_comp_tx_size(tx_body);
  let prot_params = AlonzoProtParams {
    minfee_a: ppt_params.min_fee_a,
    minfee_b: ppt_params.min_fee_b,
    max_block_body_size: ppt_params.max_block_size,
    max_transaction_size: ppt_params.max_tx_size,
    max_block_header_size: ppt_params.max_block_header_size,
    key_deposit: ppt_params.key_deposit as u64,
    pool_deposit: ppt_params.pool_deposit as u64,
    maximum_epoch: ppt_params.e_max as u64,
    desired_number_of_stake_pools: ppt_params.n_opt,
    pool_pledge_influence: RationalNumber {
      numerator: ppt_params.a0_numerator as u64,
      denominator: ppt_params.a0_denominator as u64,
    },
    expansion_rate: RationalNumber {
      numerator: ppt_params.rho_numerator as u64,
      denominator: ppt_params.rho_denominator as u64,
    },
    treasury_growth_rate: RationalNumber {
      numerator: ppt_params.tau_numerator as u64,
      denominator: ppt_params.tau_denominator as u64,
    },
    decentralization_constant: RationalNumber {
      numerator: ppt_params.decentralisation_param_numerator as u64,
      denominator: ppt_params.decentralisation_param_denominator as u64,
    },
    extra_entropy: Nonce {
      variant: NonceVariant::NeutralNonce,
      hash: None,
    },
    protocol_version: (
      ppt_params.protocol_minor_ver as u64,
      ppt_params.protocol_major_ver as u64,
    ),
    min_pool_cost: ppt_params.min_pool_cost as u64,
    cost_models_for_script_languages: KeyValuePairs::Def(vec![(Language::PlutusV1, vec![])]),
    ada_per_utxo_byte: ppt_params.coins_per_utxo_size as u64,
    execution_costs: ExUnitPrices {
      mem_price: RationalNumber {
        numerator: ppt_params.price_mem_numerator as u64,
        denominator: ppt_params.price_mem_denominator as u64,
      },
      step_price: RationalNumber {
        numerator: ppt_params.price_step_numerator as u64,
        denominator: ppt_params.price_step_denominator as u64,
      },
    },
    max_tx_ex_units: ExUnits {
      mem: ppt_params.max_tx_ex_mem,
      steps: ppt_params.max_tx_ex_steps as u64,
    },
    max_block_ex_units: ExUnits {
      mem: ppt_params.max_block_ex_mem,
      steps: ppt_params.max_block_ex_steps as u64,
    },
    max_value_size: ppt_params.max_val_size,
    collateral_percentage: ppt_params.collateral_percent,
    max_collateral_inputs: ppt_params.max_collateral_inputs,
  };

  let mut magic = 764824073; // For mainnet
  if context.network == "Preprod" {
    magic = 1;
  } else if context.network == "Preview" {
    magic = 2;
  }

  let mut net_id = 1; // For mainnet
  if context.network == "Preprod" || context.network == "Preview" {
    net_id = 0;
  }

  let env: Environment = Environment {
    prot_params: MultiEraProtocolParameters::Alonzo(prot_params.clone()),
    prot_magic: magic,
    block_slot: context.block_slot as u64,
    network_id: net_id,
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
