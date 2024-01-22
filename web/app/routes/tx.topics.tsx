import { TopicMeta, P1 } from "~/components";

const TOPICS: Record<string, TopicMeta> = {
  cbor_parse: {
    title: "Valid CBOR data",
    description: (
      <P1>Your HEX bytes were successfully decoded using the CBOR standard.</P1>
    ),
  },
  tx: {
    title: "A valid Cardano Transaction",
    description: (
      <P1>
        Your CBOR data was successfully interpreted as a Cardano transaction.
      </P1>
    ),
  },
  era: {
    title: "Era used for decoding",
    description: (
      <P1>
        Cardano transactions belong to specific eras. The structure of the
        transaction data is slightly different for each one. The tx payload
        doesn't have a specific tag to identify the era, this site uses try &
        error to attempt to decode the CBOR, starting from the most recent era
        and working are way back.
      </P1>
    ),
  },
  fee: {
    title: "Fee",
    description: (
      <P1>
        To execute a transaction, fees need to be paid to the protocol. Cardano
        transactions are deterministic, we can now in advance exactly how much
        fees need to be paid, even before submitting the tx. This is the amount
        of lovelace that this transaction is paying.
      </P1>
    ),
  },
  ttl: {
    title: "Time to live",
    description: (
      <P1>
        Some transactions specify the maximum slot where they remain valid. If a
        transaction isn't added to a block before the specified slot, it will
        not be considered valid by any node.
      </P1>
    ),
  },
  tx_inputs: {
    title: "Transaction Inputs",
    description: (
      <P1>
        These are the inputs of the transaction. These are outputs of previous
        transactions that are going to be "consumed" by this transaction. Note
        that instead of repeating data, inputs are expressed as pointers to the
        corresponding outputs.
      </P1>
    ),
  },
  tx_input_hash: {
    title: "input tx hash",
    description: (
      <P1>
        This is the hash of the existing tx (the id of the transaction) that
        holds the output that we're consuming on this current transaction.
      </P1>
    ),
  },
  tx_input_index: {
    title: "output index",
    description: (
      <P1>
        Since transactions can have multiple outputs, we need to know exactly
        which one we're consuming. This value represents the index of the output
        in the source tx.
      </P1>
    ),
  },
  tx_outputs: {
    title: "Transaction Outputs",
    description: (
      <P1>
        These are the outputs of the transaction, usually referred to as UTxO.
        Each item specifies a set of assets (ADA or other tokens) and the
        address that has control over them. These outputs can be used by future
        transaction.
      </P1>
    ),
  },
  output: {
    title: "Transaction Output",
  },
  tx_output_address: {
    title: "Address",
    description: (
      <P1>
        This is the address that has control over the assets in this output.
      </P1>
    ),
  },
  tx_output_lovelace: {
    title: "Lovelace amount (1/1000000 ADA)",
    description: (
      <P1>This is the amount of Lovelace contained in this output.</P1>
    ),
  },
  tx_metadata: {
    title: "Transaction Metadata",
    description: (
      <P1>
        This is extra data that can be attached to a transactions. It's
        generally used to annotate the transaction as reference for further
        processing, but it doesn't have any effect on the state of the ledger.
      </P1>
    ),
  },
  tx_witnesses: {
    title: "Transaction Witnesses",
    description: (
      <P1>
        This data presents evidence and values required for the protocol to
        assert the validity of the transaction.
      </P1>
    ),
  },
  vkey_witness: {
    title: "Verification Key Witness",
    description: (
      <P1>
        This is a type of witness that relies on a signature of the body of the
        transaction by a particular private key.
      </P1>
    ),
  },
  tx_datum: {
    title: "Transaction Datum",
    description: (
      <P1>
        A tx datum represents structured data that is attached to a specific tx
        output to be used as part of the validation script execution process.
      </P1>
    ),
  },
  tx_datum_hash: {
    title: "Datum Hash",
    description: (
      <P1>
        This is a hash of the datum to be used as identifier. Tx outputs
        reference datums by specifying the corresponding hash.
      </P1>
    ),
  },
  tx_datum_json: {
    title: "Datum JSON",
    description: (
      <P1>
        This is a JSON representation of the datum internal values. This isn't
        the real encoding, it's just a friendly visualization for us humans.
      </P1>
    ),
  },
  tx_reference_inputs: {
    title: "Reference Inputs",
    description: (
      <P1>
        This is a list of inputs that are referenced by this transaction but not
        consumed. These inputs are a read-only way to access values from
        existing UTxOs, allowing transactions to reuse scripts without having to
        repeat them in each required tx.
      </P1>
    ),
  },
  tx_mints: {
    title: "Transaction Mint",
    description: (
      <P1>
        This is a list of Cardano native tokens minted (or burned) by this
        transaction.
      </P1>
    ),
  },
};

export default TOPICS;
