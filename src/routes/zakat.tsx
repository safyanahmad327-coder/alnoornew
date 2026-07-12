import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Coins, Info, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/zakat")({
  ssr: false,
  component: ZakatPage,
});

// Nisab thresholds (grams)
const GOLD_NISAB_G = 87.48;
const SILVER_NISAB_G = 612.36;
const ZAKAT_RATE = 0.025;

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "PKR", symbol: "₨" },
  { code: "INR", symbol: "₹" },
  { code: "SAR", symbol: "﷼" },
  { code: "AED", symbol: "د.إ" },
  { code: "GBP", symbol: "£" },
  { code: "EUR", symbol: "€" },
];

interface Fields {
  cash: string;
  bank: string;
  gold: string; // grams
  silver: string; // grams
  goldPrice: string; // per gram
  silverPrice: string; // per gram
  investments: string;
  business: string;
  receivables: string;
  liabilities: string;
}

const DEFAULTS: Fields = {
  cash: "",
  bank: "",
  gold: "",
  silver: "",
  goldPrice: "75",
  silverPrice: "0.9",
  investments: "",
  business: "",
  receivables: "",
  liabilities: "",
};

const n = (s: string) => {
  const v = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

function ZakatPage() {
  const [f, setF] = useState<Fields>(DEFAULTS);
  const [currency, setCurrency] = useState("USD");
  const [nisabType, setNisabType] = useState<"silver" | "gold">("silver");

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const calc = useMemo(() => {
    const gp = n(f.goldPrice);
    const sp = n(f.silverPrice);
    const goldVal = n(f.gold) * gp;
    const silverVal = n(f.silver) * sp;
    const assets =
      n(f.cash) +
      n(f.bank) +
      goldVal +
      silverVal +
      n(f.investments) +
      n(f.business) +
      n(f.receivables);
    const liabilities = n(f.liabilities);
    const net = Math.max(0, assets - liabilities);
    const nisab =
      nisabType === "silver" ? SILVER_NISAB_G * sp : GOLD_NISAB_G * gp;
    const eligible = nisab > 0 && net >= nisab;
    const zakat = eligible ? net * ZAKAT_RATE : 0;
    return { assets, liabilities, net, nisab, eligible, zakat, goldVal, silverVal };
  }, [f, nisabType]);

  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "";
  const fmt = (v: number) =>
    `${sym}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const reset = () => setF(DEFAULTS);

  return (
    <div className="mx-auto max-w-md pb-6">
      <PageHeader title="Zakat Calculator" subtitle="Annual wealth purification" />

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-2xl gradient-hero islamic-pattern p-4 text-primary-foreground shadow-elegant">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <p className="text-sm font-semibold">Your Zakat</p>
          </div>
          <p className="mt-2 font-arabic text-3xl leading-tight">{fmt(calc.zakat)}</p>
          <p className="mt-1 text-[11px] opacity-85">
            {calc.eligible
              ? `2.5% of net zakatable wealth (${fmt(calc.net)})`
              : `Below nisab (${fmt(calc.nisab)}) — no zakat due`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="rounded-xl border border-border bg-card p-3 shadow-card">
            <span className="block text-[10px] uppercase text-muted-foreground">
              Currency
            </span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-xl border border-border bg-card p-3 shadow-card">
            <span className="block text-[10px] uppercase text-muted-foreground">
              Nisab basis
            </span>
            <select
              value={nisabType}
              onChange={(e) => setNisabType(e.target.value as "silver" | "gold")}
              className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
            >
              <option value="silver">Silver (612.36 g)</option>
              <option value="gold">Gold (87.48 g)</option>
            </select>
          </label>
        </div>

        <Section title="Cash & bank">
          <Field label={`Cash in hand (${sym})`} value={f.cash} onChange={set("cash")} />
          <Field label={`Bank balance (${sym})`} value={f.bank} onChange={set("bank")} />
        </Section>

        <Section title="Gold & silver">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Gold (grams)" value={f.gold} onChange={set("gold")} />
            <Field
              label={`Gold price / g (${sym})`}
              value={f.goldPrice}
              onChange={set("goldPrice")}
            />
            <Field label="Silver (grams)" value={f.silver} onChange={set("silver")} />
            <Field
              label={`Silver price / g (${sym})`}
              value={f.silverPrice}
              onChange={set("silverPrice")}
            />
          </div>
          {(calc.goldVal > 0 || calc.silverVal > 0) && (
            <p className="text-[11px] text-muted-foreground">
              Gold value: {fmt(calc.goldVal)} · Silver value: {fmt(calc.silverVal)}
            </p>
          )}
        </Section>

        <Section title="Other assets">
          <Field
            label={`Investments / stocks (${sym})`}
            value={f.investments}
            onChange={set("investments")}
          />
          <Field
            label={`Business inventory (${sym})`}
            value={f.business}
            onChange={set("business")}
          />
          <Field
            label={`Money owed to you (${sym})`}
            value={f.receivables}
            onChange={set("receivables")}
          />
        </Section>

        <Section title="Liabilities">
          <Field
            label={`Debts due now (${sym})`}
            value={f.liabilities}
            onChange={set("liabilities")}
          />
        </Section>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <Row label="Total assets" value={fmt(calc.assets)} />
          <Row label="Liabilities" value={`− ${fmt(calc.liabilities)}`} />
          <div className="my-2 h-px bg-border" />
          <Row label="Net zakatable wealth" value={fmt(calc.net)} strong />
          <Row label="Nisab threshold" value={fmt(calc.nisab)} />
          <div className="my-2 h-px bg-border" />
          <Row
            label="Zakat due (2.5%)"
            value={fmt(calc.zakat)}
            strong
            highlight
          />
        </div>

        <button
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-muted-foreground hover:border-primary/60"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>

        <div className="flex gap-2 rounded-xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Estimates only. Update gold/silver prices to today's rate and consult a
            scholar for complex assets (retirement, property, crypto, agricultural
            produce, livestock).
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder="0"
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Row({
  label,
  value,
  strong,
  highlight,
}: {
  label: string;
  value: string;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span
        className={`${strong ? "font-semibold" : ""} ${highlight ? "text-primary" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
