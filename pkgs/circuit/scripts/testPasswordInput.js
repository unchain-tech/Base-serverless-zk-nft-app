const circomlib = require('circomlibjs');
const crypto = require('crypto');

// Function to convert a string password to a valid secret for the circuit
function passwordToSecret(password) {
  // Convert password string to bytes
  const passwordBytes = Buffer.from(password, 'utf8');
  
  // Take SHA256 hash to get a fixed-length output
  const hash = crypto.createHash('sha256').update(passwordBytes).digest();
  
  // Convert to BigInt but ensure it's within field bounds
  // BN128 field prime: 21888242871839275222246405745257275088548364400416034343698204186575808495617
  const fieldPrime = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
  let secret = BigInt('0x' + hash.toString('hex'));
  
  // Ensure the secret is within the field
  secret = secret % fieldPrime;
  
  return secret;
}

// Pedersen hash function for the circuit
const pedersenHash = async (data) => {
  const babyJub = await circomlib.buildBabyjub();
  const pedersenHasher = await circomlib.buildPedersenHash();
  
  // Convert BigInt to bytes array (248 bits = 31 bytes)
  let dataBytes;
  if (typeof data === 'bigint') {
    // Convert BigInt to 31 bytes (248 bits)
    const hex = data.toString(16).padStart(62, '0'); // 31 bytes = 62 hex chars
    dataBytes = new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  } else {
    throw new Error('Data must be BigInt');
  }
  
  const hash = await pedersenHasher.hash(dataBytes);
  const point = babyJub.unpackPoint(hash);
  return point[0];
};

async function generateInputForPassword(password) {
  console.log(`\n=== Generating input for password: "${password}" ===`);
  
  // Step 1: Convert password to secret
  const secret = passwordToSecret(password);
  console.log('Secret (BigInt):', secret.toString());
  console.log('Secret (hex):', '0x' + secret.toString(16));
  
  // Step 2: Calculate Pedersen hash
  const hash = await pedersenHash(secret);
  
  // Convert hash to BigInt
  let hashBigInt;
  if (hash instanceof Uint8Array) {
    const hexString = '0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
    hashBigInt = BigInt(hexString);
  } else {
    hashBigInt = BigInt(hash.toString());
  }
  
  console.log('Secret Hash:', hashBigInt.toString());
  
  // Step 3: Generate the input JSON
  const input = {
    secret: secret.toString(),
    secretHash: hashBigInt.toString()
  };
  
  console.log('Input JSON:', JSON.stringify(input, null, 2));
  
  return input;
}

async function main() {
  try {
    // Test with different passwords
    const passwords = ['web3', 'test', 'mypassword', 'hello'];
    
    for (const password of passwords) {
      const input = await generateInputForPassword(password);
      
      // Save to file for testing
      const fs = require('fs');
      const filename = `./data/input_${password}.json`;
      fs.writeFileSync(filename, JSON.stringify(input, null, 2));
      console.log(`Saved to: ${filename}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
