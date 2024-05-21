use std::{borrow::Cow, iter::zip};

use crate::{tx::get_inputs, Validation, ValidationContext, Validations};
use pallas::{
  applying::{
    byron::{
      check_fees, check_ins_in_utxos, check_ins_not_empty, check_outs_have_lovelace,
      check_outs_not_empty, check_size, check_witnesses,
    },
    utils::ByronProtParams,
    UTxOs,
  },
  codec::{
    minicbor::{bytes::ByteVec, encode},
    utils::TagWrap,
  },
  ledger::{
    primitives::byron::{Address, MintedTxPayload, Tx, TxOut},
    traverse::{MultiEraInput, MultiEraOutput, OriginalHash},
  },
};

use super::validate::set_description;

fn get_tx_size(tx: &Tx) -> u64 {
  let mut buff: Vec<u8> = Vec::new();
  if encode(tx, &mut buff).is_ok() {
    return buff.len() as u64;
  } else {
    return 0;
  }
}

// & The following validation requires the size and the protocol parameters
fn validate_byron_size(size: &u64, prot_pps: &ByronProtParams) -> Validation {
  if size == &0 {
    return Validation::new()
      .with_name("Transaction size".to_string())
      .with_value(false)
      .with_description("The transaction size could not be obtained.".to_string());
  }
  let res = check_size(&size, &prot_pps);
  let description = set_description(
    &res,
    "The transaction size does not exceed the protocol limit.".to_string(),
  );
  return Validation::new()
    .with_name("Transaction size".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction
fn validate_byron_ins_not_empty(tx: &Tx) -> Validation {
  let res = check_ins_not_empty(tx);
  let description = set_description(
    &res,
    "The set of transaction inputs is not empty.".to_string(),
  );
  return Validation::new()
    .with_name("Non empty inputs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_byron_outs_not_empty(tx: &Tx) -> Validation {
  let res = check_outs_not_empty(tx);
  let description = set_description(
    &res,
    "The set of transaction outputs is not empty.".to_string(),
  );
  return Validation::new()
    .with_name("Non empty outputs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

fn validate_byron_outs_have_lovelace(tx: &Tx) -> Validation {
  let res = check_outs_have_lovelace(tx);
  let description = set_description(
    &res,
    "All transaction outputs contain non-null Lovelace values.".to_string(),
  );
  return Validation::new()
    .with_name("Outputs have lovelace".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction and the UTXOs
fn validate_byron_ins_in_utxos(tx: &Tx, utxos: &UTxOs) -> Validation {
  let res = check_ins_in_utxos(tx, utxos);
  let description = set_description(
    &res,
    "All transaction inputs are in the set of (yet) unspent transaction outputs.".to_string(),
  );
  return Validation::new()
    .with_name("Inputs in UTXOs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction, the UTXOs and the protocol magic
fn validate_byron_witnesses(tx: &MintedTxPayload, utxos: &UTxOs, prot_magic: u32) -> Validation {
  let res = check_witnesses(&tx, &utxos, &prot_magic);
  let description = set_description(&res, "All transaction witnesses are valid.".to_string());
  return Validation::new()
    .with_name("Witnesses".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

// & The following validations require the transaction, the size, the UTXOs and the protocol parameters
fn validate_byron_fees(
  tx: &Tx,
  size: &u64,
  utxos: &UTxOs,
  prot_pps: &ByronProtParams,
) -> Validation {
  let res = check_fees(&tx, &size, &utxos, &prot_pps);
  let description = set_description(
    &res,
    "Fees are not less than what is determined by the protocol.".to_string(),
  );
  return Validation::new()
    .with_name("Fees".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

pub fn mk_utxo_for_byron_tx<'a>(tx: &Tx, tx_outs_info: &[(String, u64)]) -> UTxOs<'a> {
  let mut utxos: UTxOs = UTxOs::new();
  for (tx_in, (address_payload, amount)) in zip(tx.inputs.clone().to_vec(), tx_outs_info) {
    let input_tx_out_addr: Address = match hex::decode(hex::encode(address_payload)) {
      Ok(addr_bytes) => Address {
        payload: TagWrap(ByteVec::from(addr_bytes)),
        crc: 3430631884,
      },
      _ => return UTxOs::new(),
    };
    let tx_out: TxOut = TxOut {
      address: input_tx_out_addr,
      amount: *amount,
    };
    let multi_era_in: MultiEraInput = MultiEraInput::Byron(Box::new(Cow::Owned(tx_in)));
    let multi_era_out: MultiEraOutput = MultiEraOutput::Byron(Box::new(Cow::Owned(tx_out)));
    utxos.insert(multi_era_in, multi_era_out);
  }
  utxos
}

pub async fn validate_byron(mtxp: &MintedTxPayload<'_>, context: ValidationContext) -> Validations {
  let tx: &Tx = &mtxp.transaction;
  let size: &u64 = &get_tx_size(&tx);
  let prot_pps: ByronProtParams = ByronProtParams {
    script_version: 0,
    slot_duration: 20000,
    max_block_size: 2000000,
    max_header_size: 2000000,
    max_tx_size: 4096,
    max_proposal_size: 700,
    mpc_thd: 20000000000000,
    heavy_del_thd: 300000000000,
    update_vote_thd: 1000000000000,
    update_proposal_thd: 100000000000000,
    update_implicit: 10000,
    soft_fork_rule: (900000000000000, 600000000000000, 50000000000000),
    summand: 155381,
    multiplier: 44,
    unlock_stake_epoch: 18446744073709551615,
  };

  let inputs = get_inputs(
    mtxp.transaction.original_hash().to_string(),
    context.network.clone(),
  )
  .await;
  let mut tx_outs_info = vec![];
  inputs.iter().for_each(|tx_in| {
    let address = &tx_in.address;
    let mut lovelace_am = 0;
    for amt in &tx_in.amount {
      match amt.quantity.parse::<u64>() {
        Ok(a) => lovelace_am += a,
        Err(_) => {
          // TODO: Handle error appropriately
          continue; // Skip this iteration if parsing fails
        }
      }
    }

    tx_outs_info.push((address.clone(), lovelace_am));
  });
  let utxos = mk_utxo_for_byron_tx(&mtxp.transaction, &tx_outs_info);
  let mut magic = 764824073; // For mainnet
  if context.network == "Preprod" {
    magic = 1;
  } else if context.network == "Preview" {
    magic = 2;
  }

  let out = Validations::new()
    .with_era("Byron".to_string())
    .add_new_validation(validate_byron_size(&size, &prot_pps))
    .add_new_validation(validate_byron_ins_not_empty(&tx))
    .add_new_validation(validate_byron_outs_not_empty(&tx))
    .add_new_validation(validate_byron_outs_have_lovelace(&tx))
    .add_new_validation(validate_byron_ins_in_utxos(&tx, &utxos))
    .add_new_validation(validate_byron_witnesses(&mtxp, &utxos, magic))
    .add_new_validation(validate_byron_fees(&tx, &size, &utxos, &prot_pps));

  out
}
