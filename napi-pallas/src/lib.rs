#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use std::str::FromStr;

use pallas::ledger::addresses::{Address, Network};

fn network_to_string(network: Network) -> String {
  match network {
    Network::Testnet => "testnet".into(),
    Network::Mainnet => "mainnet".into(),
    Network::Other(x) => format! {"other({x}0"},
  }
}

#[napi(object)]
pub struct ShelleyPart {
  pub is_script: bool,
  pub hash: Option<String>,
  pub pointer: Option<String>,
}

impl From<&pallas::ledger::addresses::ShelleyPaymentPart> for ShelleyPart {
  fn from(value: &pallas::ledger::addresses::ShelleyPaymentPart) -> Self {
    Self {
      is_script: value.is_script(),
      hash: Some(value.as_hash().to_string()),
      pointer: None,
    }
  }
}

impl From<&pallas::ledger::addresses::ShelleyDelegationPart> for ShelleyPart {
  fn from(value: &pallas::ledger::addresses::ShelleyDelegationPart) -> Self {
    match value {
      pallas::ledger::addresses::ShelleyDelegationPart::Key(x) => Self {
        is_script: false,
        hash: Some(x.to_string()),
        pointer: None,
      },
      pallas::ledger::addresses::ShelleyDelegationPart::Script(x) => Self {
        is_script: true,
        hash: Some(x.to_string()),
        pointer: None,
      },
      pallas::ledger::addresses::ShelleyDelegationPart::Pointer(x) => Self {
        is_script: false,
        hash: None,
        pointer: Some(format!(
          "slot: {}, tx: {}, cert: {}",
          x.slot(),
          x.tx_idx(),
          x.cert_idx()
        )),
      },
      pallas::ledger::addresses::ShelleyDelegationPart::Null => Self {
        is_script: false,
        hash: None,
        pointer: None,
      },
    }
  }
}

impl From<&pallas::ledger::addresses::StakePayload> for ShelleyPart {
  fn from(value: &pallas::ledger::addresses::StakePayload) -> Self {
    match value {
      pallas::ledger::addresses::StakePayload::Stake(x) => Self {
        is_script: false,
        hash: Some(x.to_string()),
        pointer: None,
      },
      pallas::ledger::addresses::StakePayload::Script(x) => Self {
        is_script: true,
        hash: Some(x.to_string()),
        pointer: None,
      },
    }
  }
}

#[napi(object)]
pub struct AddressDiagnostic {
  pub kind: String,
  pub network: Option<String>,
  pub payment_part: Option<ShelleyPart>,
  pub delegation_part: Option<ShelleyPart>,
  pub byron_cbor: Option<String>,
}

impl From<Address> for AddressDiagnostic {
  fn from(value: Address) -> Self {
    match value {
      Address::Byron(x) => Self {
        kind: "Byron".into(),
        network: None,
        payment_part: None,
        delegation_part: None,
        byron_cbor: Some(hex::encode(x.payload.as_slice())),
      },
      Address::Shelley(x) => Self {
        kind: "Shelley".into(),
        network: Some(network_to_string(x.network())),
        payment_part: Some(x.payment().into()),
        delegation_part: Some(x.delegation().into()),
        byron_cbor: None,
      },
      Address::Stake(x) => Self {
        kind: "Stake".into(),
        network: Some(network_to_string(x.network())),
        payment_part: None,
        delegation_part: Some(x.payload().into()),
        byron_cbor: None,
      },
    }
  }
}

#[napi(object)]
pub struct Output {
  pub error: Option<String>,
  pub bytes: Option<String>,
  pub address: Option<AddressDiagnostic>,
}

#[napi]
pub fn parse_address(raw: String) -> Output {
  match Address::from_str(&raw) {
    Ok(addr) => Output {
      error: None,
      bytes: Some(hex::encode(addr.to_vec())),
      address: Some(addr.into()),
    },
    Err(err) => Output {
      error: Some(err.to_string()),
      bytes: None,
      address: None,
    },
  }
}
