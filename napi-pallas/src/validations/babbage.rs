use crate::{tx::get_input, ProtocolParams, Validation, ValidationContext, Validations};
use blockfrost_openapi::models::{
  tx_content_output_amount_inner::TxContentOutputAmountInner,
  tx_content_utxo_outputs_inner::TxContentUtxoOutputsInner,
};
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
  codec::{
    minicbor::decode,
    utils::{Bytes, CborWrap, KeepRaw, KeyValuePairs},
  },
  crypto::hash::Hash,
  ledger::{
    addresses::Address,
    primitives::{
      alonzo::ExUnitPrices,
      babbage::{
        CostMdls, MintedDatumOption, MintedPostAlonzoTransactionOutput, MintedScriptRef,
        MintedTransactionBody, MintedTransactionOutput, MintedTx as BabbageMintedTx,
        PseudoTransactionOutput, Value,
      },
      conway::{Nonce, NonceVariant, PlutusData, PlutusV2Script, RationalNumber},
    },
    traverse::{update::ExUnits, MultiEraInput, MultiEraOutput},
  },
};
use std::{borrow::Cow, iter::zip, str::FromStr};

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

fn ppt_from_context(ppt_params: ProtocolParams) -> BabbageProtParams {
  BabbageProtParams {
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
  }
}

pub fn mk_utxo_for_babbage_tx<'a>(
  tx_body: &MintedTransactionBody,
  tx_outs_info: &'a Vec<(
    String, // address in string format
    Value,
    Option<MintedDatumOption>,
    Option<CborWrap<MintedScriptRef>>,
  )>,
) -> UTxOs<'a> {
  let mut utxos: UTxOs = UTxOs::new();

  for (tx_in, (addr, val, datum_opt, script_ref)) in zip(tx_body.inputs.clone(), tx_outs_info) {
    let multi_era_in = MultiEraInput::AlonzoCompatible(Box::new(Cow::Owned(tx_in)));
    let address_bytes = match hex::decode(addr) {
      Ok(bytes_vec) => Bytes::from(bytes_vec),
      _ => return UTxOs::new(),
    };
    let tx_out: MintedTransactionOutput =
      PseudoTransactionOutput::PostAlonzo(MintedPostAlonzoTransactionOutput {
        address: address_bytes,
        value: val.clone(),
        datum_option: datum_opt.clone(),
        script_ref: script_ref.clone(),
      });
    let multi_era_out: MultiEraOutput = MultiEraOutput::Babbage(Box::new(Cow::Owned(tx_out)));
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
      Err(_) => continue,
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

fn from_datum(tx_in: &TxContentUtxoOutputsInner) -> Option<MintedDatumOption> {
  match &tx_in.inline_datum {
    Some(inline_data) => {
      // let data_bytes = hex::decode(inline_data).unwrap().as_slice();
      // let data: KeepRaw<PlutusData> = decode(&data_bytes).unwrap();
      // Some(MintedDatumOption::Data(CborWrap(data)))
      None
    }
    _ => match &tx_in.data_hash {
      Some(data_hash) => Some(MintedDatumOption::Hash(
        hex::decode(data_hash).unwrap().as_slice().into(),
      )),
      _ => None::<MintedDatumOption>,
    },
  }
}

fn from_tx_in(
  tx_in: &TxContentUtxoOutputsInner,
) -> (
  String, // address in string format
  Value,
  Option<MintedDatumOption>,
  Option<CborWrap<MintedScriptRef>>,
) {
  let address = match Address::from_bech32(&tx_in.address) {
    Ok(addr) => addr,
    _ => return ("Address Not Found".to_string(), Value::Coin(0), None, None),
  };
  let value = from_amounts(&tx_in.amount);

  let datum_opt: Option<MintedDatumOption> = from_datum(&tx_in);

  let script_ref = match &tx_in.reference_script_hash {
    Some(script) => Some(CborWrap(MintedScriptRef::PlutusV2Script(PlutusV2Script(
      Bytes::from(hex::decode(script).unwrap()),
    )))),
    _ => None::<CborWrap<MintedScriptRef>>,
  };

  (Address::to_hex(&address), value, datum_opt, script_ref)
}

pub async fn validate_babbage(
  mtx_b: &BabbageMintedTx<'_>,
  context: ValidationContext,
) -> Validations {
  let tx_body: &MintedTransactionBody = &mtx_b.transaction_body.clone();
  let size: &Option<u32> = &get_babbage_tx_size(tx_body);
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
    prot_params: MultiEraProtocolParameters::Babbage(prot_params.clone()),
    prot_magic: magic,
    block_slot: context.block_slot as u64,
    network_id: net_id,
  };

  let mut tx_outs_info = vec![];
  let mut inputs = vec![];
  for mtx_in in &mtx_b.transaction_body.inputs {
    inputs.push(
      get_input(
        mtx_in.transaction_id.to_string(),
        mtx_in.index as i32,
        context.network.clone(),
      )
      .await,
    );
  }
  inputs.iter().for_each(|tx_in| {
    tx_outs_info.push(from_tx_in(&tx_in));
  });

  let utxos = mk_utxo_for_babbage_tx(&mtx_b.transaction_body, &tx_outs_info);

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
    .add_new_validation(validate_babbage_fee(&mtx_b, &size, &utxos, &prot_params))
    .add_new_validation(validate_babbage_witness_set(&mtx_b, &utxos))
    .add_new_validation(validate_babbage_all_ins_in_utxos(&mtx_b, &utxos))
    .add_new_validation(validate_babbage_preservation_of_value(&mtx_b, &utxos))
    .add_new_validation(validate_babbage_languages(
      &mtx_b,
      &utxos,
      &magic,
      &net_id,
      env.block_slot,
    ))
    .add_new_validation(validate_babbage_script_data_hash(
      &mtx_b,
      &utxos,
      &magic,
      &net_id,
      env.block_slot,
    ))
    .add_new_validation(validate_babbage_tx_validity_interval(
      &mtx_b,
      env.block_slot,
    ))
    .add_new_validation(validate_babbage_network_id(&mtx_b, env.network_id));

  out
}
