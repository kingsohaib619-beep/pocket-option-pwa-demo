"use client";

import { useEffect, useMemo, useState } from "react";

type Trade = {
  time: string;
  side: "BUY" | "SELL";
  amount: number;
  result: "WIN" | "LOSS" | "PENDING";
};

type BackendResponse = {
  ok?: boolean;
  connected?: boolean;
  account?: string;
  balance?: number;
  detail?: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function Home() {
  const [ssid, setSsid] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState("");

  const [auto, setAuto] = useState(false);
  const [pair, setPair] = useState("EUR/USD");
  const [duration, setDuration] = useState("5m");
  const [amount, setAmount] = useState(1);

  const [signal, setSignal] =
    useState<"BUY" | "SELL" | "WAIT">("WAIT");

  const [price, setPrice] = useState(1.0842);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState("dashboard");

  /*
   * Demo visual feed.
   *
   * IMPORTANT:
   * This price is still a visual placeholder.
   * It is NOT Pocket Option market data yet.
   */
  useEffect(() => {
    const id = setInterval(() => {
      setPrice((p) =>
        +(p + (Math.random() - 0.5) * 0.00025).toFixed(5)
      );

      if (connected) {
        const r = Math.random();

        setSignal(
          r > 0.58
            ? "BUY"
            : r < 0.42
              ? "SELL"
              : "WAIT"
        );
      }
    }, 1200);

    return () => clearInterval(id);
  }, [connected]);

  const stats = useMemo(() => {
    const done = trades.filter(
      (t) => t.result !== "PENDING"
    );

    const wins = done.filter(
      (t) => t.result === "WIN"
    ).length;

    return {
      wins,
      losses: done.length - wins,
      rate: done.length
        ? Math.round((wins / done.length) * 100)
        : 0,
    };
  }, [trades]);

  /*
   * REAL BACKEND CONNECTION
   *
   * This replaces the old fake:
   * setConnected(true)
   */
  async function connect() {
    if (!ssid.trim()) {
      setConnectionError("أدخل SSID لحساب Demo.");
      return;
    }

    if (!BACKEND_URL) {
      setConnectionError(
        "لم يتم إعداد NEXT_PUBLIC_BACKEND_URL في Vercel."
      );
      return;
    }

    setConnecting(true);
    setConnectionError("");
    setConnected(false);
    setBalance(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/connect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ssid: ssid.trim(),
          }),
        }
      );

      const data: BackendResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "فشل الاتصال بحساب Demo."
        );
      }

      if (data.account !== "DEMO") {
        throw new Error(
          "تم رفض الاتصال: الحساب ليس Demo."
        );
      }

      setConnected(true);

      if (
        typeof data.balance === "number" &&
        Number.isFinite(data.balance)
      ) {
        setBalance(data.balance);
      } else {
        setBalance(null);
      }

    } catch (error) {
      setConnected(false);
      setBalance(null);

      setConnectionError(
        error instanceof Error
          ? error.message
          : "تعذر الاتصال بحساب Demo."
      );
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (!BACKEND_URL) {
      setConnected(false);
      setBalance(null);
      return;
    }

    try {
      await fetch(
        `${BACKEND_URL}/disconnect`,
        {
          method: "POST",
        }
      );
    } catch {
      // Ignore disconnect network errors.
    } finally {
      setConnected(false);
      setBalance(null);
      setConnectionError("");
      setAuto(false);
    }
  }

  /*
   * BUY / SELL are intentionally disabled from
   * real Pocket Option execution for now.
   *
   * We will replace this with the real Demo
   * trade endpoint after authentication and
   * balance retrieval are confirmed.
   */
  function openDemo(side: "BUY" | "SELL") {
    if (!connected) {
      setConnectionError(
        "اتصل بحساب Demo أولًا."
      );
      return;
    }

    const win = Math.random() > 0.35;

    const result: Trade["result"] =
      win ? "WIN" : "LOSS";

    setTrades((t) =>
      [
        {
          time: new Date().toLocaleTimeString(),
          side,
          amount,
          result,
        },
        ...t,
      ].slice(0, 20)
    );
  }

  return (
    <main>
      <header className="top">
        <div>
          <b>PO BOT PRO</b>

          <span
            className={
              connected ? "ok" : "off"
            }
          >
            ●{" "}
            {connecting
              ? "Connecting..."
              : connected
                ? "Connected"
                : "Demo Offline"}
          </span>
        </div>

        <button
          className="icon"
          onClick={() =>
            setTab("settings")
          }
        >
          ⚙
        </button>
      </header>

      {tab === "settings" ? (
        <section className="panel">
          <h2>Demo Connection</h2>

          <p className="muted">
            أدخل SSID لحساب Pocket Option Demo.
            لا تضع SSID في GitHub.
          </p>

          <input
            value={ssid}
            onChange={(e) =>
              setSsid(e.target.value)
            }
            placeholder="SSID..."
            type="password"
            autoComplete="off"
            disabled={connecting}
          />

          {!connected ? (
            <button
              className="primary"
              onClick={connect}
              disabled={connecting}
            >
              {connecting
                ? "CONNECTING..."
                : "CONNECT DEMO"}
            </button>
          ) : (
            <button
              className="secondary"
              onClick={disconnect}
            >
              DISCONNECT
            </button>
          )}

          {connected && (
            <div className="notice">
              <b>🟢 Demo Connected</b>

              <br />

              <span>
                Account: DEMO
              </span>

              <br />

              <span>
                Balance:{" "}
                {balance !== null
                  ? `$${balance.toFixed(2)}`
                  : "Loading..."}
              </span>
            </div>
          )}

          {connectionError && (
            <div
              className="notice"
              style={{
                borderColor:
                  "rgba(255,80,80,.45)",
              }}
            >
              ❌ {connectionError}
            </div>
          )}

          <div className="notice">
            <b>DEMO ONLY</b>
            <br />
            هذه المرحلة مخصصة للتحقق من اتصال
            حساب Demo وقراءة الرصيد فقط.
            لا يتم إرسال BUY أو SELL إلى
            Pocket Option حتى نكمل اختبار
            المصادقة بنجاح.
          </div>

          <button
            className="secondary"
            onClick={() =>
              setTab("dashboard")
            }
          >
            ← Dashboard
          </button>
        </section>
      ) : (
        <>
          <section className="controls">
            <select
              value={pair}
              onChange={(e) =>
                setPair(e.target.value)
              }
            >
              <option>EUR/USD</option>
              <option>GBP/USD</option>
              <option>USD/JPY</option>
              <option>EUR/JPY</option>
            </select>

            <select
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value)
              }
            >
              <option>1m</option>
              <option>5m</option>
              <option>15m</option>
            </select>

            <input
              type="number"
              min="0.1"
              step="0.1"
              value={amount}
              onChange={(e) =>
                setAmount(
                  Number(e.target.value)
                )
              }
            />
          </section>

          {connected && (
            <section className="card">
              <div className="chartHead">
                <span>DEMO BALANCE</span>

                <strong>
                  {balance !== null
                    ? `$${balance.toFixed(2)}`
                    : "--"}
                </strong>
              </div>
            </section>
          )}

          <section className="card chart">
            <div className="chartHead">
              <span>{pair}</span>

              <strong>
                {price.toFixed(5)}
              </strong>
            </div>

            <div className="candles">
              {Array.from({
                length: 32,
              }).map((_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${
                      20 +
                      Math.random() * 75
                    }%`,
                  }}
                />
              ))}
            </div>

            <div className="chartFoot">
              EMA 9 · EMA 21 · RSI · Demo feed
            </div>
          </section>

          <section className="signal">
            <small>SIGNAL</small>

            <h1
              className={signal.toLowerCase()}
            >
              {signal}
            </h1>

            <div className="checks">
              <span>EMA ✓</span>
              <span>RSI ✓</span>
              <span>Trend ✓</span>
            </div>
          </section>

          <section className="actions">
            <button
              className="buy"
              onClick={() =>
                openDemo("BUY")
              }
              disabled={!connected}
            >
              ▲ BUY
            </button>

            <button
              className="sell"
              onClick={() =>
                openDemo("SELL")
              }
              disabled={!connected}
            >
              ▼ SELL
            </button>
          </section>

          <section className="auto card">
            <div>
              <b>AUTO TRADING</b>

              <span>
                {auto
                  ? "Strategy armed"
                  : "Manual / Paper mode"}
              </span>
            </div>

            <button
              className={
                auto
                  ? "toggle on"
                  : "toggle"
              }
              onClick={() =>
                setAuto(!auto)
              }
              disabled={!connected}
            >
              <i />
            </button>
          </section>

          <section className="stats card">
            <div>
              <b>{stats.wins}</b>
              <span>Wins</span>
            </div>

            <div>
              <b>{stats.losses}</b>
              <span>Losses</span>
            </div>

            <div>
              <b>{stats.rate}%</b>
              <span>Win Rate</span>
            </div>
          </section>

          <section className="card history">
            <h3>Recent Trades</h3>

            {trades.length === 0 ? (
              <p className="muted">
                No demo trades yet.
              </p>
            ) : (
              trades.map((t, i) => (
                <div
                  className="trade"
                  key={i}
                >
                  <span>{t.time}</span>

                  <b
                    className={
                      t.side === "BUY"
                        ? "buytxt"
                        : "selltxt"
                    }
                  >
                    {t.side}
                  </b>

                  <span>
                    ${t.amount.toFixed(2)}
                  </span>

                  <strong
                    className={
                      t.result === "WIN"
                        ? "wintxt"
                        : "losstxt"
                    }
                  >
                    {t.result}
                  </strong>
                </div>
              ))
            )}
          </section>

          <nav>
            <button
              className="active"
            >
              ⌂
              <span>Dashboard</span>
            </button>

            <button
              onClick={() =>
                setTab("settings")
              }
            >
              ⚙
              <span>Settings</span>
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
