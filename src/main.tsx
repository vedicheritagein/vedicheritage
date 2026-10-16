import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initPixel } from './lib/pixel.ts'
import { initAnalytics } from './lib/analytics.ts'
import { initAds } from './lib/ads.ts'

// Before render, so the page view is reported even if the app itself fails to
// mount. Each is a no-op unless its own variable is set - VITE_META_PIXEL_ID
// for the Meta pixel, VITE_GA_MEASUREMENT_ID for GA4, VITE_GOOGLE_ADS_ID for
// Google Ads.
//
// Ads goes last but still at startup, not at the first conversion: its
// `config` is what turns the `gclid` on an inbound ad click into the
// first-party cookie that a conversion fired later is attributed against.
initPixel()
initAnalytics()
initAds()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
