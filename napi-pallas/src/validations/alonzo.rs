use pallas::ledger::primitives::alonzo::MintedTx;

use crate::Validations;

pub fn validate_alonzo(mtx_a: &MintedTx) -> Validations {
  let out = Validations::new();
  out
}
