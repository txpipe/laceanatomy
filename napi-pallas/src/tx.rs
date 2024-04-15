use crate::Validations;
use crate::{validations::validate::validate, ValidationContext};

use super::Section;
use pallas::ledger::traverse::Era;
use pallas::{
  codec::utils::KeepRaw,
  crypto::hash::Hasher,
  ledger::{
    primitives::{
      babbage::{Redeemer, RedeemerTag},
      conway::{Metadatum, PlutusData, VKeyWitness},
      ToCanonicalJson,
    },
    traverse::{ComputeHash, MultiEraInput, MultiEraOutput, MultiEraTx},
  },
};

fn generic_tx_input_section(topic: &str, i: &MultiEraInput) -> Section {
  Section::new()
    .with_topic(topic)
    .with_attr("tx_input_hash", i.hash())
    .with_attr("tx_input_index", i.index())
}

fn tx_inputs_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new().with_topic("tx_inputs").collect_children(
    tx.inputs()
      .iter()
      .map(|i| generic_tx_input_section("input", i)),
  )
}

fn tx_collateral_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("tx_collateral")
    .with_maybe_attr("tx_total_collateral", tx.total_collateral())
    .maybe_push_child(tx.collateral_return().as_ref().map(tx_output_section))
    .collect_children(
      tx.collateral()
        .iter()
        .map(|i| generic_tx_input_section("collateral", i)),
    )
}

fn tx_reference_inputs_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("tx_reference_inputs")
    .collect_children(
      tx.reference_inputs()
        .iter()
        .map(|i| generic_tx_input_section("tx_reference_input", i)),
    )
}

fn tx_output_section(o: &MultiEraOutput) -> Section {
  Section::new()
    .with_topic("output")
    .with_bytes(&o.encode())
    .with_attr("tx_output_address", o.address().unwrap())
    .with_attr("tx_output_lovelace", o.lovelace_amount())
    .maybe_push_child(o.datum().map(|x| {
      match x {
        pallas::ledger::primitives::conway::PseudoDatumOption::Hash(x) => Section::new()
          .with_topic("tx_output_datum")
          .with_attr("tx_output_datum_hash", x),
        pallas::ledger::primitives::conway::PseudoDatumOption::Data(x) => {
          tx_plutus_datum_section(&x.0)
        }
      }
    }))
    .build_child(|| {
      Section::new()
        .with_topic("tx_output_assets")
        .collect_children(o.non_ada_assets().into_iter().map(|x| {
          Section::new()
            .with_topic("tx_output_asset_policy")
            .with_attr("tx_output_asset_policy_id", x.policy())
            .build_child(|| {
              Section::new()
                .with_topic("tx_output_asset_policy_assets")
                .collect_children(x.assets().iter().map(|asset| {
                  Section::new()
                    .with_topic("tx_output_asset_policy_asset")
                    .with_attr("tx_mint_policy_asset_name", hex::encode(asset.name()))
                    .with_maybe_attr("tx_mint_policy_asset_name_ascii", asset.to_ascii_name())
                    .with_maybe_attr("tx_mint_policy_asset_coint", asset.mint_coin())
                }))
            })
        }))
    })
}

fn tx_outputs_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("tx_outputs")
    .collect_children(tx.outputs().iter().map(tx_output_section))
}

fn print_metadatum(datum: &Metadatum) -> String {
  match datum {
    Metadatum::Int(x) => x.to_string(),
    Metadatum::Bytes(x) => hex::encode(x.as_slice()),
    Metadatum::Text(x) => x.to_owned(),
    Metadatum::Array(_) => "[Array]".to_string(),
    Metadatum::Map(_) => "[Map]".to_string(),
  }
}

fn tx_mints_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("tx_mints")
    .collect_children(tx.mints().into_iter().map(|x| {
      Section::new()
        .with_topic("tx_mint_policy")
        .with_attr("tx_mint_policy_id", x.policy())
        .build_child(|| {
          Section::new()
            .with_topic("tx_mint_policy_assets")
            .collect_children(x.assets().iter().map(|asset| {
              Section::new()
                .with_topic("tx_mint_policy_asset")
                .with_attr("tx_mint_policy_asset_name", hex::encode(asset.name()))
                .with_maybe_attr("tx_mint_policy_asset_name_ascii", asset.to_ascii_name())
                .with_maybe_attr("tx_mint_policy_asset_coint", asset.mint_coin())
            }))
        })
    }))
}

fn print_redeemer_tag(tag: &RedeemerTag) -> String {
  match tag {
    RedeemerTag::Spend => "Spend".to_owned(),
    RedeemerTag::Mint => "Mint".to_owned(),
    RedeemerTag::Cert => "Cert".to_owned(),
    RedeemerTag::Reward => "Reward".to_owned(),
  }
}

fn tx_metadata_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new().with_topic("tx_metadata").collect_children(
    tx.metadata()
      .collect::<Vec<_>>()
      .into_iter()
      .map(|(label, datum)| {
        Section::new()
          .with_topic("tx_metadatum")
          .with_attr("tx_metadata_label", label)
          .with_attr("tx_metadatum_value", print_metadatum(datum))
      }),
  )
}

fn tx_plutus_datum_section(x: &KeepRaw<'_, PlutusData>) -> Section {
  Section::new()
    .with_topic("tx_datum")
    .with_bytes(x.raw_cbor())
    .with_attr("tx_datum_hash", x.compute_hash())
    .with_attr("tx_datum_json", x.to_json())
}

fn tx_redeemer_section(x: &Redeemer) -> Section {
  Section::new()
    .with_topic("tx_redeemer")
    .with_attr("tx_redeemer_tag", print_redeemer_tag(&x.tag))
    .with_attr("tx_redeemer_data_json", x.data.to_json())
    .with_attr(
      "tx_redeemer_ex_units",
      format!("mem: {}, steps: {}", x.ex_units.mem, x.ex_units.steps),
    )
}

fn tx_plutus_script_section(version: &str, script: &[u8]) -> Section {
  Section::new()
    .with_topic(format!("plutus_{version}_script"))
    .with_bytes(script)
}

fn tx_vkey_witnesses_section(wit: &VKeyWitness) -> Section {
  Section::new()
    .with_topic("vkey_witness")
    .with_attr("vkey_witness_key", hex::encode(wit.vkey.as_slice()))
    .with_attr(
      "vkey_witness_key_hash",
      hex::encode(Hasher::<224>::hash(wit.vkey.as_slice())),
    )
    .with_attr(
      "vkey_witness_signature",
      hex::encode(wit.signature.as_slice()),
    )
}

fn tx_witnesses_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("tx_witnesses")
    .append_children(tx.vkey_witnesses().iter().map(tx_vkey_witnesses_section))
    // TODO: Uncomment when branch with this issue fixed is used
    // .append_children(tx.redeemers().iter().map(tx_redeemer_section))
    .append_children(tx.plutus_data().iter().map(tx_plutus_datum_section))
    .append_children(
      tx.plutus_v1_scripts()
        .iter()
        .map(|x| tx_plutus_script_section("v1", x.as_ref())),
    )
    .append_children(
      tx.plutus_v2_scripts()
        .iter()
        .map(|x| tx_plutus_script_section("v2", x.as_ref())),
    )
    .append_children(
      tx.plutus_v3_scripts()
        .iter()
        .map(|x| tx_plutus_script_section("v3", x.as_ref())),
    )
}

pub fn create_cbor_structure(tx: &MultiEraTx<'_>) -> Section {
  let out = Section::new().with_topic("cbor_parse").try_build_child(|| {
    let child = Section::new()
      .with_topic("tx")
      .with_attr("era", tx.era())
      .with_attr("tx_hash", tx.hash())
      .with_maybe_attr("fee", tx.fee())
      .with_maybe_attr("start", tx.validity_start())
      .with_maybe_attr("ttl", tx.ttl())
      .build_child(|| tx_inputs_section(&tx))
      .build_child(|| tx_collateral_section(&tx))
      .build_child(|| tx_outputs_section(&tx))
      .build_child(|| tx_reference_inputs_section(&tx))
      .build_child(|| tx_mints_section(&tx))
      .build_child(|| tx_metadata_section(&tx))
      .build_child(|| tx_witnesses_section(&tx));

    Ok(child)
  });
  out
}

pub fn parse(raw: String, context: ValidationContext) -> Result<(Section, Validations), Section> {
  let res_cbor = hex::decode(raw);
  let mut era_decode = Era::Babbage;
  match context.era.as_str() {
    "Alonzo" => era_decode = Era::Alonzo,
    "Babbage" => era_decode = Era::Babbage,
    "Byron" => era_decode = Era::Byron,
    "Conway" => era_decode = Era::Conway,
    "Shelley MA" => era_decode = Era::Shelley,
    // This case should never happen
    _ => {}
  }
  match res_cbor {
    Ok(cbor) => {
      let res_mtx = MultiEraTx::decode_for_era(era_decode, &cbor);
      match res_mtx {
        Ok(mtx) => Ok((create_cbor_structure(&mtx), validate(&mtx, context))),
        Err(e) => {
          let mut err = Section::new();
          err.error = Some(e.to_string());
          Err(err)
        }
      }
    }
    Err(e) => {
      let mut err = Section::new();
      err.error = Some(e.to_string());
      Err(err)
    }
  }
}
