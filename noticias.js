console.log("SCRIPT LOADED")

let translationElementSelectors;
let sourceLanguage = document.querySelector("html").lang;
let targetLanguage;

const translateLabel = {
    "es": "Traducir",
    "eu": "Itzuli",
    "en": "Translate",
    "fr": "Traduire",
    "ca": "Traduir",
    "ga": "Traducir",
}

const translateDropdown = ` 
<div class="tk-itzuli">
    <div class="trebeDropdown">
        <button id="itzuliButton" class="translate" onclick="translatePage()">${translateLabel[sourceLanguage]}</button>
        <button onclick="trebeDropdownFunction()" class="dropbtn"></button>
        <div id="trebeDropdownContent" class="dropdown-content">
            <a href="#" onclick="languageSelector(this)" id="es" class="">Español</a>
            <a href="#" onclick="languageSelector(this)" id="eu" class="">Euskara</a>
            <a href="#" onclick="languageSelector(this)" id="en" class="">English</a>
            <a href="#" onclick="languageSelector(this)" id="fr" class="">Français</a>
            <a href="#" onclick="languageSelector(this)" id="ca" class="">Català</a>
            <a href="#" onclick="languageSelector(this)" id="gl" class="">Galego</a>
        </div>
    </div>
</div>
<div class="tk-entzun">
    <div class="elhuyarDropdown">
    <button id="playerIndicator" class="play" onclick="handleAudioStream()">
        Entzun
        <span id="playerIndicator" class="playbotoia play" accesskey="p" title="Entzun (Alt+Shift+P)"></span>
    </button>
    </div>
</div>
`;

switch (document.location.origin) {

    case "https://www.noticiasdegipuzkoa.eus":
        console.log("https://www.noticiasdegipuzkoa.eus");
        document.querySelector(".rrss--").insertAdjacentHTML('beforeend', translateDropdown);
        translationElementSelectors = [
            { selector: ".headline-article" },
            {
                selector: ".article-body",
                excludeSelectors: [".videojw-wrapper", ".article-body__embed"]
            }
        ];
        break;

    case "https://www.berria.eus":
        console.log("https://www.berria.eus");
        document.querySelector(".m-author__text").insertAdjacentHTML('beforeend', translateDropdown);
        translationElementSelectors = [
            { selector: ".c-mainarticle__top" },
            { selector: ".c-mainarticle__body" }
        ];
        break;

    case "https://noaua.eus":
        console.log("https://noaua.eus");
        document.querySelector(".tk-adimen").insertAdjacentHTML('beforeend', translateDropdown);
        translationElementSelectors = [
            { selector: "#content-title" },
            { selector: "#content-summary" },
            { selector: ".tk-articlebody" }
        ];
        break;


    case "https://orioguka.eus":
        console.log("https://orioguka.eus");
        document.querySelector(".tk-adimen").insertAdjacentHTML('beforeend', translateDropdown);
        translationElementSelectors = [
            { selector: "#content-title" },
            { selector: "#content-summary" },
            { selector: ".tk-articlebody" }
        ];
        break;

    case "https://goiena.eus":
        console.log("https://goiena.eus");
        document.querySelector(".tk-itzuli").remove(); // Quitar el que se está usando ahora en produccion.
        document.querySelector(".tk-adimen").insertAdjacentHTML('beforeend', translateDropdown);
        translationElementSelectors = [
            { selector: "#content-title" },
            { selector: "#content-summary" },
            { selector: ".tk-articlebody" }
        ];
        break;

    case "https://www.naiz.eus":
        console.log("https://www.naiz.eus");
        document.querySelector(".w-the-most__list").insertAdjacentHTML('beforeend', translateDropdown);
        translationElementSelectors = [
            { selector: ".w-full-article-header__title" },
            { selector: ".w-full-article-header__summary" },
            { selector: ".w-full-article--right" },
        ];
        break;

    case "https://elpais.com":
        console.log("https://elpais.com");
        document.querySelector(".a_m_p").insertAdjacentHTML('beforeend', translateDropdown);
        translationElementSelectors = [
            { selector: ".a_e_txt" },
            { selector: ".clearfix" },
        ];
        break;

    default:
        alert("Tool not implemented for this site! Origin: ", document.location.origin);
}

setSelectedLanguage(sourceLanguage);

const translatePageContent = async (targetLanguage) => {

    try {

        const response = await fetch("https://toolbar-backend.trebesrv.com/translate", {
        // const response = await fetch("http://localhost:8080/translate", {
            method: "POST",
            body: JSON.stringify({
                url: location.protocol + '//' + location.host + location.pathname,
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

const disableTranslateButton = () => {
    document.querySelector(".dropbtn").disabled = true;
    document.querySelector("#itzuliButton").disabled = true;
}

const enableTranslateButton = () => {
    document.querySelector(".dropbtn").disabled = false;
    document.querySelector("#itzuliButton").disabled = false;
}

const translatePage = async (targetLanguage) => {

    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}...`)

    if (!targetLanguage) {
        console.log("No target language specified. Won't translate.");
        return;
    }

    disableTranslateButton();

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

        enableTranslateButton();

    } catch (error) {
        console.error(error);
        enableTranslateButton();
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
    document.getElementById('trebeDropdownContent').classList.toggle('show');
}

// Close the dropdown menu if the user clicks outside of it. Prevent closing it when the selected option is disabled
window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName('dropdown-content');
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
};

// ---- DROPDOWN STYLES ---- //  

const style = document.createElement("style");
style.innerHTML = `

/* ⬇️ TTS ⬇️ */ 

.tts-highlight {
    background: lightgreen !important;
}

/* ⬇️ TOOLBAR PROYECT CUSTOMIZATION ⬇️ */ 

.tk-itzuli button:disabled {
    cursor: wait;
    color: #b6c2cd !important;
}

.dropdown-content a[disabled] {
    color: #9eb1c3 !important;
}   

/* Change color of dropdown links on hover */
.dropdown-content a:not([disabled]):hover {
    background-color: #e9ecef;
}



/* ⬇️ TOOLBAR FROM GOIENA ⬇️ */ 

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
  display: none;
  position: absolute;
  background-color: #ffffff;
  border: 1px solid #cdd0d3;
  border-radius: 4px;
  min-width: 150px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

/* Links inside the dropdown */
.dropdown-content a,
.dropdown-content span {
  color: #343a40 !important;
  padding: 5px 10px;
  margin: 5px;
  text-decoration: none;
  display: block;
  border-bottom: 1px solid #cdd0d3;
  font-size: 0.9rem;
}

/* Show the dropdown menu (use JS to add this class to the .dropdown-content container when the user clicks on the dropdown button) */
.show {
  display: block;
}

.tk-itzuli,
.tk-itzuli > div {
  display: inline;
  position: relative;
  cursor: pointer;
}
  
.tk-itzuli button {
  border: none;
  padding: 0px 5px;
  box-shadow: 0;
  background-color: transparent;
}

.dropbtn {
  border-left: 1px solid #e9ecef !important;
  text-indent: -4000px;
  width: 26px;
  height: 26px;
  display: inline-block;
  color: #343a40;
}

.dropbtn::after {
  position: absolute;
  top: 10px;
  right: 0;
}
.dropbtn::after {
  display: inline-block;
  width: 0px;
  height: 0px;
  margin-left: 0.255em;
  vertical-align: 0.255em;
  content: '';
  border-top: 0.4em solid;
  border-right: 0.4em solid transparent;
  border-bottom: 0;
  border-left: 0.4em solid transparent;
}

.tk-itzuli {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 5px;
}

#itzuliButton {
  font-size: 0.9rem;
  color: #343a40;
}

.tk-itzuli .dropbtn::after {
  top: 6px;
  right: 5px;
}

.tk-itzuli .dropdown-content {
  right: 0;
  min-width: 50px;
}
  
a.deskargatu::before {
  content: '';
  background: url(/static/img/tts/i_download.svg) no-repeat 0 5px;
  display: inline-block;
  height: 20px;
  width: 22px;
  margin-right: 5px;
  background-size: 18px;
}
  
a.info::before {
  content: '';
  background: url(/static/img/tts/i_info.svg) no-repeat 0 5px;
  display: inline-block;
  height: 22px;
  width: 22px;
  margin-right: 5px;
  background-size: 18px;
}

@media (max-width: 770px) {
  a.small[title='Download'] {
    color: #4c545d !important;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 5px;
    margin-right: 6px;
    text-indent: -4000px;
    display: inline-block;
    width: 40px;
    height: 31px;
    background: url('/static/img/tts/i_download.svg') no-repeat center center;
    margin-top: 0.5rem;
  }
  #itzuliButton {
    background: url('/static/img/tts/i_translate.svg') no-repeat top center;
    height: 30px;
    width: 30px;
  }
} 
`;

document.head.appendChild(style);

