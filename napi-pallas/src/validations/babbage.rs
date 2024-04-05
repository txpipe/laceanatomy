use crate::{Validation, Validations};
use pallas::{
  applying::babbage::check_ins_not_empty,
  ledger::primitives::babbage::{MintedTransactionBody, MintedTx as BabbageMintedTx},
};

use super::validate::set_description;

fn validate_babbage_ins_not_empty(mtx: &BabbageMintedTx) -> Validation {
  let tx_body: &MintedTransactionBody = &mtx.transaction_body.clone();
  let res = check_ins_not_empty(tx_body);
  let description = set_description(&res, "Inputs are not empty".to_string());
  return Validation::new()
    .with_name("Non empty inputs".to_string())
    .with_value(res.is_ok())
    .with_description(description);
}

pub fn validate_babbage(mtx_b: &BabbageMintedTx) -> Validations {
  let out = Validations::new()
    .add_new_validation(validate_babbage_ins_not_empty(&mtx_b))
    .add_new_validation(validate_babbage_ins_not_empty(&mtx_b));
  out
}
