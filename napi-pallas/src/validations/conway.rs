use pallas::ledger::primitives::conway::MintedTx;

use crate::Validations;
pub fn validate_conway(_mtx_c: &MintedTx) -> Validations {
  let out = Validations::new();
  out
}
