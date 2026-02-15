# OpsBoard Brand Pack (Dark Tech Glow)

## Contents
- `assets/png/` Icon PNGs (32/64/192/512) + horizontal logo
- `assets/svg/` Vector icon
- `tokens/brand.tokens.json` Brand + color tokens
- `code/react/` React components:
  - `OpsBoardLogo.jsx`
  - `SplashIntro.jsx`

## Recommended placement in your app
1) Copy `assets/png/*` to `frontend/public/brand/`
2) Use `<OpsBoardLogo />` in Header/Sidebar
3) Mount `<SplashIntro />` once at app start (App.jsx/Root)

### Example (App.jsx)
```jsx
import React, { useState } from "react";
import { SplashIntro } from "./components/SplashIntro";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <>
      {showSplash && <SplashIntro onDone={() => setShowSplash(false)} />}
      <YourRealApp />
    </>
  );
}
```

## Notes
- All assets are generated for dark-mode usage.
- If you want a tighter crop: the PNG icons are already edge-to-edge without extra padding.
