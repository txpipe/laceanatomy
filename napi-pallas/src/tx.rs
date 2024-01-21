use super::Section;
use pallas::{
  crypto::hash::Hasher,
  ledger::{
    primitives::{alonzo::json, conway::Metadatum},
    traverse::MultiEraTx,
  },
};

fn tx_inputs_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("tx_inputs")
    .collect_children(tx.inputs().iter().map(|i| {
      Section::new()
        .with_topic("input")
        .with_attr("tx_input_hash", i.hash())
        .with_attr("tx_input_index", i.index())
    }))
}

fn tx_outputs_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("tx_outputs")
    .collect_children(tx.outputs().iter().map(|o| {
      Section::new()
        .with_topic("output")
        .with_bytes(&o.encode())
        .with_attr("tx_output_address", o.address().unwrap())
        .with_attr("tx_output_lovelace", o.lovelace_amount())
    }))
}

fn print_metadatum(datum: &Metadatum) -> String {
  match datum {
    Metadatum::Int(x) => x.to_string(),
    Metadatum::Bytes(x) => hex::encode(x.as_slice()),
    Metadatum::Text(x) => x.to_owned(),
    Metadatum::Array(x) => "[Array]".to_string(),
    Metadatum::Map(x) => "[Map]".to_string(),
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

fn tx_witnesses_section(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("tx_witnesses")
    .collect_children(tx.vkey_witnesses().iter().map(|o| {
      Section::new()
        .with_topic("vkey_witness")
        .with_attr("vkey_witness_key", hex::encode(o.vkey.as_slice()))
        .with_attr(
          "vkey_witness_key_hash",
          hex::encode(Hasher::<224>::hash(o.vkey.as_slice())),
        )
        .with_attr(
          "vkey_witness_signature",
          hex::encode(o.signature.as_slice()),
        )
    }))
}

pub fn parse(raw: String) -> Result<Section, Section> {
  let out = Section::new().with_topic("cbor_parse").try_build_child(|| {
    let cbor = hex::decode(raw)?;
    let tx = MultiEraTx::decode(&cbor)?;

    let child = Section::new()
      .with_topic("tx")
      .with_attr("era", tx.era())
      .with_maybe_attr("fee", tx.fee())
      .with_maybe_attr("ttl", tx.ttl())
      .build_child(|| tx_inputs_section(&tx))
      .build_child(|| tx_outputs_section(&tx))
      .build_child(|| tx_metadata_section(&tx))
      .build_child(|| tx_witnesses_section(&tx));

    Ok(child)
  });

  Ok(out)
}
