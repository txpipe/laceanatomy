use pallas::{
  applying::{
    shelley_ma::{
      check_fees, check_ins_in_utxos, check_ins_not_empty, check_metadata, check_min_lovelace,
      check_minting, check_network_id, check_preservation_of_value, check_ttl, check_tx_size,
      check_witnesses,
    },
    utils::{get_alonzo_comp_tx_size, FeePolicy, ShelleyProtParams},
    Environment, MultiEraProtParams, UTxOs,
  },
  ledger::{
    primitives::alonzo::{MintedTx, MintedWitnessSet, TransactionBody},
    traverse::Era,
  },
};

use crate::{Validation, ValidationContext, Validations};

use super::validate::set_description;

// & The following validation requires the size and the protocol parameters
fn validate_byron_ma_size(size: &Option<u64>, prot_pps: &ShelleyProtParams) -> Validation {
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
  let res = check_min_lovelace(&tx_body, &prot_pps, &Era::Shelley);
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
  size: &Option<u64>,
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
    " The owner of each transaction input signed the transaction.".to_string(),
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

pub fn validate_shelley_ma(
  mtx_sma: &MintedTx,
  era: &Era,
  context: ValidationContext,
) -> Validations {
  let tx_body: &TransactionBody = &mtx_sma.transaction_body;
  let tx_wits: &MintedWitnessSet = &mtx_sma.transaction_witness_set;
  let size: &Option<u64> = &get_alonzo_comp_tx_size(tx_body);
  let prot_params = ShelleyProtParams {
    fee_policy: FeePolicy {
      summand: context.min_fee_b as u64,
      multiplier: context.min_fee_a as u64,
    },
    max_tx_size: context.max_tx_size as u64,
    min_lovelace: 2000000,
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
    prot_params: MultiEraProtParams::Shelley(prot_params.clone()),
    prot_magic: magic,
    block_slot: context.block_slot as u64,
    network_id: net_id,
  };
  let out = Validations::new()
    .with_era("Shelley Mary Allegra".to_string())
    .add_new_validation(validate_byron_ma_size(&size, &prot_params))
    .add_new_validation(validate_shelley_ma_ins_not_empty(&mtx_sma))
    .add_new_validation(validate_shelley_ma_metadata(&mtx_sma))
    .add_new_validation(validate_shelley_ma_minting(&mtx_sma))
    .add_new_validation(validate_shelley_ma_min_lovelace(&mtx_sma, &prot_params))
    .add_new_validation(validate_shelley_ma_fees(&mtx_sma, &size, &prot_params))
    .add_new_validation(validate_shelley_ma_ttl(&mtx_sma, &env.block_slot))
    .add_new_validation(validate_shelley_ma_network_id(&mtx_sma, &env.network_id));
  out
}
