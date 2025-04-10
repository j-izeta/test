// const TREBE_API_URL = "https://toolbar-backend.trebesrv.com" 
const TREBE_API_URL = "http://localhost:8080" 
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

// switch (getHostname()) {
//   case "https://www.aizu.eus":
//     console.log("https://www.aizu.eus");
//     document.querySelector(".article-aside:not(.article-content .article-aside)").insertAdjacentHTML('afterend', translateDropdown);
//     translationElementSelectors = [
//       { selector: ".article-title" },
//       { selector: ".article-content" },
//       { selector: ".article-intro" }
//     ];
//     break;

//   case "https://www.noticiasdegipuzkoa.eus":
//     console.log("https://www.noticiasdegipuzkoa.eus");
//     document.querySelector(".rrss--").insertAdjacentHTML('beforeend', translateDropdown);
//     translationElementSelectors = [
//       { selector: ".headline-article" },
//       {
//         selector: ".article-body",
//         excludeSelectors: [".videojw-wrapper", ".article-body__embed"]
//       }
//     ];
//     break;

//   case "https://www.berria.eus":
//     console.log("https://www.berria.eus");
//     document.querySelector(".m-author__text").insertAdjacentHTML('beforeend', translateDropdown);
//     translationElementSelectors = [
//       { selector: ".c-mainarticle__top" },
//       { selector: ".c-mainarticle__body" }
//     ];
//     break;

//   case "https://www.noaua.eus":
//     console.log("https://www.noaua.eus");
//     document.querySelector(".tk-entzun").remove(); // Quitar el que se está usando ahora en produccion.
//     document.querySelector(".tk-itzuli").remove(); // Quitar el que se está usando ahora en produccion.
//     document.querySelector(".tk-adimen").insertAdjacentHTML('beforeend', translateDropdown);
//     translationElementSelectors = [
//       { selector: "#content-title" },
//       { selector: "#content-summary" },
//       { selector: ".tk-articlebody" }
//     ];
//     break;


//   case "https://www.orioguka.eus":
//     console.log("https://www.orioguka.eus");
//     document.querySelector(".tk-adimen").insertAdjacentHTML('beforeend', translateDropdown);
//     translationElementSelectors = [
//       { selector: "#content-title" },
//       { selector: "#content-summary" },
//       { selector: ".tk-articlebody" }
//     ];
//     break;

//   case "https://www.goiena.eus":
//     console.log("https://www.goiena.eus");
//     document.querySelector(".tk-entzun").remove(); // Quitar el que se está usando ahora en produccion.
//     document.querySelector(".tk-itzuli").remove(); // Quitar el que se está usando ahora en produccion.
//     document.querySelector(".tk-adimen").insertAdjacentHTML('beforeend', translateDropdown);
//     translationElementSelectors = [
//       { selector: "#content-title" },
//       { selector: "#content-summary" },
//       { selector: ".tk-articlebody" }
//     ];
//     break;

//   case "https://www.naiz.eus":
//     console.log("https://www.naiz.eus");
//     document.querySelector(".w-the-most__list").insertAdjacentHTML('beforeend', translateDropdown);
//     translationElementSelectors = [
//       { selector: ".w-full-article-header__title" },
//       { selector: ".w-full-article-header__summary" },
//       { selector: ".w-full-article--right" },
//     ];
//     break;

//   case "https://www.elpais.com":
//     console.log("https://www.elpais.com");
//     document.querySelector(".a_m_p").insertAdjacentHTML('beforeend', translateDropdown);
//     translationElementSelectors = [
//       { selector: ".a_e_txt" },
//       { selector: ".clearfix" },
//     ];
//     break;

//   default:
//     alert("Translation tool not implemented in this site! Origin: ", document.location.origin);
// }

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