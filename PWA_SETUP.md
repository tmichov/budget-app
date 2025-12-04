# PWA Setup Guide - Budget App

## Overview
Your Budget App is now a Progressive Web App (PWA) with offline capabilities and quick access widgets.

## Features

### 1. **App Installation**
- Users see an "Install" prompt when visiting the app
- Can be added to home screen on Android and iOS
- Standalone app experience (no browser UI)
- App icon appears on device home screen with your dark green theme color

### 2. **Quick Add Expense Widget**
- **URL**: `/quick?type=expense` or `/quick?type=income`
- Access from home screen via app shortcuts
- Minimal, focused interface for fast data entry
- Large, prominent amount input field
- Optimized for one-handed use on mobile

### 3. **App Shortcuts**
Available from long-press menu on app icon:
- **Add Expense** - Quick expense entry
- **Add Income** - Quick income entry
- **View Transactions** - Go to transactions page
- **View Bills** - Go to bills page

### 4. **Offline Support**
- Service worker caches app shell and static assets
- Basic offline functionality (dependent on network state)
- Works reliably when internet connection is restored

## How to Install

### Android
1. Open the app in Chrome
2. Tap the menu (⋯) and select "Install app"
3. Tap "Install"
4. The app appears on your home screen

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Name the app and tap "Add"
5. The app appears on your home screen

## Quick Access

### From Home Screen Shortcuts (Android)
1. Long-press the Budget App icon
2. Select "Add Expense" or "Add Income"
3. Quick entry form opens
4. Fill amount, category (if expense), date, and optional description
5. Tap "Add" to save

### Direct URLs
- Quick add expense: `https://yourapp.com/quick?type=expense`
- Quick add income: `https://yourapp.com/quick?type=income`

## PWA Configuration Files

### `/public/manifest.json`
- Defines app name, icons, theme colors
- Sets up app shortcuts
- Configures display mode and orientation

### `next.config.ts`
- next-pwa integration
- Service worker generation
- Automatic offline support

### `app/components/InstallPrompt.tsx`
- Shows install promotion banner
- Handles beforeinstallprompt event
- User can dismiss or install

### `app/quick/page.tsx`
- Optimized quick entry interface
- Large amount input for easy mobile entry
- Minimal UI for fast interactions

## Icon Files

The following icons are auto-generated and used:
- `icon-192.png` - App icon (192x192)
- `icon-512.png` - App icon (512x512)
- `icon-192-maskable.png` - Adaptive icon (192x192)
- `icon-512-maskable.png` - Adaptive icon (512x512)
- `icon-shortcut-expense-192.png` - Expense shortcut icon
- `icon-shortcut-income-192.png` - Income shortcut icon

## Building for Production

```bash
npm run build
```

The PWA is automatically optimized for production:
- Service worker is generated
- Assets are precached
- Offline support is enabled

## Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Check "Offline" to test offline mode
4. Go to Application → Manifest to verify manifest.json

### Lighthouse
1. Run Lighthouse audit (DevTools → Lighthouse)
2. Check PWA score
3. Follow recommendations for optimization

## Tech Stack

- **Framework**: Next.js 16 with next-pwa
- **Service Worker**: Workbox (built-in with next-pwa)
- **Offline**: Service worker caching
- **Manifest**: Web App Manifest 1.0

## Notes

- The app is designed mobile-first
- Portrait orientation is preferred
- Dark green (#2d7a4f) theme carries through to device UI
- App works seamlessly on iOS and Android
- Service worker auto-updates in production
