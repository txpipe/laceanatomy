use crate::Validations;
use pallas::ledger::primitives::byron::MintedTxPayload;
pub fn validate_byron(mtxp: &MintedTxPayload) -> Validations {
  let out = Validations::new().with_era("Byron".to_string());
  out
}
