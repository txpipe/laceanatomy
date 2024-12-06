use crate::Validations;
use pallas::ledger::primitives::babbage::MintedTx as BabbageMintedTx;

pub fn validate_babbage(_mtx_b: &BabbageMintedTx) -> Validations {
  let out = Validations::new();
  out
}
