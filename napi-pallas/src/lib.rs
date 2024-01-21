#![deny(clippy::all)]

use std::str::FromStr;

#[macro_use]
extern crate napi_derive;

mod address;
mod block;
mod tx;

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

  fn build_child<F>(mut self, func: F) -> Self
  where
    F: FnOnce() -> Section,
  {
    let child = func();
    self.children.push(child);

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
pub fn safe_parse_tx(raw: String) -> Section {
  match tx::parse(raw) {
    Ok(x) => x,
    Err(x) => x,
  }
}

#[napi]
pub fn safe_parse_block(raw: String) -> Section {
  match block::parse(raw) {
    Ok(x) => x,
    Err(x) => x,
  }
}
