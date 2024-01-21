use super::Section;
use pallas::ledger::traverse::{MultiEraBlock, MultiEraTx};

fn block_tx(tx: &MultiEraTx<'_>) -> Section {
  Section::new()
    .with_topic("block_tx")
    .with_bytes(tx.encode().as_slice())
    .with_attr("tx_hash", tx.hash())
}

pub fn parse(raw: String) -> Result<Section, Section> {
  let out = Section::new().with_topic("cbor_parse").try_build_child(|| {
    let cbor = hex::decode(raw)?;
    let block = MultiEraBlock::decode(&cbor)?;

    let child = Section::new()
      .with_topic("block")
      .build_child(|| {
        Section::new()
          .with_topic("block_header")
          .with_attr("era", block.era())
          .with_attr("slot", block.slot())
          .with_attr("hash", block.hash())
      })
      .build_child(|| {
        Section::new()
          .with_topic("block_body")
          .collect_children(block.txs().iter().map(block_tx))
      });

    Ok(child)
  });

  Ok(out)
}
