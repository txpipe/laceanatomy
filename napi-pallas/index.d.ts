/* tslint:disable */
/* eslint-disable */

/* auto-generated by NAPI-RS */

export interface ShelleyPart {
  isScript: boolean
  hash?: string
  pointer?: string
}
export interface AddressDiagnostic {
  kind: string
  network?: string
  paymentPart?: ShelleyPart
  delegationPart?: ShelleyPart
  byronCbor?: string
}
export interface Output {
  error?: string
  bytes?: string
  address?: AddressDiagnostic
}
export interface ValidationContext {
  epoch: number
  minFeeA: number
  minFeeB: number
  maxBlockSize: number
  maxTxSize: number
  maxBlockHeaderSize: number
  keyDeposit: number
  poolDeposit: number
  eMax: number
  nOpt: number
  a0Numerator: number
  a0Denominator: number
  rhoNumerator: number
  rhoDenominator: number
  tauNumerator: number
  tauDenominator: number
  decentralisationParamNumerator: number
  decentralisationParamDenominator: number
  extraEntropyNumerator: number
  extraEntropyDenominator: number
  protocolMajorVer: number
  protocolMinorVer: number
  minUtxo: number
  minPoolCost: number
  priceMemNumerator: number
  priceMemDenominator: number
  priceStepNumerator: number
  priceStepDenominator: number
  maxTxExMem: number
  maxTxExSteps: number
  maxBlockExMem: number
  maxBlockExSteps: number
  maxValSize: number
  collateralPercent: number
  maxCollateralInputs: number
  coinsPerUtxoSize: number
  coinsPerUtxoWord: number
  network: string
  era: string
  blockSlot: number
}
export interface Attribute {
  topic?: string
  value?: string
}
export interface Section {
  topic?: string
  identity?: string
  error?: string
  attributes: Array<Attribute>
  bytes?: string
  children: Array<Section>
}
export function parseAddress(raw: string): Output
export interface SectionValidation {
  section: Section
  validations: Validations
}
export function safeParseTx(raw: string, context: ValidationContext): SectionValidation
export function safeParseBlock(raw: string): Section
export interface Validation {
  name: string
  value: boolean
  description: string
}
export interface Validations {
  validations: Array<Validation>
  era: string
}
