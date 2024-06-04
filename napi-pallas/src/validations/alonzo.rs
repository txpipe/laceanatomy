use std::{borrow::Cow, iter::zip, str::FromStr};

use blockfrost_openapi::models::{
  tx_content_output_amount_inner::TxContentOutputAmountInner,
  tx_content_utxo_outputs_inner::TxContentUtxoOutputsInner,
};
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
  codec::utils::Bytes,
  crypto::hash::Hash,
  ledger::{
    addresses::Address,
    primitives::{
      alonzo::{ExUnitPrices, Language, MintedTx, TransactionBody, TransactionOutput, Value},
      conway::{ExUnits, Nonce, NonceVariant, RationalNumber},
    },
    traverse::{MultiEraInput, MultiEraOutput},
  },
};

use crate::{tx::get_input, ProtocolParams, Validation, ValidationContext, Validations};

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

fn ppt_from_context(ppt_params: ProtocolParams) -> AlonzoProtParams {
  AlonzoProtParams {
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
  }
}

pub fn mk_utxo_for_alonzo_compatible_tx<'a>(
  tx_body: &TransactionBody,
  tx_outs_info: &Vec<(
    String, // address in string format
    Value,
    Option<Hash<32>>,
  )>,
) -> UTxOs<'a> {
  let mut utxos: UTxOs = UTxOs::new();
  for (tx_in, (address, amount, datum_hash)) in zip(tx_body.inputs.clone(), tx_outs_info) {
    let multi_era_in = MultiEraInput::AlonzoCompatible(Box::new(Cow::Owned(tx_in)));
    let address_bytes = match hex::decode(address) {
      Ok(bytes_vec) => Bytes::from(bytes_vec),
      _ => return UTxOs::new(),
    };
    let tx_out = TransactionOutput {
      address: address_bytes,
      amount: amount.clone(),
      datum_hash: *datum_hash,
    };
    let multi_era_out = MultiEraOutput::AlonzoCompatible(Box::new(Cow::Owned(tx_out)));
    utxos.insert(multi_era_in, multi_era_out);
  }
  utxos
}

fn from_amounts(amounts: &Vec<TxContentOutputAmountInner>) -> Value {
  let mut lovelace_am = 0;
  let mut assets: Vec<(Hash<28>, Vec<(Bytes, u64)>)> = vec![];
  for amt in amounts {
    match amt.quantity.parse::<u64>() {
      Ok(a) => {
        if amt.unit == "lovelace" {
          lovelace_am += a
        } else {
          let policy: Hash<28> = match Hash::<28>::from_str(&amt.unit[..56]) {
            Ok(hash) => hash,
            Err(_) => Hash::new([0; 28]),
          };
          let asset_name = Bytes::from(hex::decode(amt.unit[56..].to_string()).unwrap());
          if let Some((_, policies)) = assets.iter_mut().find(|(hash, _)| hash == &policy) {
            // If found, append (asset name, amount) to assets
            policies.push((asset_name, amt.quantity.parse::<u64>().unwrap()));
          } else {
            // If not found, add a new tuple (policy, (asset name, amount)) to assets
            assets.push((
              policy,
              vec![(asset_name, amt.quantity.parse::<u64>().unwrap())],
            ));
          }
        }
      }
      Err(_) => {
        // TODO: Handle error appropriately
        continue; // Skip this iteration if parsing fails
      }
    }
  }
  if assets.len() > 0 {
    let transformed_assets: Vec<(Hash<28>, KeyValuePairs<Bytes, u64>)> = assets
      .into_iter()
      .map(|(hash, vec)| {
        let kv_pairs = KeyValuePairs::from(Vec::from(vec));
        (hash, kv_pairs)
      })
      .collect();
    Value::Multiasset(
      lovelace_am,
      KeyValuePairs::from(Vec::from(transformed_assets)),
    )
  } else {
    Value::Coin(lovelace_am)
  }
}

fn from_tx_in(tx_in: &TxContentUtxoOutputsInner) -> (String, Value, Option<Hash<32>>) {
  let address = match Address::from_bech32(&tx_in.address) {
    Ok(addr) => addr,
    _ => {
      println!("Error parsing address: {:?}", tx_in.address);
      return ("".to_string(), Value::Coin(0), None);
    }
  };
  let value = from_amounts(&tx_in.amount);

  let datum_opt: Option<Hash<32>> = match &tx_in.data_hash {
    Some(data_hash) => Some(hex::decode(data_hash).unwrap().as_slice().into()),
    _ => None,
  };
  (Address::to_hex(&address), value, datum_opt)
}

pub async fn validate_alonzo(mtx_a: &MintedTx<'_>, context: ValidationContext) -> Validations {
  let tx_body: &TransactionBody = &mtx_a.transaction_body;
  let size: &Option<u32> = &get_alonzo_comp_tx_size(tx_body);
  let prot_params = ppt_from_context(context.protocol_params);

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

  let mut inputs = vec![];
  for mtx_in in &mtx_a.transaction_body.inputs {
    inputs.push(
      get_input(
        mtx_in.transaction_id.to_string(),
        mtx_in.index as i32,
        context.network.clone(),
      )
      .await,
    );
  }
  let mut tx_outs_info = vec![];
  inputs.iter().for_each(|tx_in| {
    tx_outs_info.push(from_tx_in(&tx_in));
  });
  let utxos = mk_utxo_for_alonzo_compatible_tx(&mtx_a.transaction_body, &tx_outs_info);

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
    .add_new_validation(validate_alonzo_tx_validity_interval(mtx_a, &env.block_slot))
    .add_new_validation(validate_alonzo_ins_and_collateral_in_utxos(mtx_a, &utxos))
    .add_new_validation(validate_alonzo_preservation_of_value(mtx_a, &utxos))
    .add_new_validation(validate_alonzo_witness_set(mtx_a, &utxos))
    .add_new_validation(validate_alonzo_fee(mtx_a, &utxos, &prot_params));
  out
}
