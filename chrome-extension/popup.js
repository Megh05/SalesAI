let scrapedData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const { consentGiven, apiUrl, authToken } = await chrome.storage.local.get([
    'consentGiven',
    'apiUrl',
    'authToken'
  ]);

  if (consentGiven) {
    document.getElementById('consentSection').classList.add('hidden');
    document.getElementById('configSection').classList.remove('hidden');
    
    if (apiUrl && authToken) {
      document.getElementById('apiUrl').value = apiUrl;
      document.getElementById('scrapeSection').classList.remove('hidden');
    }
  }

  document.getElementById('apiUrl').value = apiUrl || '';

  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('giveConsent').addEventListener('click', async () => {
    await chrome.storage.local.set({ consentGiven: true });
    showStatus('Consent granted. Please configure your API settings.', 'success');
    document.getElementById('consentSection').classList.add('hidden');
    document.getElementById('configSection').classList.remove('hidden');
  });

  document.getElementById('saveConfig').addEventListener('click', async () => {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const authToken = document.getElementById('authToken').value.trim();

    if (!apiUrl || !authToken) {
      showStatus('Please fill in all configuration fields', 'error');
      return;
    }

    await chrome.storage.local.set({ apiUrl, authToken });
    showStatus('Configuration saved successfully', 'success');
    document.getElementById('scrapeSection').classList.remove('hidden');
  });

  document.getElementById('scrapeCompany').addEventListener('click', () => {
    startScraping('company');
  });

  document.getElementById('scrapeConnections').addEventListener('click', () => {
    startScraping('connections');
  });

  document.getElementById('scrapePeople').addEventListener('click', () => {
    startScraping('people');
  });

  document.getElementById('sendToServer').addEventListener('click', () => {
    sendDataToServer();
  });
}

async function startScraping(scrapeType) {
  showStatus('Scraping data from page...', 'info');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes('linkedin.com')) {
    showStatus('Please navigate to a LinkedIn page first', 'error');
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { type: 'START_SCRAPING', scrapeType },
    (response) => {
      if (chrome.runtime.lastError) {
        showStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }

      if (response.error) {
        showStatus(`Error: ${response.error}`, 'error');
        return;
      }

      scrapedData = response.data;
      const peopleCount = scrapedData.people?.length || 0;
      const companyCount = scrapedData.companies?.length || 0;

      showStatus(
        `Scraped ${peopleCount} people and ${companyCount} companies`,
        'success'
      );

      document.getElementById('sendToServer').disabled = false;
    }
  );
}

async function sendDataToServer() {
  if (!scrapedData) {
    showStatus('No data to send', 'error');
    return;
  }

  showStatus('Sending data to SalesPilot...', 'info');

  chrome.runtime.sendMessage(
    { type: 'SEND_TO_SERVER', data: scrapedData },
    (response) => {
      if (response.error) {
        showStatus(`Error: ${response.error}`, 'error');
        return;
      }

      const result = response.result;
      showStatus(
        `Success! Imported ${result.processedPeople} people, ${result.processedCompanies} companies`,
        'success'
      );

      scrapedData = null;
      document.getElementById('sendToServer').disabled = true;
    }
  );
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove('hidden');

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 5000);
  }
}
