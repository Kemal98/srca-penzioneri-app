"use client";

import { useState, useEffect } from 'react';

export default function AccessibilityPanel() {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [buttonSize, setButtonSize] = useState('normal');

  // Učitaj postavke iz localStorage-a
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    const savedHighContrast = localStorage.getItem('highContrast');
    const savedLineSpacing = localStorage.getItem('lineSpacing');
    const savedButtonSize = localStorage.getItem('buttonSize');

    if (savedFontSize) setFontSize(Number(savedFontSize));
    if (savedHighContrast) setHighContrast(savedHighContrast === 'true');
    if (savedLineSpacing) setLineSpacing(Number(savedLineSpacing));
    if (savedButtonSize) setButtonSize(savedButtonSize);
  }, []);

  // Funkcija za povećanje/smanjenje slova
  const adjustFontSize = (size) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem('fontSize', size);
  };

  // Funkcija za promjenu kontrasta
  const toggleContrast = () => {
    setHighContrast(!highContrast);
    document.body.classList.toggle('high-contrast');
    localStorage.setItem('highContrast', !highContrast);
  };

  // Funkcija za promjenu razmaka između redova
  const adjustLineSpacing = (spacing) => {
    setLineSpacing(spacing);
    document.documentElement.style.setProperty('--line-spacing', spacing);
    localStorage.setItem('lineSpacing', spacing);
  };

  // Funkcija za promjenu veličine dugmadi
  const adjustButtonSize = (size) => {
    setButtonSize(size);
    document.body.classList.remove('button-small', 'button-normal', 'button-large');
    document.body.classList.add(`button-${size}`);
    localStorage.setItem('buttonSize', size);
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setShowAccessibility(!showAccessibility)}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#ffd700] hover:bg-[#ffd700]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffd700]"
      >
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Pristupačnost
      </button>

      {/* Accessibility Panel */}
      {showAccessibility && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-200 w-80">
          <h3 className="text-lg font-semibold mb-4">Pristupačnost</h3>
          <div className="space-y-4">
            {/* Veličina slova */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Veličina slova
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => adjustFontSize(14)}
                  className={`px-3 py-1 rounded ${fontSize === 14 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => adjustFontSize(16)}
                  className={`px-3 py-1 rounded ${fontSize === 16 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  A
                </button>
                <button
                  onClick={() => adjustFontSize(18)}
                  className={`px-3 py-1 rounded ${fontSize === 18 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  A+
                </button>
                <button
                  onClick={() => adjustFontSize(20)}
                  className={`px-3 py-1 rounded ${fontSize === 20 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  A++
                </button>
              </div>
            </div>

            {/* Razmak između redova */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razmak između redova
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => adjustLineSpacing(1.2)}
                  className={`px-3 py-1 rounded ${lineSpacing === 1.2 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  Mali
                </button>
                <button
                  onClick={() => adjustLineSpacing(1.5)}
                  className={`px-3 py-1 rounded ${lineSpacing === 1.5 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  Normalan
                </button>
                <button
                  onClick={() => adjustLineSpacing(2)}
                  className={`px-3 py-1 rounded ${lineSpacing === 2 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  Veliki
                </button>
              </div>
            </div>

            {/* Veličina dugmadi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Veličina dugmadi
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => adjustButtonSize('small')}
                  className={`px-3 py-1 rounded ${buttonSize === 'small' ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  Mala
                </button>
                <button
                  onClick={() => adjustButtonSize('normal')}
                  className={`px-3 py-1 rounded ${buttonSize === 'normal' ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  Normalna
                </button>
                <button
                  onClick={() => adjustButtonSize('large')}
                  className={`px-3 py-1 rounded ${buttonSize === 'large' ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  Velika
                </button>
              </div>
            </div>

            {/* Kontrast */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontrast
              </label>
              <button
                onClick={toggleContrast}
                className={`w-full px-4 py-2 rounded ${highContrast ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
              >
                {highContrast ? 'Isključi visoki kontrast' : 'Uključi visoki kontrast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 