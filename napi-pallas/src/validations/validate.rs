use crate::validations::babbage::validate_babbage;
use crate::{ValidationContext, Validations};

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

pub fn validate(mtx: &MultiEraTx<'_>, context: ValidationContext) -> Validations {
  match &mtx {
    MultiEraTx::Byron(mtxp) => validate_byron(&mtxp),
    MultiEraTx::AlonzoCompatible(mtx_sma, Era::Shelley) => {
      validate_shelley_ma(&mtx_sma, &Era::Shelley, context)
    }
    MultiEraTx::AlonzoCompatible(mtx_sma, Era::Allegra) => {
      validate_shelley_ma(&mtx_sma, &Era::Allegra, context)
    }
    MultiEraTx::AlonzoCompatible(mtx_sma, Era::Mary) => {
      validate_shelley_ma(&mtx_sma, &Era::Mary, context)
    }
    MultiEraTx::AlonzoCompatible(mtx_a, Era::Alonzo) => validate_alonzo(&mtx_a, context),
    MultiEraTx::Babbage(mtx_b) => validate_babbage(&mtx_b, context),
    MultiEraTx::Conway(mtx_c) => validate_conway(&mtx_c),
    // This case is impossible. TODO: Handle error
    _ => Validations::new(),
  }
}
