use pallas::ledger::primitives::conway::MintedTx;

use crate::Validations;
pub fn validate_conway(mtx_c: &MintedTx) -> Validations {
  let out = Validations::new().with_era("Conway".to_string());
  out
}
