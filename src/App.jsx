import React, { useState, useEffect, useMemo } from 'react';

// Data untuk 10 level soal, diperbarui agar jalur berjarak aman (tidak mepet) 
// sehingga WAJIB diselesaikan dengan tepat 5 instruksi tanpa jalan pintas.
const rawLevels = [
  { id: 1, char: '🐶', targetItem: '🦴', start: [0, 0], instructions: [ { dir: 'right', steps: 2 }, { dir: 'down', steps: 2 }, { dir: 'right', steps: 3 }, { dir: 'down', steps: 4 }, { dir: 'right', steps: 2 } ] },
  { id: 2, char: '🐰', targetItem: '🥕', start: [7, 7], instructions: [ { dir: 'left', steps: 3 }, { dir: 'up', steps: 3 }, { dir: 'left', steps: 3 }, { dir: 'up', steps: 3 }, { dir: 'right', steps: 2 } ] },
  { id: 3, char: '🐒', targetItem: '🍌', start: [0, 7], instructions: [ { dir: 'up', steps: 2 }, { dir: 'right', steps: 4 }, { dir: 'up', steps: 3 }, { dir: 'left', steps: 2 }, { dir: 'up', steps: 2 } ] },
  { id: 4, char: '🐝', targetItem: '🌻', start: [7, 0], instructions: [ { dir: 'down', steps: 3 }, { dir: 'left', steps: 4 }, { dir: 'down', steps: 3 }, { dir: 'right', steps: 3 }, { dir: 'down', steps: 1 } ] },
  { id: 5, char: '🐭', targetItem: '🧀', start: [1, 0], instructions: [ { dir: 'down', steps: 4 }, { dir: 'right', steps: 4 }, { dir: 'up', steps: 2 }, { dir: 'right', steps: 2 }, { dir: 'down', steps: 5 } ] },
  { id: 6, char: '🐸', targetItem: '🪰', start: [0, 3], instructions: [ { dir: 'right', steps: 2 }, { dir: 'up', steps: 2 }, { dir: 'right', steps: 4 }, { dir: 'down', steps: 5 }, { dir: 'left', steps: 3 } ] },
  { id: 7, char: '🐢', targetItem: '🥬', start: [6, 0], instructions: [ { dir: 'left', steps: 5 }, { dir: 'down', steps: 3 }, { dir: 'right', steps: 3 }, { dir: 'down', steps: 4 }, { dir: 'left', steps: 2 } ] },
  { id: 8, char: '🐧', targetItem: '🐟', start: [0, 4], instructions: [ { dir: 'up', steps: 3 }, { dir: 'right', steps: 4 }, { dir: 'down', steps: 4 }, { dir: 'right', steps: 3 }, { dir: 'up', steps: 2 } ] },
  { id: 9, char: '🐻', targetItem: '🍯', start: [2, 7], instructions: [ { dir: 'up', steps: 5 }, { dir: 'right', steps: 4 }, { dir: 'down', steps: 2 }, { dir: 'left', steps: 2 }, { dir: 'down', steps: 2 } ] },
  { id: 10, char: '🦄', targetItem: '🌈', start: [0, 2], instructions: [ { dir: 'down', steps: 4 }, { dir: 'right', steps: 6 }, { dir: 'up', steps: 5 }, { dir: 'left', steps: 3 }, { dir: 'down', steps: 2 } ] },
];

// Fungsi untuk mengacak urutan soal (Fisher-Yates Shuffle)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function App() {
  // State levels menyimpan array soal yang sudah diacak setiap kali aplikasi dimuat
  const [levels, setLevels] = useState(() => shuffleArray(rawLevels));
  const [currentLevel, setCurrentLevel] = useState(0);
  // Simpan 5 baris instruksi yang diisi siswa
  const [answers, setAnswers] = useState(Array(5).fill({ dir: '', steps: '' }));
  const [gameState, setGameState] = useState('playing'); // playing, running, correct, wrong, finished
  
  // Ambil posisi awal dari urutan soal yang sudah diacak
  const [charPos, setCharPos] = useState(levels[0].start);

  // State baru untuk sistem skor dan validasi input
  const [score, setScore] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [levelScore, setLevelScore] = useState(0);

  const levelData = levels[currentLevel];

  // Menghitung titik-titik jalur (path) dan target secara dinamis berdasarkan instruksi
  const { pathCells, targetPos } = useMemo(() => {
    if (!levelData) return { pathCells: [], targetPos: [0,0] };
    
    let cells = [];
    let current = [...levelData.start];
    cells.push([...current]);

    levelData.instructions.forEach(inst => {
      for (let i = 0; i < inst.steps; i++) {
        if (inst.dir === 'right') current[0]++;
        if (inst.dir === 'left') current[0]--;
        if (inst.dir === 'up') current[1]--;
        if (inst.dir === 'down') current[1]++;
        cells.push([...current]);
      }
    });
    return { pathCells: cells, targetPos: current };
  }, [levelData]);

  // Reset setiap kali level berganti
  useEffect(() => {
    if (currentLevel < levels.length) {
      setCharPos(levels[currentLevel].start);
      setAnswers(Array(5).fill({ dir: '', steps: '' }));
      setGameState('playing');
      setShowWarning(false);
      setLevelScore(0);
    }
  }, [currentLevel, levels]);

  const handleInputChange = (index, field, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setAnswers(newAnswers);
  };

  // Fungsi untuk menjalankan kode langkah demi langkah dengan animasi
  const executeCode = async () => {
    // Validasi apakah semua input sudah diisi
    const isComplete = answers.every(ans => ans.dir !== '' && ans.steps !== '');
    if (!isComplete) {
      setShowWarning(true);
      return;
    }

    setShowWarning(false);
    setGameState('running');

    // Hitung skor untuk level ini (tiap instruksi benar bernilai 2 poin)
    let correctCount = 0;
    for (let i = 0; i < 5; i++) {
      if (answers[i].dir === levelData.instructions[i].dir && parseInt(answers[i].steps) === levelData.instructions[i].steps) {
        correctCount++;
      }
    }
    const pointsEarned = correctCount * 2;
    setLevelScore(pointsEarned);

    let currentPos = [...levelData.start];
    setCharPos(currentPos);
    let success = true;

    for (let i = 0; i < answers.length; i++) {
      const ans = answers[i];
      const stepsToMove = parseInt(ans.steps);

      for (let s = 0; s < stepsToMove; s++) {
        // Jeda waktu untuk animasi pergerakan (300ms)
        await new Promise(r => setTimeout(r, 300)); 

        if (ans.dir === 'right') currentPos[0]++;
        if (ans.dir === 'left') currentPos[0]--;
        if (ans.dir === 'up') currentPos[1]--;
        if (ans.dir === 'down') currentPos[1]++;

        setCharPos([...currentPos]);

        // Cek apakah posisi karakter saat ini ada di dalam jalur (pathCells)
        const isOnPath = pathCells.some(
          cell => cell[0] === currentPos[0] && cell[1] === currentPos[1]
        );

        // Jika keluar dari jalur, langsung hentikan program
        if (!isOnPath) {
          success = false;
          break;
        }
      }
      if (!success) break;
    }

    // Tambahkan skor ke total skor
    setScore(prev => prev + pointsEarned);

    // Evaluasi akhir untuk UI (benar/salah) dan paksa lanjut ke level berikutnya
    if (success && currentPos[0] === targetPos[0] && currentPos[1] === targetPos[1]) {
      setGameState('correct');
    } else {
      setGameState('wrong');
    }
  };

  const handleNextLevel = () => {
    if (currentLevel + 1 < levels.length) {
      setCurrentLevel(currentLevel + 1);
    } else {
      setGameState('finished');
    }
  };

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-blue-100 flex flex-col items-center justify-center p-4 font-sans text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full">
          <h1 className="text-5xl mb-4">🎉🎓🎈</h1>
          <h1 className="text-3xl font-bold text-blue-600 mb-4">Congratulations!</h1>
          <p className="text-xl text-gray-700 mb-6">You are a Master Coder!<br/>(Kamu telah menyelesaikan semua algoritma!)</p>
          
          {/* Tampilkan Skor Akhir */}
          <div className="bg-yellow-100 border-4 border-yellow-400 rounded-2xl p-6 mb-8 shadow-inner">
            <p className="text-2xl font-bold text-gray-800">Final Score</p>
            <p className="text-6xl font-extrabold text-orange-500">{score} / 100</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 py-8 px-4 font-sans flex flex-col items-center">
      {/* Header */}
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center justify-between mb-6 px-4">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 mb-2">Algorithm Adventure!</h1>
          <p className="text-lg text-blue-600 font-medium bg-blue-100 py-2 px-6 rounded-full inline-block shadow-sm">
            Question {currentLevel + 1} of 10
          </p>
        </div>
        
        {/* Tampilan Total Skor di Pojok Kanan Atas */}
        <div className="bg-white border-4 border-orange-400 py-2 px-6 rounded-2xl shadow-md text-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Score</p>
          <p className="text-3xl font-extrabold text-orange-500">{score}</p>
        </div>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-3xl shadow-xl max-w-5xl w-full flex flex-col lg:flex-row gap-8 border-4 border-blue-200">
        
        {/* KIRI: Area Grid */}
        <div className="flex-1 flex flex-col items-center">
          <p className="text-xl md:text-2xl text-gray-700 font-bold mb-4 text-center">
            Help the {levelData.char} reach the {levelData.targetItem} on the path!
          </p>
          
          <div className="grid grid-cols-8 gap-1 bg-green-200 p-2 md:p-3 rounded-2xl shadow-inner max-w-md w-full">
            {Array.from({ length: 64 }).map((_, index) => {
              const x = index % 8;
              const y = Math.floor(index / 8);
              
              const isChar = charPos[0] === x && charPos[1] === y;
              const isTarget = targetPos[0] === x && targetPos[1] === y;
              const isStart = levelData.start[0] === x && levelData.start[1] === y;
              
              // Cek apakah kotak ini merupakan bagian dari jalur
              const isPathCell = pathCells.some(cell => cell[0] === x && cell[1] === y);
              
              let bgColor = (x + y) % 2 === 0 ? 'bg-green-400' : 'bg-green-500'; // Warna rumput
              if (isPathCell) {
                bgColor = 'bg-[#d2b48c]'; // Warna cokelat terang untuk jalur tanah
              }
              
              // Timpa dengan warna khusus jika itu kotak awal atau target
              if (isStart) {
                bgColor = 'bg-yellow-400 shadow-inner'; // Warna kuning untuk titik mulai
              } else if (isTarget) {
                bgColor = 'bg-red-400 shadow-inner'; // Warna merah untuk target
              }

              return (
                <div 
                  key={index} 
                  className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-xl sm:text-2xl md:text-3xl rounded-md transition-all duration-300
                    ${bgColor} 
                    ${isChar ? 'z-10 scale-110 drop-shadow-md' : ''}
                    ${isTarget && !isChar ? 'animate-bounce' : ''}
                  `}
                >
                  {isChar ? levelData.char : isTarget ? levelData.targetItem : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* KANAN: Area Input Kode (5 Baris) */}
        <div className="flex-1 bg-yellow-50 p-6 rounded-2xl border-2 border-yellow-200 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Write your Code! ✍️</h2>
          
          <div className="flex flex-col gap-3">
            {answers.map((ans, idx) => {
              // Tentukan apakah baris instruksi ini benar atau salah HANYA JIKA evaluasi selesai
              const isEvaluated = gameState === 'correct' || gameState === 'wrong';
              const isCorrect = isEvaluated && ans.dir === levelData.instructions[idx].dir && parseInt(ans.steps) === levelData.instructions[idx].steps;
              const isWrong = isEvaluated && !isCorrect;

              return (
                <div key={idx} className={`flex flex-wrap items-center justify-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-gray-700 p-2 rounded-xl border transition-colors ${isCorrect ? 'bg-green-50 border-green-400' : isWrong ? 'bg-red-50 border-red-400 shadow-inner' : 'bg-white border-gray-200'}`}>
                  <span className="w-6 text-center text-blue-500">{idx + 1}.</span>
                  <span>Move</span>
                  
                  <select 
                    value={ans.dir}
                    onChange={(e) => handleInputChange(idx, 'dir', e.target.value)}
                    disabled={gameState !== 'playing'}
                    className="appearance-none bg-blue-50 border-2 border-blue-400 text-blue-600 rounded-lg px-2 py-1 cursor-pointer outline-none focus:border-blue-600 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>---</option>
                    <option value="right">right ➡️</option>
                    <option value="left">left ⬅️</option>
                    <option value="up">up ⬆️</option>
                    <option value="down">down ⬇️</option>
                  </select>

                  <select 
                    value={ans.steps}
                    onChange={(e) => handleInputChange(idx, 'steps', e.target.value)}
                    disabled={gameState !== 'playing'}
                    className="appearance-none bg-orange-50 border-2 border-orange-400 text-orange-600 rounded-lg px-2 py-1 cursor-pointer outline-none focus:border-orange-600 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>-</option>
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>

                  <span>steps</span>

                  {/* Indikator Benar/Salah muncul setelah evaluasi tanpa mengubah isi dropdown siswa */}
                  {isEvaluated && (
                    <span className="ml-1 w-6 text-center text-xl drop-shadow-sm" title={isCorrect ? "Benar" : "Ada yang salah!"}>
                      {isCorrect ? '✅' : '❌'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Area Tombol dan Notifikasi */}
          <div className="mt-8 flex flex-col items-center justify-center min-h-[100px]">
            {gameState === 'playing' && (
              <div className="w-full flex flex-col items-center">
                {showWarning && (
                  <p className="text-red-500 font-bold mb-3 bg-red-100 py-2 px-4 rounded-xl border border-red-300 animate-pulse text-center w-full max-w-sm">
                    ⚠️ Please fill in all directions and steps!<br/>
                    <span className="text-sm font-normal text-red-600">(Tolong lengkapi semua arah dan langkah!)</span>
                  </p>
                )}
                <button onClick={executeCode} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition transform hover:scale-105 active:scale-95 w-full max-w-xs">
                  Run Code! 🚀
                </button>
              </div>
            )}

            {gameState === 'running' && (
              <p className="text-blue-500 font-bold text-xl animate-pulse">Running Code... 🏃💨</p>
            )}

            {gameState === 'correct' && (
              <div className="flex flex-col items-center text-center w-full">
                <p className="text-green-500 font-bold text-2xl mb-1 animate-bounce">Perfect! Great Job! ⭐</p>
                <p className="text-orange-500 font-bold text-xl mb-4 bg-orange-100 py-1 px-6 rounded-full border border-orange-300">
                  +{levelScore} Points
                </p>
                <button onClick={handleNextLevel} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition transform hover:scale-105 w-full max-w-xs">
                  Next Level ➡️
                </button>
              </div>
            )}

            {gameState === 'wrong' && (
              <div className="flex flex-col items-center text-center w-full">
                <p className="text-red-500 font-bold text-lg mb-1">Oops! You missed the path or wrong destination. ❌</p>
                <p className="text-orange-500 font-bold text-xl mb-4 bg-orange-100 py-1 px-6 rounded-full border border-orange-300">
                  +{levelScore} Points
                </p>
                <button onClick={handleNextLevel} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition transform hover:scale-105 w-full max-w-xs">
                  Next Level ➡️
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-500 text-sm max-w-2xl px-4">
        <p><strong>Cara Bermain:</strong> Hewan <strong>tidak boleh keluar</strong> dari jalur cokelat! Susunlah 5 instruksi secara berurutan agar hewan bisa menyusuri jalur cokelat sampai ke targetnya tanpa tersesat.</p>
      </div>
    </div>
  );
}