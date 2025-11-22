# SalesPilot LinkedIn Connector - Chrome Extension

## Legal & Ethical Data Collection

This Chrome extension collects LinkedIn data **only with explicit user consent** and **only from visible page elements** that the user can see. It does not:
- Access private or hidden data
- Violate LinkedIn's Terms of Service
- Store HTML content
- Scrape without user authorization

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. The extension icon should appear in your toolbar

## Setup

1. Click the extension icon
2. Grant consent for data collection
3. Configure your SalesPilot API URL (your Replit app URL)
4. Enter your session token from SalesPilot

### Getting Your Session Token

1. Log into your SalesPilot app
2. Open browser DevTools (F12)
3. Go to Application > Cookies
4. Find your session cookie and copy its value
5. Paste into the extension

## Usage

### Scraping Company Pages

1. Navigate to a LinkedIn company page
2. Click "Scrape Company Page" in the extension
3. Wait for scraping to complete
4. Click "Send Data to SalesPilot"

### Scraping Connections

1. Navigate to your LinkedIn connections page
2. Click "Scrape Connections"
3. Send data to SalesPilot

### Scraping People Lists

1. Navigate to any LinkedIn people search or company employees page
2. Click "Scrape People List"
3. Send data to SalesPilot

## Features

- **Consent-based**: Requires explicit user authorization
- **Throttled requests**: Random delays to avoid detection
- **Offline queue**: Retries failed uploads
- **Visible data only**: Scrapes only DOM elements you can see
- **Privacy-first**: No storage of raw HTML or private information

## Data Collected

- Person names
- Job titles
- Company names
- LinkedIn profile URLs
- Profile images (public URLs only)
- Company information (industry, size, location)

All data is sent to your SalesPilot instance and stored securely in your database.
