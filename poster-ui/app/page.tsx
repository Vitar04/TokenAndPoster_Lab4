// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Web3 from "web3";

export default function Page() {
  const [web3, setWeb3] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [abi, setAbi] = useState<any | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [loading, setLoading] = useState(false);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

  useEffect(() => {
    // загрузка ABI из public/Poster.json
    fetch("/Poster.json")
      .then((r) => r.json())
      .then((j) => setAbi(j.abi))
      .catch((e) => console.error("Can't load ABI:", e));
  }, []);

  useEffect(() => {
    if (!abi) return;
    if (typeof window === "undefined" || !("ethereum" in window)) {
      console.warn("MetaMask (window.ethereum) not found");
      return;
    }
    const w3 = new Web3((window as any).ethereum);
    setWeb3(w3);
    setContract(new w3.eth.Contract(abi, CONTRACT_ADDRESS));
  }, [abi, CONTRACT_ADDRESS]);

  const handleConnect = async () => {
    if (!("ethereum" in window)) return alert("Install MetaMask");
    try {
      const [addr] = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      setAccount(addr);
      // (re)create web3 & contract using injected provider
      const w3 = new Web3((window as any).ethereum);
      setWeb3(w3);
      setContract(new w3.eth.Contract(abi, CONTRACT_ADDRESS));
      loadPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const loadPosts = async (filter = "") => {
    if (!contract || !web3) return;
    setLoading(true);
    try {
      let options: any = { fromBlock: 0, toBlock: "latest" };
      if (filter) {
        // попытка фильтрации по индексированному тегу
        try {
          options.filter = { tag: web3.utils.keccak256(filter) };
        } catch {}
      }
      const events = await contract.getPastEvents("NewPost", options);
      const arr = await Promise.all(
        events.map(async (ev: any, idx: number) => {
          const rv = ev.returnValues ?? {};
          const contentVal = rv.content ?? rv[1] ?? "";
          const tagVal = rv.tag ?? rv[2] ?? "";
          let timestamp = null;
          try {
            const block = await web3.eth.getBlock(ev.blockNumber);
            timestamp = block?.timestamp ?? null;
          } catch {}
          return {
            id: rv.id ?? rv[0] ?? idx,
            content: contentVal,
            tag: tagVal,
            user: rv.user ?? null,
            txHash: ev.transactionHash,
            blockNumber: ev.blockNumber,
            timestamp,
          };
        })
      );
      arr.sort((a: any, b: any) => (a.blockNumber || 0) - (b.blockNumber || 0));
      setPosts(arr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!contract || !account) return alert("Connect wallet first");
    if (!content) return alert("Enter content");
    setLoading(true);
    try {
      await contract.methods.post(content, tag).send({ from: account });
      await loadPosts(filterTag);
      setContent("");
      setTag("");
    } catch (e) {
      console.error(e);
      alert("Tx failed: " + (e as any).message ?? e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Poster dApp (Sepolia)</h1>

      <div>
        <button onClick={handleConnect}>
          {account ? `Connected ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect MetaMask"}
        </button>
      </div>

      <section style={{ border: "1px solid #ddd", padding: 12, marginTop: 12 }}>
        <h3>Create post</h3>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} style={{ width: "100%" }} />
        <div style={{ marginTop: 8 }}>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" />
          <button onClick={handlePost} disabled={!account || loading} style={{ marginLeft: 8 }}>
            Post
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 12, marginTop: 12 }}>
        <h3>Filter</h3>
        <input value={filterTag} onChange={(e) => setFilterTag(e.target.value)} placeholder="Tag" />
        <button onClick={() => loadPosts(filterTag)} style={{ marginLeft: 8 }}>
          Apply
        </button>
        <button
          onClick={() => {
            setFilterTag("");
            loadPosts("");
          }}
          style={{ marginLeft: 8 }}
        >
          Clear
        </button>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Posts {loading ? "(loading...)" : `(${posts.length})`}</h2>
        {posts.length === 0 && <div>No posts</div>}
        {posts.map((p) => (
          <div key={p.txHash} style={{ borderBottom: "1px solid #eee", padding: 12 }}>
            <div><strong>Content:</strong> {p.content}</div>
            <div><strong>Tag:</strong> {String(p.tag)}</div>
            <div><strong>Author:</strong> {p.user}</div>
            <div>
              <strong>Tx:</strong>{" "}
              <a href={`${process.env.NEXT_PUBLIC_ETHERSCAN_PREFIX}${p.txHash}`} target="_blank" rel="noreferrer">
                {p.txHash.slice(0, 10)}...
              </a>
            </div>
            <div><small>Block: {p.blockNumber} {p.timestamp ? `— ${new Date(p.timestamp * 1000).toLocaleString()}` : ""}</small></div>
          </div>
        ))}
      </section>
    </main>
  );
}
