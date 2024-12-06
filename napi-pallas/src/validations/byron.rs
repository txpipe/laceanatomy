use crate::Validations;
use pallas::ledger::primitives::byron::MintedTxPayload;
pub fn validate_byron(_mtxp: &MintedTxPayload) -> Validations {
  let out = Validations::new();
  out
}
