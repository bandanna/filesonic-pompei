const Web3 = require("web3");
const web3 = new Web3(); // You don't need a provider here since we're only encoding data

const createProfileData = {
  to: "0x3740Ea52f5bBadde4c6aDe7aC324447611a2f1a7", // The recipient's address
  handle: "tomaff", // The profile handle (e.g., username)
  imageURI: "", // The image URI (e.g., IPFS hash)
  followModule: "0x0000000000000000000000000000000000000000", // The address of the followModule contract
  followModuleInitData: [], // The followModule initialization data (as a hex string)
  followNFTURI: "", // The followNFT URI (e.g., IPFS hash)
};

// Specify the struct's types and names
const structTypes = [
  "address",
  "string",
  "string",
  "address",
  "bytes",
  "string",
];

const encodedStruct = web3.eth.abi.encodeParameters(
  structTypes,
  Object.values(createProfileData)
);

console.log(encodedStruct);
