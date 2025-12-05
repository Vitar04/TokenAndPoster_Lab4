const Poster = artifacts.require("Poster");

module.exports = function (deployer) {
  deployer.deploy(
    Poster,
    "0x0000000000000000000000000000000000000000", // временно 0
    0                                             // порог 0
  );
};
