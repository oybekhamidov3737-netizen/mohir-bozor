// Saytda sahifa ochilganda o'ngdan silliq kirib keladi (CSS, qotmaydi).
import React from 'react';

const CSS = `
@keyframes mbEnter{from{opacity:0;transform:translateX(28px) scale(.985)}to{opacity:1;transform:none}}
.mb-enter{animation:mbEnter .32s cubic-bezier(.2,.75,.25,1) backwards}
@media (prefers-reduced-motion: reduce){.mb-enter{animation:none}}
`;

export function ScreenEnter({ children }) {
  return (
    <div className="mb-enter" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
      <style>{CSS}</style>
      {children}
    </div>
  );
}
