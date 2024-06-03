use std::str::FromStr;

use blockfrost_openapi::models::{
  tx_content_output_amount_inner::TxContentOutputAmountInner,
  tx_content_utxo_outputs_inner::TxContentUtxoOutputsInner,
};
use pallas::{
  applying::{
    shelley_ma::{
      check_fees, check_ins_in_utxos, check_ins_not_empty, check_metadata, check_min_lovelace,
      check_minting, check_network_id, check_preservation_of_value, check_ttl, check_tx_size,
      check_witnesses,
    },
    utils::{get_alonzo_comp_tx_size, ShelleyProtParams},
    Environment, MultiEraProtocolParameters, UTxOs,
  },
  codec::utils::{Bytes, KeyValuePairs},
  crypto::hash::Hash,
  ledger::{
    addresses::Address,
    primitives::{
      alonzo::{MintedTx, MintedWitnessSet, TransactionBody, Value},
      conway::{NonceVariant, RationalNumber},
    },
    traverse::{update::Nonce, Era},
  },
};

use crate::{tx::get_input, ProtocolParams, Validation, ValidationContext, Validations};

use super::{alonzo::mk_utxo_for_alonzo_compatible_tx, validate::set_description};

// & The following validation requires the size and the protocol parameters
fn validate_shelley_ma_tx_size(size: &Option<u32>, prot_pps: &ShelleyProtParams) -> Validation {
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
fn validate_shelley_ma_ins_not_empty(mtx_sma: &MintedTx) -> Validation {
  let res = check_ins_not_empty(&mtx_sma.transaction_body);
  let description = set_description(
    &res,
    "The set of transaction inputs is not empty.".to_string(),
  );
  return Validation::new()
    .with_name("Non empty inputs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_shelley_ma_metadata(mtx_sma: &MintedTx) -> Validation {
  let tx_body = &mtx_sma.transaction_body;
  let res = check_metadata(&tx_body, mtx_sma);
  let description = set_description(
    &res,
    "The metadata of the transaction is valid.".to_string(),
  );
  return Validation::new()
    .with_name("Metadata".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_shelley_ma_minting(mtx_sma: &MintedTx) -> Validation {
  let tx_body = &mtx_sma.transaction_body;
  let res = check_minting(&tx_body, mtx_sma);
  let description = set_description(&res, "The minting of the transaction is valid.".to_string());
  return Validation::new()
    .with_name("Minting".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction the protocol parameters
fn validate_shelley_ma_min_lovelace(
  mtx_sma: &MintedTx,
  prot_pps: &ShelleyProtParams,
) -> Validation {
  let tx_body = &mtx_sma.transaction_body;
  let res = check_min_lovelace(&tx_body, &prot_pps);
  let description = set_description(
    &res,
    "All transaction outputs contain Lovelace values not under the minimum.".to_string(),
  );
  return Validation::new()
    .with_name("Minimum lovelace".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction the size and the protocol parameters
fn validate_shelley_ma_fees(
  mtx_sma: &MintedTx,
  size: &Option<u32>,
  prot_pps: &ShelleyProtParams,
) -> Validation {
  match size {
    Some(size_value) => {
      let res = check_fees(&mtx_sma.transaction_body, &size_value, &prot_pps);
      let description = set_description(
        &res,
        "The fee paid by the transaction has to be greater than or equal to the minimum fee."
          .to_string(),
      );
      return Validation::new()
        .with_name("Fees".to_string())
        .with_value(res.is_ok())
        .with_description(description);
    }
    None => {
      return Validation::new()
        .with_name("Fees".to_string())
        .with_value(false)
        .with_description("The transaction size could not be obtained.".to_string());
    }
  }
}

// & The following validations require the transaction and its utxos
fn validate_shelley_ma_ins_in_utxos(mtx_sma: &MintedTx, utxos: &UTxOs) -> Validation {
  let tx_body = &mtx_sma.transaction_body;
  let res = check_ins_in_utxos(tx_body, &utxos);
  let description = set_description(
    &res,
    "All transaction inputs are in the set of (yet) unspent transaction outputs.".to_string(),
  );
  return Validation::new()
    .with_name("Inputs in UTxOs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction its utxos and the era
fn validate_shelley_ma_preservation_of_value(
  mtx_sma: &MintedTx,
  utxos: &UTxOs,
  era: &Era,
) -> Validation {
  let tx_body = &mtx_sma.transaction_body;
  let res = check_preservation_of_value(tx_body, &utxos, era);
  let description = set_description(
    &res,
    "The preservation of value property holds.".to_string(),
  );
  return Validation::new()
    .with_name("Preservation of value".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction its witnesses set and its utxos
fn validate_shelley_ma_witnesses(
  mtx_sma: &MintedTx,
  tx_wits: &MintedWitnessSet,
  utxos: &UTxOs,
) -> Validation {
  let tx_body = &mtx_sma.transaction_body;
  let res = check_witnesses(&tx_body, &tx_wits, &utxos);
  let description = set_description(
    &res,
    "The owner of each transaction input signed the transaction.".to_string(),
  );
  return Validation::new()
    .with_name("Witnesses".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction and the block slot
fn validate_shelley_ma_ttl(mtx_sma: &MintedTx, block_slot: &u64) -> Validation {
  let tx_body = &mtx_sma.transaction_body;
  let res = check_ttl(&tx_body, &block_slot);
  let description = set_description(
    &res,
    "The TTL limit of the transaction has not been exceeded.".to_string(),
  );
  return Validation::new()
    .with_name("TTL".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction and the network id
fn validate_shelley_ma_network_id(mtx_sma: &MintedTx, network_id: &u8) -> Validation {
  let tx_body = &mtx_sma.transaction_body;
  let res = check_network_id(&tx_body, &network_id);
  let description = set_description(
    &res,
    "The network ID of each output matches the global network ID.".to_string(),
  );
  return Validation::new()
    .with_name("Network id".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn ppt_from_context(ppt_params: ProtocolParams) -> ShelleyProtParams {
  ShelleyProtParams {
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
    min_utxo_value: ppt_params.min_utxo as u64,
  }
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
  let address = Address::from_bech32(&tx_in.address).unwrap();
  let value = from_amounts(&tx_in.amount);

  let datum_opt: Option<Hash<32>> = match &tx_in.data_hash {
    Some(data_hash) => Some(hex::decode(data_hash).unwrap().as_slice().into()),
    _ => None,
  };
  (Address::to_hex(&address), value, datum_opt)
}

pub async fn validate_shelley_ma(
  mtx_sma: &MintedTx<'_>,
  era: &Era,
  context: ValidationContext,
) -> Validations {
  let tx_body: &TransactionBody = &mtx_sma.transaction_body;
  let tx_wits: &MintedWitnessSet = &mtx_sma.transaction_witness_set;
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
    prot_params: MultiEraProtocolParameters::Shelley(prot_params.clone()),
    prot_magic: magic,
    block_slot: context.block_slot as u64,
    network_id: net_id,
  };

  let mut inputs = vec![];
  for mtx_in in &mtx_sma.transaction_body.inputs {
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

  let utxos = mk_utxo_for_alonzo_compatible_tx(&mtx_sma.transaction_body, &tx_outs_info);

  let out = Validations::new()
    .with_era("Shelley Mary Allegra".to_string())
    .add_new_validation(validate_shelley_ma_tx_size(size, &prot_params))
    .add_new_validation(validate_shelley_ma_ins_not_empty(&mtx_sma))
    .add_new_validation(validate_shelley_ma_metadata(&mtx_sma))
    .add_new_validation(validate_shelley_ma_minting(&mtx_sma))
    .add_new_validation(validate_shelley_ma_min_lovelace(&mtx_sma, &prot_params))
    .add_new_validation(validate_shelley_ma_fees(&mtx_sma, &size, &prot_params))
    .add_new_validation(validate_shelley_ma_ttl(&mtx_sma, &env.block_slot))
    .add_new_validation(validate_shelley_ma_network_id(&mtx_sma, &env.network_id))
    .add_new_validation(validate_shelley_ma_ins_in_utxos(&mtx_sma, &utxos))
    .add_new_validation(validate_shelley_ma_preservation_of_value(
      &mtx_sma, &utxos, era,
    ))
    .add_new_validation(validate_shelley_ma_witnesses(&mtx_sma, &tx_wits, &utxos));

  out
}
