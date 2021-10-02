/*
var SimpleStorage = artifacts.require("./SimpleStorage.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
};
*/

var Whitelist = artifacts.require("./Whitelist.sol");

module.exports = function(deployer) {
  deployer.deploy(Whitelist);
};