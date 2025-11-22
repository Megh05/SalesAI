chrome.runtime.onInstalled.addListener(() => {
  console.log('SalesPilot LinkedIn Connector installed');
  chrome.storage.local.set({ consentGiven: false });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_DATA') {
    handleScrapeRequest(message.data, sendResponse);
    return true;
  }
  
  if (message.type === 'SEND_TO_SERVER') {
    handleSendToServer(message.data, sendResponse);
    return true;
  }
});

async function handleScrapeRequest(data, sendResponse) {
  try {
    const { consentGiven } = await chrome.storage.local.get('consentGiven');
    
    if (!consentGiven) {
      sendResponse({ error: 'Consent not given' });
      return;
    }

    sendResponse({ success: true, data });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

async function handleSendToServer(data, sendResponse) {
  try {
    const { apiUrl, authToken } = await chrome.storage.local.get(['apiUrl', 'authToken']);
    
    if (!apiUrl || !authToken) {
      sendResponse({ error: 'API configuration missing' });
      return;
    }

    const response = await fetch(`${apiUrl}/api/import/linkedin-extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    sendResponse({ success: true, result });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}
