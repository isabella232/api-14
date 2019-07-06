import jointz from 'jointz';

export interface CipherParams {
  iv: string;
}

export interface KdfParams {
  salt: string;
  n: number;
  dklen: number;
  p: number;
  r: number;
}

export interface Crypto {
  cipher: string;
  cipherparams: CipherParams;
  ciphertext: string;
  kdf: string;
  kdfparams: KdfParams;
  mac: string;
}

export interface XEthers {
  client: string;
  gethFilename: string;
  mnemonicCounter: string;
  mnemonicCiphertext: string;
  version: string;
}

export interface EncryptedJson {
  address: string;
  id: string;
  version: number;
  Crypto: Crypto;
  'x-ethers'?: XEthers;
}

export const HexValidator = jointz.string().pattern(/^[a-fA-F0-9]+$/);
export const AddressHexOnlyValidator = HexValidator.minLength(40).maxLength(40);
export const SixteenByteHexValidator = HexValidator.minLength(32).maxLength(32);
export const ThirtyTwoByteHexValidator = HexValidator.minLength(64).maxLength(64);

export const XEthersValidator = jointz.object().keys({
  client: jointz.constant('ethers.js'),
  gethFilename: jointz.string(),
  mnemonicCounter: SixteenByteHexValidator,
  mnemonicCiphertet: SixteenByteHexValidator,
  version: jointz.constant('0.1')
}).requiredKeys('client', 'gethFilename', 'mnemonicCounter', 'mnemonicCiphertext', 'version');

export const CipherParamsValidator = jointz.object().keys({
  iv: SixteenByteHexValidator
}).requiredKeys('iv');

export const KdfParamsValidator = jointz.object().keys({
  salt: ThirtyTwoByteHexValidator,
  n: jointz.number().integer(),
  dklen: jointz.constant(32),
  p: jointz.number().integer(),
  r: jointz.number().integer()
}).requiredKeys('salt', 'n', 'p', 'r', 'dklen');

export const CryptoValidator = jointz.object().keys({
  cipher: jointz.constant('aes-128-ctr'),
  cipherparams: CipherParamsValidator,
  ciphertext: ThirtyTwoByteHexValidator,
  kdf: jointz.constant('scrypt'),
  kdfparams: KdfParamsValidator,
  mac: ThirtyTwoByteHexValidator
}).requiredKeys('cipher', 'cipherparams', 'ciphertext', 'kdf', 'kdfparams', 'mac');

export const EncryptedJsonValidator = jointz.object().keys({
  address: AddressHexOnlyValidator,
  id: jointz.string().uuid(),
  version: jointz.constant(3),
  Crypto: CryptoValidator,
  'x-ethers': XEthersValidator
}).requiredKeys('address', 'id', 'version', 'Crypto');