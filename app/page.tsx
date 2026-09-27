"use client";

import { useState } from "react";

export default function ScientificCalculator() {
  // 1. STATE MANAGEMENT
  const [expression, setExpression] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isDegree, setIsDegree] = useState<boolean>(true);

  // 2. FUNGSI OPERASI KALKULATOR
  const handleInput = (val: string) => {
    if (result && !["+", "-", "×", "÷", "^", "%"].includes(val)) {
      setExpression(val);
      setResult("");
      return;
    }

    if (result && ["+", "-", "×", "÷", "^", "%"].includes(val)) {
      setExpression(result + val);
      setResult("");
      return;
    }

    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression("");
    setResult("");
  };

  const handleBackspace = () => {
    if (!expression) return;
    const functionTokens = ["sin(", "cos(", "tan(", "log(", "ln(", "√("];
    for (const token of functionTokens) {
      if (expression.endsWith(token)) {
        setExpression((prev) => prev.slice(0, -token.length));
        return;
      }
    }
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleToggleSign = () => {
    if (!expression) return;
    if (expression.startsWith("-(") && expression.endsWith(")")) {
      setExpression((prev) => prev.slice(2, -1));
    } else {
      setExpression((prev) => `-(${prev})`);
    }
  };

  // 3. LOGIKA EVALUASI MATEMATIKA
  const calculateResult = () => {
    if (!expression.trim()) return;

    try {
      let sanitized = expression
        .replaceAll("×", "*")
        .replaceAll("÷", "/")
        .replaceAll("√", "sqrt")
        .replaceAll("^", "**")
        .replaceAll("π", "pi")
        .replaceAll("%", "*0.01");

      sanitized = sanitized.replace(
        /(\d)(\s*)(pi|e|sqrt|sin|cos|tan|log|ln|\()/g,
        "$1*$3"
      );
      sanitized = sanitized.replace(
        /(\))(\s*)(\d|pi|e|sqrt|sin|cos|tan|log|ln|\()/g,
        "$1*$3"
      );

      const testRemaining = sanitized.replace(
        /sin|cos|tan|log|ln|sqrt|pi|e/g,
        ""
      );
      if (!/^[0-9+\-*/().\s]*$/.test(testRemaining)) {
        setResult("Error: Input Tidak Valid");
        return;
      }

      const toRad = (angle: number) => (angle * Math.PI) / 180;
      const sin = (x: number) => (isDegree ? Math.sin(toRad(x)) : Math.sin(x));
      const cos = (x: number) => (isDegree ? Math.cos(toRad(x)) : Math.cos(x));
      const tan = (x: number) => {
        if (isDegree && Math.abs(x % 180) === 90) {
          throw new Error("Undef (Asimtot)");
        }
        return isDegree ? Math.tan(toRad(x)) : Math.tan(x);
      };
      const log = (x: number) => {
        if (x <= 0) throw new Error("Log <= 0");
        return Math.log10(x);
      };
      const ln = (x: number) => {
        if (x <= 0) throw new Error("Ln <= 0");
        return Math.log(x);
      };
      const sqrt = (x: number) => {
        if (x < 0) throw new Error("Akar Negatif");
        return Math.sqrt(x);
      };
      const pi = Math.PI;
      const e = Math.E;

      const evaluateFn = new Function(
        "sin", "cos", "tan", "log", "ln", "sqrt", "pi", "e",
        `"use strict"; return (${sanitized});`
      );

      const rawResult = evaluateFn(sin, cos, tan, log, ln, sqrt, pi, e);

      if (
        typeof rawResult !== "number" ||
        Number.isNaN(rawResult) ||
        !Number.isFinite(rawResult)
      ) {
        setResult("Error");
        return;
      }

      const rounded = Math.round(rawResult * 1e10) / 1e10;
      setResult(rounded.toString());
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setResult(`Error (${err.message})`);
      } else {
        setResult("Format Error");
      }
    }
  };

  const buttonRows = [
    [
      {
        label: isDegree ? "DEG" : "RAD",
        action: () => setIsDegree(!isDegree),
        className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold",
        title: "Klik untuk beralih Derajat / Radian",
      },
      {
        label: "sin",
        action: () => handleInput("sin("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300",
      },
      {
        label: "cos",
        action: () => handleInput("cos("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300",
      },
      {
        label: "tan",
        action: () => handleInput("tan("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300",
      },
      {
        label: "AC",
        action: handleClear,
        className: "bg-rose-600 hover:bg-rose-700 text-white font-bold",
      },
    ],
    [
      {
        label: "√",
        action: () => handleInput("√("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300",
      },
      {
        label: "^",
        action: () => handleInput("^"),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300",
      },
      {
        label: "log",
        action: () => handleInput("log("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300",
      },
      {
        label: "ln",
        action: () => handleInput("ln("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300",
      },
      {
        label: "DEL",
        action: handleBackspace,
        className: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold",
      },
    ],
    [
      {
        label: "π",
        action: () => handleInput("π"),
        className: "bg-zinc-800 hover:bg-zinc-700 text-purple-300",
      },
      {
        label: "e",
        action: () => handleInput("e"),
        className: "bg-zinc-800 hover:bg-zinc-700 text-purple-300",
      },
      {
        label: "(",
        action: () => handleInput("("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
      },
      {
        label: ")",
        action: () => handleInput(")"),
        className: "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
      },
      {
        label: "÷",
        action: () => handleInput("÷"),
        className: "bg-amber-600 hover:bg-amber-500 text-white font-bold text-xl",
      },
    ],
    [
      {
        label: "7",
        action: () => handleInput("7"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: "8",
        action: () => handleInput("8"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: "9",
        action: () => handleInput("9"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: "%",
        action: () => handleInput("%"),
        className: "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
      },
      {
        label: "×",
        action: () => handleInput("×"),
        className: "bg-amber-600 hover:bg-amber-500 text-white font-bold text-xl",
      },
    ],
    [
      {
        label: "4",
        action: () => handleInput("4"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: "5",
        action: () => handleInput("5"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: "6",
        action: () => handleInput("6"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: "±",
        action: handleToggleSign,
        className: "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
      },
      {
        label: "-",
        action: () => handleInput("-"),
        className: "bg-amber-600 hover:bg-amber-500 text-white font-bold text-xl",
      },
    ],
    [
      {
        label: "1",
        action: () => handleInput("1"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: "2",
        action: () => handleInput("2"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: "3",
        action: () => handleInput("3"),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white",
      },
      {
        label: ".",
        action: () => handleInput("."),
        className: "bg-zinc-900 hover:bg-zinc-800 text-white font-bold",
      },
      {
        label: "+",
        action: () => handleInput("+"),
        className: "bg-amber-600 hover:bg-amber-500 text-white font-bold text-xl",
      },
    ],
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <header className="text-center mb-6 max-w-md">
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
          Praktikum Pemrograman Web • Modul 1
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 text-white">
          Scientific Calculator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Dibuat dengan Next.js App Router, React State, & Tailwind CSS
        </p>
      </header>

      <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-3xl p-5 shadow-2xl">
        <section
          aria-label="Layar Kalkulator"
          className="bg-black/60 rounded-2xl p-4 mb-4 border border-zinc-800/80 flex flex-col justify-between min-h-[110px]"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span
              className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                isDegree
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
                  : "bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              Mode: {isDegree ? "DEG (Derajat)" : "RAD (Radian)"}
            </span>
            <span className="truncate max-w-[200px]">
              {result ? `Ans = ${result}` : "Siap menghitung"}
            </span>
          </div>

          <div className="overflow-x-auto text-right text-xl sm:text-2xl font-mono text-zinc-200 mt-2 whitespace-nowrap scrollbar-thin scrollbar-thumb-zinc-700">
            {expression || "0"}
          </div>

          <div className="text-right text-2xl sm:text-3xl font-mono font-bold text-emerald-400 truncate mt-1">
            {result ? `= ${result}` : ""}
          </div>
        </section>

        <div className="flex flex-col gap-2">
          {buttonRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-2">
              {row.map((btn, colIndex) => (
                <button
                  key={colIndex}
                  onClick={btn.action}
                  title={btn.title}
                  className={`h-11 sm:h-12 rounded-xl text-sm sm:text-base font-medium transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm ${btn.className}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          ))}

          <div className="grid grid-cols-5 gap-2 mt-1">
            <button
              onClick={() => handleInput("0")}
              className="col-span-2 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-base transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
            >
              0
            </button>
            <button
              onClick={calculateResult}
              className="col-span-3 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-900/30"
            >
              =
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-8 max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300">
        <h2 className="font-semibold text-sm text-slate-200 mb-2 flex items-center gap-1.5">
          💡 Catatan Konsep Pemrograman Web:
        </h2>
        <ul className="space-y-1.5 list-disc list-inside text-slate-400">
          <li>
            <strong className="text-slate-200">useState:</strong> Menyimpan state{" "}
            <code className="text-indigo-300">expression</code>,{" "}
            <code className="text-emerald-300">result</code>, dan{" "}
            <code className="text-cyan-300">isDegree</code>.
          </li>
          <li>
            <strong className="text-slate-200">Event Handling:</strong> Event{" "}
            <code className="text-amber-300">onClick</code> pada tiap tombol
            memperbarui teks input secara reaktif.
          </li>
          <li>
            <strong className="text-slate-200">Sanitasi Input:</strong> Sebelum
            evaluasi, karakter divalidasi dengan regex guna mencegah eksekusi
            kode liar.
          </li>
          <li>
            <strong className="text-slate-200">Function Constructor:</strong>{" "}
            Alternatif aman dari <code className="text-rose-300">eval()</code>{" "}
            dengan menyuntikkan fungsi matematika <code className="text-purple-300">Math</code>.
          </li>
        </ul>
      </footer>
    </main>
  );
}
