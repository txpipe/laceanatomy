#![deny(clippy::all)]

use std::str::FromStr;

#[macro_use]
extern crate napi_derive;

mod address;
mod block;
mod tx;
mod validations;

#[derive(Default)]
#[napi(object)]
pub struct ProtocolParams {
  pub epoch: u32,
  pub min_fee_a: u32,
  pub min_fee_b: u32,
  pub max_block_size: u32,
  pub max_tx_size: u32,
  pub max_block_header_size: u32,
  pub key_deposit: i64,
  pub pool_deposit: i64,
  pub e_max: i64,
  pub n_opt: u32,
  pub a0_numerator: i64,
  pub a0_denominator: i64,
  pub rho_numerator: i64,
  pub rho_denominator: i64,
  pub tau_numerator: i64,
  pub tau_denominator: i64,
  pub decentralisation_param_numerator: i64,
  pub decentralisation_param_denominator: i64,
  pub extra_entropy_numerator: u32,
  pub extra_entropy_denominator: u32,
  pub protocol_major_ver: i64,
  pub protocol_minor_ver: i64,
  pub min_utxo: i64,
  pub min_pool_cost: i64,
  pub price_mem_numerator: i64,
  pub price_mem_denominator: i64,
  pub price_step_numerator: i64,
  pub price_step_denominator: i64,
  pub max_tx_ex_mem: u32,
  pub max_tx_ex_steps: i64,
  pub max_block_ex_mem: u32,
  pub max_block_ex_steps: i64,
  pub max_val_size: u32,
  pub collateral_percent: u32,
  pub max_collateral_inputs: u32,
  pub coins_per_utxo_size: i64,
  pub coins_per_utxo_word: i64,
  pub error: Option<String>,
}

impl ProtocolParams {
  fn new() -> Self {
    Default::default()
  }
}

#[derive(Default)]
#[napi(object)]
pub struct ValidationContext {
  pub protocol_params: ProtocolParams,

  pub network: String,
  pub era: String,
  pub block_slot: u32,
}

#[derive(Default)]
#[napi(object)]
pub struct Attribute {
  pub topic: Option<String>,
  pub value: Option<String>,
}

#[derive(Default)]
#[napi(object)]
pub struct Section {
  pub topic: Option<String>,
  pub identity: Option<String>,
  pub error: Option<String>,
  pub attributes: Vec<Attribute>,
  pub bytes: Option<String>,
  pub children: Vec<Section>,
}

impl Section {
  fn from_error(error: impl ToString) -> Self {
    Self {
      error: Some(error.to_string()),
      ..Default::default()
    }
  }

  fn new() -> Self {
    Default::default()
  }

  fn with_topic(self, topic: impl ToString) -> Self {
    Self {
      topic: Some(topic.to_string()),
      ..self
    }
  }

  fn with_bytes(self, bytes: &[u8]) -> Self {
    Self {
      bytes: Some(hex::encode(bytes)),
      ..self
    }
  }

  fn with_attr(mut self, topic: impl ToString, value: impl ToString) -> Self {
    self.attributes.push(Attribute {
      topic: Some(topic.to_string()),
      value: Some(value.to_string()),
    });

    self
  }

  fn with_maybe_attr(mut self, topic: impl ToString, value: Option<impl ToString>) -> Self {
    self.attributes.push(Attribute {
      topic: Some(topic.to_string()),
      value: value.map(|v| v.to_string()),
    });

    self
  }

  fn try_build_child<F>(mut self, func: F) -> Self
  where
    F: FnOnce() -> anyhow::Result<Section>,
  {
    match func() {
      Ok(x) => {
        self.children.push(x);
      }
      Err(x) => self.error = Some(x.to_string()),
    };

    self
  }

  fn push_child(mut self, child: Section) -> Self {
    self.children.push(child);

    self
  }

  fn maybe_push_child(mut self, child: Option<Section>) -> Self {
    if let Some(child) = child {
      self.children.push(child)
    }

    self
  }

  fn build_child<F>(mut self, func: F) -> Self
  where
    F: FnOnce() -> Section,
  {
    self.push_child(func())
  }

  fn append_children<I>(mut self, iter: I) -> Self
  where
    I: Iterator<Item = Section>,
  {
    for c in iter {
      self.children.push(c);
    }

    self
  }

  fn collect_children<I>(mut self, iter: I) -> Self
  where
    I: Iterator<Item = Section>,
  {
    self.children = iter.collect();

    self
  }
}

#[napi]
pub fn parse_address(raw: String) -> address::Output {
  match address::Address::from_str(&raw) {
    Ok(addr) => address::Output {
      error: None,
      bytes: Some(hex::encode(addr.to_vec())),
      address: Some(addr.into()),
    },
    Err(err) => address::Output {
      error: Some(err.to_string()),
      bytes: None,
      address: None,
    },
  }
}

#[napi]
pub fn safe_parse_block(raw: String) -> Section {
  match block::parse(raw) {
    Ok(x) => x,
    Err(x) => x,
  }
}

#[derive(Default)]
#[napi(object)]
pub struct SectionValidation {
  pub section: Section,
  pub validations: Validations,
}

#[napi]
pub fn safe_parse_tx(raw: String, context: ValidationContext) -> SectionValidation {
  match tx::parse(raw, context) {
    Ok(x) => {
      let (section, validations) = x;
      SectionValidation {
        section,
        validations,
      }
    }
    Err(x) => SectionValidation {
      section: x,
      validations: Validations::new(),
    },
  }
}

#[tokio::main]
#[napi]
pub async fn get_latest_params(network: String) -> ProtocolParams {
  match tx::get_epochs_latest_parameters(network).await {
    Ok(params) => params,
    Err(_) => ProtocolParams::new(),
  }
}

#[derive(Default)]
#[napi(object)]
pub struct Validation {
  pub name: String,
  pub value: bool,
  pub description: String,
}

impl Validation {
  fn new() -> Self {
    Default::default()
  }

  pub fn with_description(self, description: impl ToString) -> Self {
    Self {
      description: description.to_string(),
      ..self
    }
  }

  pub fn with_value(self, value: bool) -> Self {
    Self { value, ..self }
  }

  pub fn with_name(self, name: impl ToString) -> Self {
    Self {
      name: name.to_string(),
      ..self
    }
  }
}

#[derive(Default)]
#[napi(object)]
pub struct Validations {
  pub validations: Vec<Validation>,
  pub era: String,
}

impl Validations {
  pub fn new() -> Self {
    Default::default()
  }

  pub fn add_new_validation(mut self, validation: Validation) -> Self {
    self.validations.push(validation);

    self
  }

  pub fn with_era(self, era: impl ToString) -> Self {
    Self {
      era: era.to_string(),
      ..self
    }
  }
}
