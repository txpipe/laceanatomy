use crate::Validations;
pub fn validate_conway() -> Validations {
  let out = Validations::new()
    .with_era("Conway".to_string())
    .add_new_validation(crate::Validation {
      name: "Coming soon...".to_string(),
      value: true,
      description: "Coming soon...".to_string(),
    });
  out
}
