const { assert } = require("chai");
const Token = artifacts.require("Token");
const Poster = artifacts.require("Poster");

const THRESHOLD = 10; // порог токенов

contract("Poster", (accounts) => {
  const creator = accounts[0];
  const malicious = accounts[1];

  it("post ok", async () => {
    // 1. Деплой тестового токена из ЛР3
    const tokenInstance = await Token.new("TestToken", "TTKN", 100, { from: creator });

    // 2. Деплой Poster с адресом токена и порогом
    const posterInstance = await Poster.new(tokenInstance.address, THRESHOLD, { from: creator });

    // 3. Проверяем баланс Token у создателя
    assert.equal(await tokenInstance.balanceOf(creator).then(BigInt), 100n);

    // 4. Проверяем события до вызова post
    const eventsBefore = await posterInstance.getPastEvents("NewPost");
    assert.deepEqual(eventsBefore, []);

    // 5. Публикуем пост
    const content = "Hello, world!";
    const tag = "hello";
    await posterInstance.post(content, tag, { from: creator });

    // 6. Проверяем события после post
    const eventsAfter = await posterInstance.getPastEvents("NewPost");
    assert.equal(eventsAfter.length, 1);

    const postedEvent = eventsAfter[0];
    assert.equal(postedEvent.args.user, creator);
    assert.equal(postedEvent.args.content, content);
    assert.equal(postedEvent.args.tag, web3.utils.keccak256(tag));
  });

  it("not enough tokens", async () => {
    const tokenInstance = await Token.new("TestToken", "TTKN", 100, { from: creator });
    const posterInstance = await Poster.new(tokenInstance.address, THRESHOLD, { from: creator });

    // Балансы
    assert.equal(await tokenInstance.balanceOf(creator).then(BigInt), 100n);
    assert.equal(await tokenInstance.balanceOf(malicious).then(BigInt), 0n);

    const content = "Hello, world!";
    const tag = "hello";

    // Ожидаем ошибку при постинге с недостаточным балансом
    try {
      await posterInstance.post(content, tag, { from: malicious });
      assert.fail("Should throw");
    } catch (e) {
      assert.ok(e.message.includes("Not enough tokens"));
    }
  });
});
