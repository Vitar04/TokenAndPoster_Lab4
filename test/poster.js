const Poster = artifacts.require("Poster");

contract("Poster", accounts => {
  it("creates and reads a post", async () => {
    const instance = await Poster.deployed();

    const content = "Hello blockchain!";
    const tag = "test";

    const tx = await instance.post(content, tag, { from: accounts[0] });

    // Проверяем событие
    const event = tx.logs[0];
    assert.equal(event.event, "NewPost");
    assert.equal(event.args.user, accounts[0]);
    assert.equal(event.args.content, content);

    // Проверяем сам пост
    const id = event.args.id;
    const post = await instance.getPost(id);

    assert.equal(post.content, content);
    assert.equal(post.tag, tag);
  });
});
