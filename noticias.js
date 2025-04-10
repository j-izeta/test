if (window.dataLayer[0].content.type.cms == "noticia") {

const TREBE_API_URL = "https://toolbar-backend.trebesrv.com" 
// const TREBE_API_URL = "http://localhost:8080" 
let translationElementSelectors;
let sourceLanguage = getSiteLang();
let targetLanguage;

function getSiteLang() {
  const siteLang = document.querySelector("html").lang;
  return getHostname() === "https://www.aizu.eus" ? "eu" : siteLang;
}

const translateLabel = {
  "es": "Traducir",
  "eu": "Itzuli",
  "en": "Translate",
  "fr": "Traduire",
  "ca": "Traduir",
  "ga": "Traducir",
}

const listenLabel = {
  "es": "Escuchar",
  "eu": "Entzun",
  "en": "Listen",
  "fr": "Écouter",
  "ca": "Escoltar",
  "ga": "Escoitar",
}

const translateDropdown = ` 

<div style="display:flex; gap: 10px; margin: 10px 0px;">
    <div class="trebeToolbarDiv">
        <div class="trebeDropdown">
            <button id="trebeTranslateButton">
              <span class="btn-text">${translateLabel[sourceLanguage]}</span>
              <i class="btn-icon fas fa-language"></i>
            </button>
            <button onclick="trebeDropdownFunction()" class="trebe-dropbtn">
                <i class="fas fa-chevron-down"></i>
            </button>
            <div id="trebeDropdownContent" class="trebe-dropdown">
                <li onclick="languageSelector(this)" id="es">Español</li>
                <li onclick="languageSelector(this)" id="eu">Euskara</li>
                <li onclick="languageSelector(this)" id="en">English</li>
                <li onclick="languageSelector(this)" id="fr">Français</li>
                <li onclick="languageSelector(this)" id="ca">Català</li>
                <li onclick="languageSelector(this)" id="gl">Galego</li>
            </div>
        </div>
    </div>
    <div class="trebeToolbarDiv">
        <button id="trebeTtsButton" onclick="handleTTS()">
          <span id="trebeTtsLabel" class="btn-text">${listenLabel[sourceLanguage]}</span>
          <i id="trebeTtsIcon" class="fas fa-play"></i>
        </button>
    </div>
</div>
`;

console.log("Translation: ");

console.log("https://www.noticiasdegipuzkoa.eus");
document.querySelector(".rrss--").insertAdjacentHTML('beforeend', translateDropdown);
translationElementSelectors = [
  { selector: ".headline-article" },
  {
    selector: ".article-body",
    excludeSelectors: [".videojw-wrapper", ".article-body__embed"]
  }
];

setSelectedLanguage(sourceLanguage);

const translatePageContent = async (targetLanguage) => {

  try {

    // const response = await fetch("https://toolbar-backend.trebesrv.com/translate", {
    // const response = await fetch("http://localhost:8080/translate", {
    const response = await fetch(`${TREBE_API_URL}/translate`, {
      method: "POST",
      body: JSON.stringify({
        url: getURL(),
        targetlanguage: targetLanguage,
        selectors: translationElementSelectors
      }),
    });

    const result = await response.json();

    if (!response.ok || result?.error) {
      throw new Error("Response to API failed.");
    }

    if (result.data.length === 0) {
      throw new Error("No data received.")
    }

    return result.data;

  } catch (e) {
    throw e;
  }
};

function getHostname() {
  let host = location.host;
  host = host.split(".").length === 2 ? `www.${host}` : host;
  return location.protocol + '//' + host
}

function getURL() {
  return getHostname() + location.pathname
}

const toggleTranslationLoading = (isDisabled) => {
  const trebeTranslateButton = document.querySelector("#trebeTranslateButton");
  trebeTranslateButton.disabled = isDisabled;
  if (isDisabled) {
    trebeTranslateButton.classList.add("wait")
  } else {
    trebeTranslateButton.classList.remove("wait")
  }
  document.querySelector(".trebe-dropbtn").disabled = isDisabled;
}

const toggleBlockTTSButton = (isBlocked) => {
  const trebeTtsButton = document.querySelector("#trebeTtsButton");
  trebeTtsButton.disabled = isBlocked;
}


const translatePage = async (targetLanguage) => {

  console.log(`Translating from ${sourceLanguage} to ${targetLanguage}...`)

  if (!targetLanguage) {
    console.log("No target language specified. Won't translate.");
    return;
  }

  toggleTranslationLoading(true);
  toggleBlockTranslateButton(true);

  try {

    if (translationElementSelectors.length === 0) {
      console.log("No selector specified (variable 'translationElementSelectors' is empty)");
      return
    }

    const translatedElements = await translatePageContent(targetLanguage);
    updateTranslatedTexts(translatedElements);
    const selectors = translatedElements.map(el => el.selector)
    postTranslation(selectors);

    console.log("Translation finished.")

    // Allow all language options 
    const languageCodes = getLanguageCodes()
    languageCodes.forEach(function (item) {
      removeSelectedLanguage(item);
    });

    // Block the new language option
    setSelectedLanguage(targetLanguage);

  } catch (error) {
    console.error(error);
  } finally {
    toggleTranslationLoading(false);
    toggleBlockTranslateButton(false);
  }

}

const updateTranslatedTexts = (translatedElements) => {

  translatedElements.forEach(element => {
    const { selector, translatedHTML } = element;
    const elementToTranslate = document.querySelector(selector);
    if (elementToTranslate) elementToTranslate.outerHTML = translatedHTML;
  });

}

// Adjustments that sites need after the translation is completed.
const postTranslation = (selectors) => {

  // Force image loading if using lozad library. 
  // Only refresh the images that are inside the selectors.
  selectors.forEach(selector => {
    document.querySelectorAll(`${selector} .lozad`).forEach(element => {

      const imgSrc = element.getAttribute('data-src') || element.getAttribute('data-iesrc');
      if (imgSrc) {

        if (element.tagName === "PICTURE") {

          // Create a image to and append to the <picture> tag.
          const newImg = document.createElement("img")
          newImg.src = imgSrc;
          newImg.alt = element?.dataset.alt;

          element.appendChild(newImg)

        } else { // Mainly for <img> tags but could be more.

          // Update the src attribute.
          element.src = imgSrc
        }
      }
    });
  })

  // Refresh facebook reels if exist
  try {
    const fbReelsCount = document.querySelectorAll(".fb-post").length;
    if (fbReelsCount > 0) {
      FB.XFBML.parse();
    }
  } catch (e) {
    console.error("There has been an error refreshing the twitter widgets: ", e)
  }

  // Refresh twitter widgets if exist.
  try {
    const tweetsCount = document.querySelectorAll(".twitter-tweet").length;
    if (tweetsCount > 0) {
      twttr.widgets.load()
    }
  } catch (e) {
    console.error("There has been an error refreshing the twitter widgets: ", e)
  }

  // Refresh instragram widgets if exist.
  try {
    const instagramCount = document.querySelectorAll(".instagram-media").length;
    if (instagramCount > 0) {
      instgrm.Embeds.process()
    }
  } catch (e) {
    console.error("There has been an error refreshing the instagram widgets: ", e)
  }

}

// ---- DROPDOWN FUNCTIONS ---- //  

function getLanguageCodes() {
  const dropdown = document.querySelector("#trebeDropdownContent");
  return Array.from(dropdown.children).map(a => a.id);
}

function languageSelector(element) {

  if (element.attributes.disabled) {
    console.log("Selected language is disabled. Won't translate.")
    return;
  }

  const languageCodes = getLanguageCodes()
  const targetLanguage = element.id;

  if (languageCodes.includes(targetLanguage)) {
    translatePage(targetLanguage);
  }

}

function setSelectedLanguage(languageId) {
  document.querySelector(`#${languageId}`).setAttribute('disabled', 'disabled');
  document.querySelector(`#${languageId}`).classList.add('selectedLanguage');
}

function removeSelectedLanguage(languageId) {
  document.querySelector(`#${languageId}`).removeAttribute('disabled');
  document.querySelector(`#${languageId}`).classList.remove('selectedLanguage');
}

function trebeDropdownFunction() {
  document.getElementById('trebeDropdownContent').classList.toggle('trebeShown');
}

// Close the dropdown menu if the user clicks outside of it. Prevent closing it when the selected option is disabled
window.onclick = function (event) {
  if (!event.target.matches('.trebe-dropbtn') && event.target.getAttribute("disabled") != "disabled") {
    const dropdown = document.querySelector('.trebe-dropdown');
    if (dropdown.classList.contains('trebeShown')) {
      dropdown.classList.remove('trebeShown');
    }
  }
};

// ---- DROPDOWN STYLES ---- //  

const style = document.createElement("style");
style.innerHTML = `

:root {
    --trebe-primary-color: #343a40;
    --trebe-secondary-color: #b6c2cd;
    --trebe-background-color: #ffffff;
    --trebe-border-color: #cdd0d3;
    --trebe-hover-bg: #e9ecef;
    --trebe-dropdown-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    --trebe-btn-padding: 0.5rem;
  }
    
  /* ---- Toolbar Customization ---- */

  .trebeToolbarDiv {
    box-sizing: border-box;
    border: 1px solid var(--trebe-border-color);
    border-radius: 6px;
    padding: var(--trebe-btn-padding);
  }

  .trebeToolbarDiv,
  .trebeToolbarDiv > div {
    display: inline-flex;
    align-items: center;
    position: relative;
  }

  .trebeToolbarDiv *:disabled, .trebeToolbarDiv *[disabled] {
    cursor: not-allowed !important;
    color: var(--trebe-secondary-color) !important;
  }

  .trebeToolbarDiv .wait {
    cursor: wait !important;
  }

  .trebe-dropbtn, #trebeTtsButton {
    cursor: pointer;
  }
  
  /* ---- TTS Styles ---- */
  .tts-highlight {
    background-color: yellow !important;
  }
  
  /* ---- Dropdown Menu ---- */
  .trebe-dropdown {
    text-align: center;
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background-color: var(--trebe-background-color);
    border: 1px solid var(--trebe-border-color);
    border-radius: 4px;
    box-shadow: var(--trebe-dropdown-shadow);
    z-index: 1000;
    padding: 0 8px;
    margin: 0;
    list-style: none;
  }
  
  .trebe-dropbtn {
    border-left: 1px solid var(--trebe-hover-bg) !important;
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--trebe-primary-color);
    position: relative;
  }

  /* ---- Dropdown Items ---- */
  .trebe-dropdown li {
    user-select: none;
    color: var(--trebe-primary-color) !important;
    padding: 0.5rem 0.75rem;
    margin: 0;
    text-decoration: none;
    display: block;
    border-bottom: 1px solid var(--trebe-border-color);
    cursor: pointer;
  }
  .trebe-dropdown li:last-child {
    border-bottom: none;
  }
  .trebe-dropdown li:not([disabled]):hover {
    background-color: var(--trebe-hover-bg);
  }
  .trebeShown {
    display: block;
  }
  
  /* ---- Drop Button Styles ---- */
  .trebeToolbarDiv button {
    border: none;
    padding: 0 0.5rem;
    background-color: transparent;
    box-shadow: none;
    font: inherit;
    color: inherit;
  }

  .trebeToolbarDiv i {
    pointer-events: none; 
  }
    
  /* ---- Translate Button Style ---- */
  #trebeTranslateButton {
    cursor: default;
    color: var(--trebe-primary-color);
  }
  
  /* ---- Responsive Styles ---- */
  .btn-text {
    display: inline;
  }
  .btn-icon {
    display: none !important;
  }
  
  /* On small screens hide text labels and show icons */
  @media (max-width: 600px) {
    .btn-text {
      display: none;
    }
    .btn-icon {
      display: inline-block !important;
    }
  }

`;

document.head.appendChild(style);

// Inject FontAwesome CDN for icons
const faLink = document.createElement('link');
faLink.rel = 'stylesheet';
faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
document.head.appendChild(faLink);


// -------------------------- // 
//            TTS             //   
// -------------------------- // 


// Audio queue and sequential playback functions
const audioQueue = [];
const textQueue = [];
let selectors;
let excludedSelectors;
let isPlaying = false;
let audioStreamController = null;
let audioEl;

const textElements = ["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"]

const populateTextSelectors = (selector) => {
  return textElements.map(textElement => `${selector} ${textElement}`)
}

const loadingLabel = {
  "es": "Cargando",      
  "eu": "Kargatzen",     
  "en": "Loading",       
  "fr": "Chargement",    
  "ca": "Carregant",     
  "ga": "Cargando",      
}

const stopLabel = {
  "es": "Parar",        
  "eu": "Gelditu",      
  "en": "Stop",         
  "fr": "Arrêter",      
  "ca": "Aturar",       
  "ga": "Parar",        
}

console.log("TTS: ");

console.log("https://www.noticiasdegipuzkoa.eus");
selectors = [".headline-article h1", ".headline-article h2", ...populateTextSelectors(".article-body")]
excludedSelectors = [".article-related-news", ".new__related", ".article-body__embed", ".article-related", ".article-photo__footer"]

function handleTTS() {
  if (isPlaying) {
    stopTTS();
  } else {
    startTTS();
  }
}

async function startTTS() {

  if (!selectors) alert("No selector!")

  // Stop possible previous TTS.
  audioStreamController = new AbortController();
  setLoading()
  toggleBlockTranslateButton(true)

  try {
    // const response = await fetch("https://toolbar-backend.trebesrv.com/tts", {
    const response = await fetch(`${TREBE_API_URL}/tts`, {
      method: "POST",
      body: JSON.stringify({
        url: getURL(),
        languageCode: getLanguageCode(),
        selectors: selectors,
        excludedSelectors
      }),
      signal: audioStreamController.signal
    });
    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error || errorMessage;
      } catch (jsonError) {
        const textMessage = await response.text();
        if (textMessage) {
          errorMessage = textMessage;
        }
      }
      throw new Error(`Error fetching audio: ${errorMessage}`);
    }

    // Define the boundary used by the server
    const boundary = "--myboundary";
    const reader = response.body.getReader();
    let buffer = new Uint8Array(0);
    const decoder = new TextDecoder();
    let audioCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('Stream finished');
        break;
      }
      // Append new chunk to our buffer
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;

      // Process available parts in the buffer
      while (true) {
        // Decode as text to search for boundaries and headers.
        // The { stream: true } option tells the decoder the data might be incomplete.
        const bufferStr = decoder.decode(buffer, { stream: true });
        const boundaryIndex = bufferStr.indexOf(boundary);
        if (boundaryIndex === -1) {
          // Boundary not found – need more data.
          break;
        }

        // Find end of headers (double CRLF)
        const headerEndIndex = bufferStr.indexOf("\r\n\r\n", boundaryIndex);
        if (headerEndIndex === -1) break;

        // Extract header block as string
        const headerBlock = bufferStr.slice(boundaryIndex, headerEndIndex);

        // Extract Content-Length from header
        const lengthMatch = headerBlock.match(/Content-Length:\s*(\d+)/i);
        if (!lengthMatch) {
          console.error("Content-Length not found in header");
          // Remove processed header and continue
          const cutIndex = headerEndIndex + 4;
          buffer = buffer.slice(cutIndex);
          continue;
        }

        const contentLength = parseInt(lengthMatch[1], 10);

        // Extract the text of the sentence from the X-Sentence header (if exists)
        const sentenceMatch = headerBlock.match(/X-Sentence:\s*(.*)/i);
        let sentence = sentenceMatch ? sentenceMatch[1].trim() : "";
        // Decodificar el texto de la oración (se envió codificado)
        sentence = decodeURIComponent(sentence).replaceAll("+", " ");
        if (!textQueue.includes(sentence)) textQueue.push(sentence)

        // Determine where the audio data starts (after header block and two CRLFs)
        const audioDataStart = headerEndIndex + 4;

        // Check if the full audio data is in the buffer
        if (buffer.length < audioDataStart + contentLength) {
          // Not all audio data received yet.
          break;
        }

        // Extract the complete audio data chunk
        const audioData = buffer.slice(audioDataStart, audioDataStart + contentLength);
        audioCount++;
        // console.log(`Queueing audio ${audioCount} with ${contentLength} bytes`);
        queueAudio(audioData);

        // Remove the processed part from the buffer
        buffer = buffer.slice(audioDataStart + contentLength);
      }
    }

    console.log('Total audio chunks queued:', audioCount);

    if (audioCount === 0) {
      stopTTS();
    }

  } catch (error) {
    stopTTS();
    if (error.name === 'AbortError') {
      console.log('Stream stopped by user');
    } else {
      console.error('Error during audio stream:', error);
    }
  } finally {
    audioStreamController = null;
  }
}

const toggleBlockTranslateButton = (isBlocked) => {
  const trebeTranslateButton = document.querySelector("#trebeTranslateButton");
  trebeTranslateButton.disabled = isBlocked;
  document.querySelector(".trebe-dropbtn").disabled = isBlocked;

  // Toggle Entzun button when translation is processing.
  const trebeTtsButton = document.querySelector("#trebeTtsButton");
  trebeTtsButton.disabled = isBlocked;
}


function setLoading() {
  document.getElementById("trebeTtsLabel").textContent = `${loadingLabel[sourceLanguage]}...`
  document.getElementById("trebeTtsButton").disabled = true;
  document.getElementById("trebeTtsIcon").outerHTML = `<i id="trebeTtsIcon" class="fas fa-spinner fa-pulse"></i>`;
}

function setIsPlaying() {
  isPlaying = true
  document.getElementById("trebeTtsButton").disabled = false;
  document.getElementById("trebeTtsLabel").textContent = stopLabel[sourceLanguage]
  document.getElementById("trebeTtsIcon").outerHTML = `<i id="trebeTtsIcon" class="fa-solid fa-pause"></i>`;
}

function stopTTS() {
  if (audioStreamController) {
    audioStreamController.abort();
  }
  if (audioEl) {
    audioEl.pause()
  }
  isPlaying = false;
  document.getElementById("trebeTtsButton").disabled = false;
  document.getElementById("trebeTtsLabel").textContent = "Entzun"
  audioQueue.length = 0;
  textQueue.length = 0;
  clearHighlights()
  toggleBlockTranslateButton(false)
  document.getElementById("trebeTtsIcon").outerHTML = `<i id="trebeTtsIcon" class="fas fa-play"></i>`;
}

function queueAudio(audioBuffer) {
  audioQueue.push(audioBuffer);
  if (!isPlaying) {
    playNext();
  }
}

function highlightCurrent() {

  console.log("highlightNext()")
  const currentText = textQueue.shift().trim();
  const element = findElementByTextContent(currentText)

  if (!element) {
    return
  }

  // Highlight current text 
  highlightSentence(element, currentText)

  return element;
}


function highlightSentence(container, sentence) {

  const text = container.textContent;
  const start = text.indexOf(sentence);
  if (start === -1) return;

  const end = start + sentence.length;

  // Collect text nodes with their global positions
  const textNodes = [];
  let position = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node;

  while ((node = walker.nextNode())) {
    const length = node.textContent.length;
    textNodes.push({ node, start: position, end: position + length });
    position += length;
  }

  // Find all text nodes overlapping with the sentence's range
  const overlappingNodes = textNodes.filter(nodeInfo => nodeInfo.start < end && nodeInfo.end > start);

  overlappingNodes.forEach(nodeInfo => {
    const nodeStartInSentence = Math.max(start - nodeInfo.start, 0);
    const nodeEndInSentence = Math.min(end - nodeInfo.start, nodeInfo.end - nodeInfo.start);

    // Ensure valid offsets within the current text node
    if (nodeStartInSentence >= nodeEndInSentence) return;

    const range = document.createRange();
    range.setStart(nodeInfo.node, nodeStartInSentence);
    range.setEnd(nodeInfo.node, nodeEndInSentence);

    const span = document.createElement('span');
    span.classList.add('tts-highlight');

    try {
      range.surroundContents(span);
    } catch (e) {
      audioQueue.length = 0
      textQueue.length = 0
      console.error('Error highlighting:', e);
    }
  });
}

function findElementByTextContent(searchText) {

  // Loop the selectors list
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);

    // Iterate all the elements found with that selector
    for (const element of elements) {

      // Compare the text
      if (element.textContent.includes(searchText)) {
        console.log("Element found: ", element)
        return element;
      }
    }
  }
  console.log("No element found for text: ", searchText)
}

function clearHighlights() {
  document.querySelectorAll("span.tts-highlight").forEach(span => {
    span.replaceWith(...span.childNodes);
  });
}

function playNext() {

  // Clear the previous highlight.
  clearHighlights()

  if (audioQueue.length === 0) {
    stopTTS();
    return;
  }

  // Highlight the current text.
  const highlightedElement = highlightCurrent()

  // Scroll to the highlighted element
  highlightedElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

  // Play the audio
  setIsPlaying(true)
  const currentBuffer = audioQueue.shift();
  const blob = new Blob([currentBuffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  audioEl = new Audio(url)

  audioEl.onended = () => {
    URL.revokeObjectURL(url);
    playNext();
  };

  audioEl.onerror = (e) => {
    console.error('Audio playback error:', e, audioEl.error);
    URL.revokeObjectURL(url);
    playNext();
  };

  audioEl.play().catch((err) => {
    console.error('Playback promise error:', err);
  });
}

function getLanguageCode() {
  return trebeDropdownContent.querySelector(".selectedLanguage").id;
}
  
} else {
  console.log("[TREBE] No se va a cargar el sistema de traducción porque la pagina no es una noticia.")
}