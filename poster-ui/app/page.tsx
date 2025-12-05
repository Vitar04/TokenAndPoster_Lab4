"use client";

import React, { useEffect, useState } from "react";
import Web3 from "web3";

// Полный ABI токена HELLO из ЛР3
const HELLO_TOKEN_ABI = [
  {
    inputs: [
      { internalType: "string", name: "name_", type: "string" },
      { internalType: "string", name: "symbol_", type: "string" },
      { internalType: "uint256", name: "_totalSupply", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "spender", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "owner_", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

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

  // token-gating состояние
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [threshold, setThreshold] = useState<string>("0");
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [tokenSymbol, setTokenSymbol] = useState<string>("HELLO");
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
  const ETHERSCAN_PREFIX =
    process.env.NEXT_PUBLIC_ETHERSCAN_PREFIX ?? "https://sepolia.etherscan.io/tx/";

  // загрузка ABI Poster
  useEffect(() => {
    fetch("/Poster.json")
      .then((r) => r.json())
      .then((j) => setAbi(j.abi))
      .catch((e) => console.error("Can't load ABI:", e));
  }, []);

  // инициализация Web3 + Poster
  useEffect(() => {
    if (!abi) return;
    if (typeof window === "undefined" || !(window as any).ethereum) {
      console.warn("MetaMask (window.ethereum) not found");
      return;
    }
    const w3 = new Web3((window as any).ethereum);
    setWeb3(w3);
    setContract(new w3.eth.Contract(abi, CONTRACT_ADDRESS));
  }, [abi, CONTRACT_ADDRESS]);

  const handleConnect = async () => {
    if (!(window as any).ethereum) return alert("Install MetaMask");
    try {
      const [addr] = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(addr);

      const w3 = new Web3((window as any).ethereum);
      setWeb3(w3);
      setContract(new w3.eth.Contract(abi, CONTRACT_ADDRESS));

      await Promise.all([loadPosts(filterTag, w3), refreshTokenInfo(w3, addr)]);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshTokenInfo = async (w3: any, addr: string) => {
    if (!contract || !w3) return;
    try {
      const tAddr = await contract.methods.tokenAddress().call();
      const thr = await contract.methods.threshold().call();

      setTokenAddress(tAddr);
      setThreshold(thr);

      if (!tAddr || tAddr === "0x0000000000000000000000000000000000000000") {
        setTokenBalance("0");
        setHasAccess(false);
        return;
      }

      const token = new w3.eth.Contract(HELLO_TOKEN_ABI as any, tAddr);

      const [rawBalance, decimals, symbol] = await Promise.all([
        token.methods.balanceOf(addr).call(),
        token.methods
          .decimals()
          .call()
          .catch(() => 18),
        token.methods
          .symbol()
          .call()
          .catch(() => "HELLO"),
      ]);

      setTokenBalance(rawBalance.toString());
      setTokenSymbol(symbol);

      const bnBalance = BigInt(rawBalance.toString());
      const bnThreshold = BigInt(thr.toString());
      setHasAccess(bnBalance >= bnThreshold);
    } catch (e) {
      console.error("Failed to load token-gating info:", e);
      setHasAccess(false);
    }
  };

  // загрузка и клиентский фильтр по тегу
  const loadPosts = async (filter = "", w3Override?: any) => {
    const w3 = w3Override || web3;
    if (!contract || !w3) return;
    setLoading(true);
    try {
      const options: any = { fromBlock: 0, toBlock: "latest" };
      const events = await contract.getPastEvents("NewPost", options);

      const arr = await Promise.all(
        events.map(async (ev: any, idx: number) => {
          const rv = ev.returnValues ?? {};
          const contentVal = rv.content ?? rv[1] ?? "";
          const tagVal = rv.tag ?? rv[2] ?? "";
          let timestamp: number | null = null;
          try {
            const block = await w3.eth.getBlock(ev.blockNumber);
            if (block?.timestamp != null) {
              timestamp = Number(block.timestamp);
            }
          } catch {}
          return {
            id: rv.id ?? rv[0] ?? idx,
            content: contentVal,
            // хеш тега в строковом виде
            tag:
              typeof tagVal === "string"
                ? tagVal
                : tagVal != null
                ? String(tagVal)
                : "",
            user: rv.user ?? null,
            txHash: ev.transactionHash,
            blockNumber: ev.blockNumber,
            timestamp,
          };
        })
      );

      // если задан filterTag — фильтруем по keccak256(filterTag) == tag (bytes32)
      let filtered = arr;
      if (filter && w3.utils?.keccak256) {
        try {
          const filterHash = w3.utils.keccak256(filter);
          filtered = arr.filter((p: any) => {
            const tagStr = String(p.tag || "");
            return tagStr.toLowerCase() === filterHash.toLowerCase();
          });
        } catch (e) {
          console.error("Filter hash error:", e);
        }
      }

      // сортировка по номеру блока
      filtered.sort((a: any, b: any) => {
        const ab = a.blockNumber != null ? Number(a.blockNumber) : 0;
        const bb = b.blockNumber != null ? Number(b.blockNumber) : 0;
        return ab - bb;
      });

      setPosts(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!contract || !account) return alert("Connect wallet first");
    if (!content) return alert("Enter content");

    if (!hasAccess) {
      alert("Недостаточно токенов HELLO для публикации (token-gating).");
      return;
    }

    setLoading(true);
    try {
      await contract.methods.post(content, tag).send({ from: account });
      await loadPosts(filterTag);
      await refreshTokenInfo(web3, account);
      setContent("");
      setTag("");
    } catch (e: any) {
      console.error(e);
      alert("Tx failed: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (raw: string) => {
    if (!web3) return raw;
    try {
      return web3.utils.fromWei(raw, "ether");
    } catch {
      return raw;
    }
  };

  return (
    <main className="app-root">
      <div className="app-container">
        <header className="app-header">
          <div>
            <h1 className="app-title">Poster dApp</h1>
            <p className="app-subtitle">
              Sepolia · token-gated доступ по токену HELLO
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleConnect}>
            {account
              ? `Connected ${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect MetaMask"}
          </button>
        </header>

        <section className="card">
          <div className="card-header">
            <h2>Token-gating статус</h2>
          </div>
          <div className="card-body">
            <p>
              <strong>Token address:</strong>{" "}
              <span className="mono">
                {tokenAddress || "(not set — спросите владельца контракта)"}
              </span>
            </p>
            <p>
              <strong>Threshold:</strong>{" "}
              {formatAmount(threshold)} {tokenSymbol}
            </p>
            <p>
              <strong>Your balance:</strong>{" "}
              {formatAmount(tokenBalance)} {tokenSymbol}
            </p>
            <p>
              Статус доступа:{" "}
              <span className={`badge ${hasAccess ? "badge-ok" : "badge-bad"}`}>
                {hasAccess ? "можно постить" : "недостаточно токенов"}
              </span>
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Создать пост</h2>
          </div>
          <div className="card-body">
            <textarea
              className="input textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Введите текст поста..."
            />
            <div className="row mt-8">
              <input
                className="input"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag (например, hello)"
              />
              <button
                className="btn btn-success ml-8"
                onClick={handlePost}
                disabled={!account || loading}
              >
                {loading ? "Sending..." : "Post"}
              </button>
            </div>
            {!hasAccess && (
              <p className="hint">
                Для публикации нужно обладать балансом ≥ 10 {tokenSymbol}.
              </p>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Фильтр по тегу</h2>
          </div>
          <div className="card-body row">
            <input
              className="input"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              placeholder="Tag для фильтрации (например, Test)"
            />
            <button
              className="btn btn-secondary ml-8"
              onClick={() => loadPosts(filterTag)}
            >
              Apply
            </button>
            <button
              className="btn btn-ghost ml-8"
              onClick={() => {
                setFilterTag("");
                loadPosts("");
              }}
            >
              Clear
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>
              Посты {loading ? "(loading...)" : `(${posts.length})`}
            </h2>
          </div>
          <div className="card-body">
            {posts.length === 0 && <div className="empty">Нет постов</div>}
            {posts.map((p) => (
              <div key={p.txHash} className="post-item">
                <div className="post-tag">
                  <div>
                    {filterTag ? (
                      <>
                        <span className="post-tag-text">
                          Tag: {filterTag}
                        </span>
                        <span className="post-tag-hash mono">
                          {" "}
                          (hash: {String(p.tag)})
                        </span>
                      </>
                    ) : (
                      <span className="post-tag-hash mono">
                        Tag hash: {String(p.tag)}
                      </span>
                    )}
                  </div>
                  <span className="post-author">
                    {p.user
                      ? `${p.user.slice(0, 6)}...${p.user.slice(-4)}`
                      : "unknown"}
                  </span>
                </div>
                <div className="post-content">{p.content}</div>
                <div className="post-meta">
                  <span>
                    Block: {p.blockNumber}{" "}
                    {p.timestamp
                      ? `— ${new Date(
                          Number(p.timestamp) * 1000
                        ).toLocaleString()}`
                      : ""}
                  </span>
                  <span>
                    Tx:{" "}
                    <a
                      href={`${ETHERSCAN_PREFIX}${p.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {p.txHash.slice(0, 10)}...
                    </a>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
