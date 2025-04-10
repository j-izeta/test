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

// switch (getHostname()) {
  
//   case "https://www.aizu.eus":
//     console.log("https://www.aizu.eus");
//     selectors = [".article-title", ...populateTextSelectors("section.article-content"), ...populateTextSelectors("section.article-intro")];
//     excludedSelectors = [".restricted_info"];
//     break;

//   case "https://www.noticiasdegipuzkoa.eus":
//     console.log("https://www.noticiasdegipuzkoa.eus");
//     selectors = [".headline-article h1", ".headline-article h2", ...populateTextSelectors(".article-body")]
//     excludedSelectors = [".article-related-news", ".new__related", ".article-body__embed", ".article-related", ".article-photo__footer"]
//     break;

//   case "https://www.berria.eus":
//     console.log("https://www.berria.eus");
//     selectors = [".c-mainarticle__title", ".c-mainarticle__subtitle", ...populateTextSelectors(".c-mainarticle__body")]
//     break;

//   case "https://www.noaua.eus":
//     console.log("https://www.noaua.eus");
//     // selectors = [...populateTextSelectors(".tk-articlebody")];
//     selectors = ["#content-title", "#content-summary p", ...populateTextSelectors(".tk-articlebody")];
//     break;


//   case "https://www.orioguka.eus":
//     console.log("https://www.orioguka.eus");
//     selectors = ["#content-title", "#content-summary p", ...populateTextSelectors(".tk-articlebody")];
//     break;

//   case "https://www.goiena.eus":
//     console.log("https://www.goiena.eus");
//     excludedSelectors = ["iframe", "script"]
//     // selectors = [...populateTextSelectors(".tk-articlebody")];
//     selectors = ["#content-title", "#content-summary", ...populateTextSelectors(".tk-articlebody")];
//     break;

//   case "https://www.naiz.eus":
//     console.log("https://www.naiz.eus");
//     selectors = [".w-full-article-header__title", ".w-full-article-header__summary", ".w-full-article--right"];
//     break;

//   case "https://www.elpais.com":
//     console.log("https://www.elpais.com");
//     selectors = [".a_e_txt", ".clearfix"];
//     break;

//   default:
//     alert("TTS not implemented in this site! Origin: ", document.location.origin);
// }

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