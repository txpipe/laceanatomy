use pallas::ledger::primitives::alonzo::MintedTx;

use crate::Validations;

pub fn validate_shelley_ma(mtx_sma: &MintedTx) -> Validations {
  let out = Validations::new().with_era("Shelley Mary Allegra".to_string());
  out
}
