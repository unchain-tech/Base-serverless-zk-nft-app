const circomlib = require('circomlibjs');
const crypto = require('crypto');

// ランダムなbigintを生成する関数（新しいAPI用）
const rbigint = (nbytes) => {
  const randomBytes = crypto.randomBytes(nbytes);
  return BigInt('0x' + randomBytes.toString('hex'));
};

// Pedersen hashを計算する関数（新しいAPI用）
const pedersenHash = async (data) => {
  const babyJub = await circomlib.buildBabyjub();
  const pedersenHasher = await circomlib.buildPedersenHash();
  
  // dataをUint8Arrayに変換
  let dataBytes;
  if (typeof data === 'bigint') {
    // BigIntを32バイトのUint8Arrayに変換
    const hex = data.toString(16).padStart(64, '0');
    dataBytes = new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  } else if (typeof data === 'string') {
    dataBytes = new TextEncoder().encode(data);
  } else {
    dataBytes = data;
  }
  
  const hash = await pedersenHasher.hash(dataBytes);
  const point = babyJub.unpackPoint(hash);
  return point[0];
};

const main = async () => {
  try {
    // const secret = rbigint(31);
    const secret = BigInt('0x' + Buffer.from("aaa", 'utf8').toString('hex'));
    console.log('Secret:', secret.toString());
    
    const hash = await pedersenHash(secret);
    
    // Uint8ArrayをBigIntに変換
    let hashBigInt;
    if (hash instanceof Uint8Array) {
      // Uint8Arrayを16進数文字列に変換してからBigIntに
      const hexString = '0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
      hashBigInt = BigInt(hexString);
    } else {
      hashBigInt = BigInt(hash.toString());
    }
    
    console.log('Hash:', hashBigInt.toString());
    
    console.log({secret: secret.toString(), hash: hashBigInt.toString()});
  } catch (error) {
    console.error('Error:', error);
  }
};

main();