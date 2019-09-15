import jointz, { ExtractResultType } from 'jointz';

export type Crypto = ExtractResultType<typeof CryptoValidator>;
export type EncryptedJson = ExtractResultType<typeof EncryptedJsonValidator>;

export const HexValidator = jointz.string().pattern(/^[a-fA-F0-9]+$/);
export const AddressHexOnlyValidator = HexValidator.minLength(40).maxLength(40);
export const SixteenByteHexValidator = HexValidator.minLength(32).maxLength(32);
export const ThirtyTwoByteHexValidator = HexValidator.minLength(64).maxLength(64);

export const XEthersValidator = jointz.object({
  client: jointz.constant('ethers.js'),
  gethFilename: jointz.string(),
  mnemonicCounter: SixteenByteHexValidator,
  mnemonicCiphertext: SixteenByteHexValidator,
  version: jointz.constant('0.1')
}).requiredKeys('client', 'gethFilename', 'mnemonicCounter', 'mnemonicCiphertext', 'version')
  .allowUnknownKeys(true);

export const CipherParamsValidator = jointz.object({
  iv: SixteenByteHexValidator
}).requiredKeys('iv')
  .allowUnknownKeys(true);

export const KdfParamsValidator = jointz.object({
  salt: ThirtyTwoByteHexValidator,
  n: jointz.number().integer(),
  dklen: jointz.constant(32),
  p: jointz.number().integer(),
  r: jointz.number().integer()
}).requiredKeys('salt', 'n', 'p', 'r', 'dklen')
  .allowUnknownKeys(true);

export const CryptoValidator = jointz.object({
  cipher: jointz.constant('aes-128-ctr'),
  cipherparams: CipherParamsValidator,
  ciphertext: ThirtyTwoByteHexValidator,
  kdf: jointz.constant('scrypt'),
  kdfparams: KdfParamsValidator,
  mac: ThirtyTwoByteHexValidator
}).requiredKeys('cipher', 'cipherparams', 'ciphertext', 'kdf', 'kdfparams', 'mac')
  .allowUnknownKeys(true);

export const EncryptedJsonValidator = jointz.object({
  address: AddressHexOnlyValidator,
  id: jointz.string().uuid(),
  version: jointz.constant(3),
  Crypto: CryptoValidator,
  'x-ethers': XEthersValidator
}).requiredKeys('address', 'id', 'version', 'Crypto')
  .allowUnknownKeys(true);