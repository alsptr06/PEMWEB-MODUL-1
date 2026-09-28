"use client";

import { useState } from "react";

interface HistoryItem {
  expression: string;
  result: string;
  time: string;
}

export default function ScientificCalculator() {
  // =========================================================================
  // 1. STATE MANAGEMENT (Penyimpanan data dinamis React)
  // =========================================================================
  const [expression, setExpression] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isDegree, setIsDegree] = useState<boolean>(true); // true = DEG, false = RAD
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // =========================================================================
  // 2. FUNGSI OPERASI INPUT & KONTROL
  // =========================================================================

  // Menambahkan karakter atau fungsi ke ekspresi
  const handleInput = (val: string) => {
    // Jika baru saja mendapatkan hasil dan user menekan angka/fungsi, buat kalkulasi baru
    if (result && !["+", "-", "×", "÷", "^", "%"].includes(val)) {
      setExpression(val);
      setResult("");
      return;
    }

    // Jika user menekan operator setelah kalkulasi, lanjutkan dari hasil sebelumnya
    if (result && ["+", "-", "×", "÷", "^", "%"].includes(val)) {
      setExpression(result + val);
      setResult("");
      return;
    }

    setExpression((prev) => prev + val);
  };

  // Menghapus seluruh input (All Clear)
  const handleClear = () => {
    setExpression("");
    setResult("");
  };

  // Menghapus satu karakter atau fungsi terakhir (Backspace/Delete)
  const handleBackspace = () => {
    if (!expression) return;

    // Hapus fungsi scientific sekaligus (contoh: "sin(" dihapus dalam 1 klik)
    const functionTokens = ["sin(", "cos(", "tan(", "log(", "ln(", "√("];
    for (const token of functionTokens) {
      if (expression.endsWith(token)) {
        setExpression((prev) => prev.slice(0, -token.length));
        return;
      }
    }

    setExpression((prev) => prev.slice(0, -1));
  };

  // Mengubah tanda positif / negatif (+/-)
  const handleToggleSign = () => {
    if (!expression) return;
    if (expression.startsWith("-(") && expression.endsWith(")")) {
      setExpression((prev) => prev.slice(2, -1));
    } else {
      setExpression((prev) => `-(${prev})`);
    }
  };

  // =========================================================================
  // 3. LOGIKA EVALUASI MATEMATIKA (SCIENTIFIC EVALUATOR)
  // =========================================================================
  const calculateResult = () => {
    if (!expression.trim()) return;

    try {
      // 1. Terjemahkan simbol antarmuka ke operator matematika JavaScript
      let sanitized = expression
        .replaceAll("×", "*")
        .replaceAll("÷", "/")
        .replaceAll("√", "sqrt")
        .replaceAll("^", "**")
        .replaceAll("π", "pi")
        .replaceAll("%", "*0.01");

      // 2. Tangani perkalian implisit (contoh: 2pi -> 2*pi, 5sin(30) -> 5*sin(30), (2)(3) -> (2)*(3))
      sanitized = sanitized.replace(
        /(\d)(\s*)(pi|e|sqrt|sin|cos|tan|log|ln|\()/g,
        "$1*$3"
      );
      sanitized = sanitized.replace(
        /(\))(\s*)(\d|pi|e|sqrt|sin|cos|tan|log|ln|\()/g,
        "$1*$3"
      );

      // 3. Sanitasi keamanan: pastikan hanya simbol dan fungsi yang sah yang dieksekusi
      const testRemaining = sanitized.replace(
        /sin|cos|tan|log|ln|sqrt|pi|e/g,
        ""
      );
      if (!/^[0-9+\-*/().\s]*$/.test(testRemaining)) {
        setResult("Error: Input Tidak Valid");
        return;
      }

      // 4. Konversi sudut & fungsi scientific
      const toRad = (angle: number) => (angle * Math.PI) / 180;

      const sin = (x: number) => (isDegree ? Math.sin(toRad(x)) : Math.sin(x));
      const cos = (x: number) => (isDegree ? Math.cos(toRad(x)) : Math.cos(x));
      const tan = (x: number) => {
        if (isDegree && Math.abs(x % 180) === 90) {
          throw new Error("Tak Terdefinisi (Asimtot)");
        }
        return isDegree ? Math.tan(toRad(x)) : Math.tan(x);
      };

      const log = (x: number) => {
        if (x <= 0) throw new Error("Log dari <= 0 tidak valid");
        return Math.log10(x);
      };

      const ln = (x: number) => {
        if (x <= 0) throw new Error("Ln dari <= 0 tidak valid");
        return Math.log(x);
      };

      const sqrt = (x: number) => {
        if (x < 0) throw new Error("Akar negatif tidak valid");
        return Math.sqrt(x);
      };

      const pi = Math.PI;
      const e = Math.E;

      // 5. Eksekusi ekspresi dengan Function constructor (aman dan terkontrol)
      const evaluateFn = new Function(
        "sin",
        "cos",
        "tan",
        "log",
        "ln",
        "sqrt",
        "pi",
        "e",
        `"use strict"; return (${sanitized});`
      );

      const rawResult = evaluateFn(sin, cos, tan, log, ln, sqrt, pi, e);

      // 6. Validasi hasil numerik
      if (
        typeof rawResult !== "number" ||
        Number.isNaN(rawResult) ||
        !Number.isFinite(rawResult)
      ) {
        setResult("Error");
        return;
      }

      // 7. Pembulatan presisi floating-point (contoh: cos(90 deg) = 0)
      const rounded = Math.round(rawResult * 1e10) / 1e10;
      const finalResult = rounded.toString();

      setResult(finalResult);

      // Simpan ke riwayat kalkulasi
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setHistory((prev) => [
        { expression, result: finalResult, time: timeStr },
        ...prev.slice(0, 9), // Simpan maksimal 10 riwayat terakhir
      ]);
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setResult(`Error (${err.message})`);
      } else {
        setResult("Format Error");
      }
    }
  };

  // Gunakan riwayat untuk ekspresi saat ini
  const useHistoryItem = (item: HistoryItem) => {
    setExpression(item.result);
    setResult("");
  };

  // =========================================================================
  // 4. SUSUNAN TOMBOL GRID
  // =========================================================================
  const buttonRows = [
    // Baris 1: Mode sudut & Trigonometri
    [
      {
        label: isDegree ? "DEG" : "RAD",
        action: () => setIsDegree(!isDegree),
        className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold",
        title: "Klik untuk beralih mode Derajat / Radian",
      },
      {
        label: "sin",
        action: () => handleInput("sin("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-mono",
      },
      {
        label: "cos",
        action: () => handleInput("cos("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-mono",
      },
      {
        label: "tan",
        action: () => handleInput("tan("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-mono",
      },
      {
        label: "AC",
        action: handleClear,
        className: "bg-rose-600 hover:bg-rose-700 text-white font-bold",
      },
    ],
    // Baris 2: Akar, Pangkat, Logaritma, & Backspace
    [
      {
        label: "√",
        action: () => handleInput("√("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-mono",
      },
      {
        label: "^",
        action: () => handleInput("^"),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-mono",
      },
      {
        label: "log",
        action: () => handleInput("log("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-mono",
      },
      {
        label: "ln",
        action: () => handleInput("ln("),
        className: "bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-mono",
      },
      {
        label: "DEL",
        action: handleBackspace,
        className: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold",
      },
    ],
    // Baris 3: Konstanta, Kurung & Pembagian
    [
      {
        label: "π",
        action: () => handleInput("π"),
        className: "bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-mono",
      },
      {
        label: "e",
        action: () => handleInput("e"),
        className: "bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-mono",
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
    // Baris 4: Angka 7-9, Persen & Perkalian
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
    // Baris 5: Angka 4-6, Plus/Minus & Pengurangan
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
    // Baris 6: Angka 1-3 & Penjumlahan
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
      {/* Header Aplikasi */}
      <header className="text-center mb-6 max-w-md">
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
          Praktikum Pemrograman Web • Modul 1
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 text-white">
          Scientific Calculator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Dibuat dengan Next.js App Router, React State, & Tailwind CSS
        </p>
      </header>

      {/* Kalkulator Card */}
      <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-3xl p-5 shadow-2xl">
        {/* LAYAR DISPLAY */}
        <section
          aria-label="Layar Kalkulator"
          className="bg-black/60 rounded-2xl p-4 mb-4 border border-zinc-800/80 flex flex-col justify-between min-h-[110px]"
        >
          {/* Baris Status (Mode Sudut & Tombol Riwayat) */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <button
              onClick={() => setIsDegree(!isDegree)}
              className={`px-2 py-0.5 rounded font-semibold text-[11px] transition-colors cursor-pointer ${
                isDegree
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/50"
                  : "bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/50"
              }`}
            >
              Mode: {isDegree ? "DEG (Derajat)" : "RAD (Radian)"}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer flex items-center gap-1"
            >
              {showHistory ? "Tutup Riwayat" : `Riwayat (${history.length})`}
            </button>
          </div>

          {/* Tampilan Ekspresi yang Diketik */}
          <div className="overflow-x-auto text-right text-xl sm:text-2xl font-mono text-zinc-200 mt-2 whitespace-nowrap scrollbar-thin scrollbar-thumb-zinc-700">
            {expression || "0"}
          </div>

          {/* Tampilan Hasil */}
          <div className="text-right text-2xl sm:text-3xl font-mono font-bold text-emerald-400 truncate mt-1">
            {result ? `= ${result}` : ""}
          </div>
        </section>

        {/* Panel Riwayat Perhitungan (Dapat dibuka/ditutup) */}
        {showHistory && (
          <div className="mb-4 p-3 bg-black/40 rounded-xl border border-zinc-800 max-h-40 overflow-y-auto">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-zinc-800 text-xs text-zinc-400 font-semibold">
              <span>Riwayat Terakhir</span>
              <button
                onClick={() => setHistory([])}
                className="text-rose-400 hover:text-rose-300 text-[10px] cursor-pointer"
              >
                Hapus Semua
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-2">Belum ada riwayat perhitungan</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => useHistoryItem(item)}
                    className="w-full text-left p-1.5 rounded hover:bg-zinc-800/80 transition-colors flex justify-between items-center text-xs font-mono group cursor-pointer"
                  >
                    <span className="text-zinc-400 truncate max-w-[180px]">{item.expression}</span>
                    <span className="text-emerald-400 font-bold group-hover:underline">
                      = {item.result}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GRID TOMBOL KALKULATOR */}
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

          {/* Baris Terakhir: Tombol 0 dan Tombol Sama Dengan (=) */}
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

      {/* FOOTER INFORMASI EDUKASI */}
      <footer className="mt-8 max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300">
        <h2 className="font-semibold text-sm text-slate-200 mb-2 flex items-center gap-1.5">
          💡 Konsep Pemrograman Web:
        </h2>
        <ul className="space-y-1.5 list-disc list-inside text-slate-400">
          <li>
            <strong className="text-slate-200">React Hooks (`useState`):</strong> Mengelola state interaktif kalkulator (ekspresi, hasil, mode sudut, dan riwayat).
          </li>
          <li>
            <strong className="text-slate-200">Event Handlers (`onClick`):</strong> Merespon klik tombol untuk memanipulasi ekspresi matematika.
          </li>
          <li>
            <strong className="text-slate-200">Sanitasi & Evaluasi:</strong> Mengubah simbol UI (`×`, `÷`, `√`, `^`) menjadi fungsi JavaScript `Math` dengan verifikasi input regex.
          </li>
          <li>
            <strong className="text-slate-200">Tailwind CSS Responsive:</strong> Menggunakan CSS Grid (`grid-cols-5`) dan utilitas responsif untuk tata letak modern.
          </li>
        </ul>
      </footer>
    </main>
  );
}
