let isScrapingActive = false;

chrome.storage.local.get('consentGiven', (result) => {
  if (!result.consentGiven) {
    console.log('SalesPilot: Waiting for user consent to scrape data');
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_SCRAPING') {
    startScraping(message.scrapeType, sendResponse);
    return true;
  }
  
  if (message.type === 'STOP_SCRAPING') {
    isScrapingActive = false;
    sendResponse({ success: true });
  }
});

async function startScraping(scrapeType, sendResponse) {
  isScrapingActive = true;
  
  try {
    let data;
    
    if (scrapeType === 'company') {
      data = await scrapeCompanyPage();
    } else if (scrapeType === 'connections') {
      data = await scrapeConnectionsPage();
    } else if (scrapeType === 'people') {
      data = await scrapePeoplePage();
    }
    
    sendResponse({ success: true, data });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

async function scrapeCompanyPage() {
  await scrollToLoadContent();
  
  const companyData = {
    name: extractCompanyName(),
    linkedinUrl: window.location.href,
    industry: extractCompanyIndustry(),
    size: extractCompanySize(),
    location: extractCompanyLocation(),
    website: extractCompanyWebsite(),
  };
  
  const people = [];
  const peopleElements = document.querySelectorAll('[data-x--people-card]') || 
                        document.querySelectorAll('.org-people-profile-card');
  
  peopleElements.forEach((element) => {
    if (!isScrapingActive) return;
    
    const person = extractPersonData(element);
    if (person.name) {
      people.push(person);
    }
  });
  
  return {
    companies: [companyData],
    people: people,
    timestamp: new Date().toISOString()
  };
}

async function scrapeConnectionsPage() {
  await scrollToLoadContent();
  
  const people = [];
  const connectionCards = document.querySelectorAll('.mn-connection-card') ||
                          document.querySelectorAll('[data-x--profile-card]');
  
  connectionCards.forEach((card) => {
    if (!isScrapingActive) return;
    
    const person = extractPersonData(card);
    if (person.name) {
      people.push(person);
    }
  });
  
  return {
    people: people,
    timestamp: new Date().toISOString()
  };
}

async function scrapePeoplePage() {
  await scrollToLoadContent();
  
  const people = [];
  const profileCards = document.querySelectorAll('.entity-result__item') ||
                       document.querySelectorAll('[data-x--people-card]');
  
  profileCards.forEach((card) => {
    if (!isScrapingActive) return;
    
    const person = extractPersonData(card);
    if (person.name) {
      people.push(person);
    }
  });
  
  return {
    people: people,
    timestamp: new Date().toISOString()
  };
}

function extractPersonData(element) {
  try {
    const nameEl = element.querySelector('.mn-connection-card__name') ||
                   element.querySelector('.entity-result__title-text a') ||
                   element.querySelector('[data-x--person-name]') ||
                   element.querySelector('.org-people-profile-card__profile-title');
    
    const titleEl = element.querySelector('.mn-connection-card__occupation') ||
                    element.querySelector('.entity-result__primary-subtitle') ||
                    element.querySelector('.org-people-profile-card__profile-subline');
    
    const linkEl = nameEl?.tagName === 'A' ? nameEl : nameEl?.closest('a') || 
                   element.querySelector('a[href*="/in/"]');
    
    const imgEl = element.querySelector('img[alt]');
    
    const companyEl = element.querySelector('[data-x--company]') ||
                      element.querySelector('.entity-result__secondary-subtitle');
    
    return {
      name: nameEl?.textContent?.trim() || '',
      title: titleEl?.textContent?.trim(),
      company: companyEl?.textContent?.trim(),
      linkedinUrl: linkEl?.href ? new URL(linkEl.href, window.location.origin).href : undefined,
      profileImageUrl: imgEl?.src
    };
  } catch (error) {
    console.error('Error extracting person data:', error);
    return { name: '' };
  }
}

function extractCompanyName() {
  const nameEl = document.querySelector('h1.org-top-card-summary__title') ||
                 document.querySelector('[data-x--company-name]') ||
                 document.querySelector('h1');
  return nameEl?.textContent?.trim() || '';
}

function extractCompanyIndustry() {
  const industryEl = document.querySelector('.org-top-card-summary__industry') ||
                     document.querySelector('[data-x--industry]');
  return industryEl?.textContent?.trim();
}

function extractCompanySize() {
  const sizeEl = document.querySelector('.org-top-card-summary__company-size') ||
                 Array.from(document.querySelectorAll('dd')).find(el => 
                   el.textContent.includes('employees')
                 );
  return sizeEl?.textContent?.trim();
}

function extractCompanyLocation() {
  const locationEl = document.querySelector('.org-top-card-summary__headquarter') ||
                     document.querySelector('[data-x--location]');
  return locationEl?.textContent?.trim();
}

function extractCompanyWebsite() {
  const websiteEl = document.querySelector('a[data-x--website]') ||
                    Array.from(document.querySelectorAll('a')).find(a => 
                      a.href && !a.href.includes('linkedin.com')
                    );
  return websiteEl?.href;
}

async function scrollToLoadContent() {
  const scrollDelay = () => new Promise(resolve => 
    setTimeout(resolve, Math.random() * 1000 + 500)
  );
  
  const maxScrolls = 5;
  let scrollCount = 0;
  
  while (scrollCount < maxScrolls && isScrapingActive) {
    window.scrollBy(0, window.innerHeight * 0.7);
    await scrollDelay();
    scrollCount++;
  }
  
  window.scrollTo(0, 0);
  await scrollDelay();
}
