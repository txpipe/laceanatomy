use crate::{Validation, ValidationContext, Validations};
use blockfrost::{BlockFrostSettings, BlockfrostAPI};
use blockfrost_openapi::models::tx_content_utxo_outputs_inner::TxContentUtxoOutputsInner;
use dotenv::dotenv;
use pallas::{
  applying::{
    babbage::{
      check_all_ins_in_utxos, check_auxiliary_data, check_fee, check_ins_not_empty,
      check_languages, check_min_lovelace, check_minting, check_network_id, check_output_val_size,
      check_preservation_of_value, check_script_data_hash, check_tx_ex_units, check_tx_size,
      check_tx_validity_interval, check_well_formedness, check_witness_set,
    },
    utils::{get_babbage_tx_size, BabbageProtParams},
    Environment, MultiEraProtocolParameters, UTxOs,
  },
  ledger::{
    primitives::{
      alonzo::ExUnitPrices,
      babbage::{CostMdls, MintedTransactionBody, MintedTx as BabbageMintedTx},
      conway::{Nonce, NonceVariant, RationalNumber},
    },
    traverse::update::ExUnits,
  },
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
fn validate_babbage_tx_size(size: &Option<u32>, prot_pps: &BabbageProtParams) -> Validation {
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
  size: &Option<u32>,
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
    .with_name("Script data hash".to_string())
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

use std::env;

pub async fn get_input_from_index(
  hash: String,
  network: String,
  index: i32,
) -> Option<TxContentUtxoOutputsInner> {
  let settings = BlockFrostSettings::new();
  dotenv().ok();
  let mut project_id = env::var("MAINNET_PROJECT_ID").expect("MAINNET_PROJECT_ID must be set.");
  if network == "Preprod" {
    project_id = env::var("PREPROD_PROJECT_ID").expect("PREPROD_PROJECT_ID must be set.");
  } else if network == "Preview" {
    project_id = env::var("PREVIEW_PROJECT_ID").expect("PREVIEW_PROJECT_ID must be set.");
  }

  let api = BlockfrostAPI::new(&project_id, settings);
  let tx = api.transactions_utxos(&hash).await;
  print!("{:?}", tx);
  match tx {
    Ok(tx_) => {
      let outputs = tx_.outputs;
      outputs.iter().find_map(|output| {
        if output.output_index == index {
          Some(output.clone())
        } else {
          None
        }
      })
    }
    Err(_) => None,
  }
}

pub fn validate_babbage(mtx_b: &BabbageMintedTx, context: ValidationContext) -> Validations {
  let tx_body: &MintedTransactionBody = &mtx_b.transaction_body.clone();
  let ppt_params = context.protocol_params;
  let size: &Option<u32> = &get_babbage_tx_size(tx_body);
  let prot_params = BabbageProtParams {
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
    cost_models_for_script_languages: CostMdls {
      plutus_v1: None,
      plutus_v2: None,
    },
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
    prot_params: MultiEraProtocolParameters::Babbage(prot_params.clone()),
    prot_magic: magic,
    block_slot: context.block_slot as u64,
    network_id: net_id,
  };

  let inputs = mtx_b.transaction_body.inputs.clone();
  let mut utxos: UTxOs = UTxOs::new();

  let out = Validations::new()
    .with_era(context.era.to_string())
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
