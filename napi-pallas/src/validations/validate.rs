use crate::validations::babbage::validate_babbage;
use crate::Validations;

use pallas::applying::utils::ValidationError;
use pallas::ledger::traverse::{Era, MultiEraTx};

use super::alonzo::validate_alonzo;
use super::byron::validate_byron;
use super::conway::validate_conway;
use super::shelley_ma::validate_shelley_ma;

pub fn set_description(res: &Result<(), ValidationError>, success: String) -> String {
  match res {
    Ok(_) => success,
    Err(e) => format!("Error: {:?}", e),
  }
}

pub fn validate(mtx: &MultiEraTx<'_>) -> Validations {
  match &mtx {
    MultiEraTx::Byron(mtxp) => validate_byron(&mtxp),
    MultiEraTx::AlonzoCompatible(mtx_sma, Era::Shelley)
    | MultiEraTx::AlonzoCompatible(mtx_sma, Era::Allegra)
    | MultiEraTx::AlonzoCompatible(mtx_sma, Era::Mary) => validate_shelley_ma(&mtx_sma),
    MultiEraTx::AlonzoCompatible(mtx_a, Era::Alonzo) => validate_alonzo(&mtx_a),
    MultiEraTx::Babbage(mtx_b) => validate_babbage(&mtx_b),
    MultiEraTx::Conway(mtx_c) => validate_conway(&mtx_c),
    // This case is impossible. TODO: Handle error
    _ => Validations::new(),
  }
}
