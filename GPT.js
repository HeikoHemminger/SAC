(function () {
  let template = document.createElement("template");
  template.innerHTML = `
    <style>
      :host {}

      div {
        margin: 50px auto;
        max-width: 600px;
      }

      .input-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      #prompt-input {
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 5px;
        width: 70%;
      }

      #generate-button {
        padding: 10px;
        font-size: 16px;
        background-color: #3cb6a9;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        width: 25%;
      }

      #generated-text {
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 5px;
        width: 96%;
      }
    </style>
    <div>
      <center>
        <img src="https://1000logos.net/wp-content/uploads/2023/02/ChatGPT-Emblem.png" width="200"/>
        <h1>ChatGPT</h1>
      </center>
      <div class="input-container">
        <input type="text" id="prompt-input" placeholder="Enter a prompt">
        <button id="generate-button">Generate Text</button>
      </div>
      <textarea id="generated-text" rows="10" cols="50" readonly></textarea>
    </div>
  `;

  class Widget extends HTMLElement {
    constructor() {
      super();
      let shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(template.content.cloneNode(true));
      this._props = {
        apiKey: "",
        max_tokens: 50,
        prompt: ""
      };

      this.promptInput = null;
      this.generatedText = null;
      this.generateButton = null;
         
      console.log("Constructor");
    }

    connectedCallback() {
      console.log("connectedCallback aufgerufen. Shadow DOM sollte bereit sein.");
      this.initMain();
      if (this.promptInput) { 
          this.promptInput.value = this._props.prompt || "";
          console.log("Initialer Prompt-Wert in connectedCallback gesetzt:", this.promptInput.value);
      } else {
           console.warn("connectedCallback: promptInput nicht gefunden nach initMain. Problem bei Initialisierung.");
      }
    }


    initMain() {
        console.log("initMain aufgerufen. Hole DOM-Elemente und hänge Listener an.");
        // Hole die Referenzen zu den DOM-Elementen und speichere sie auf der Instanz.
        this.generatedText = this.shadowRoot.getElementById("generated-text");
        this.promptInput = this.shadowRoot.getElementById("prompt-input");
        this.generateButton = this.shadowRoot.getElementById("generate-button");

        // Initialisiere generatedText nur, wenn es existiert
        if (this.generatedText) {
            this.generatedText.value = "";
        } else {
            console.warn("initMain: generated-text nicht gefunden.");
        }

        // Sicherstellen, dass der Event-Listener nur einmal hinzugefügt wird.
        if (this.generateButton && !this.generateButton._hasClickListener) {
            this.generateButton.addEventListener("click", async () => {
                const prompt = this.promptInput ? this.promptInput.value : ""; // Sicherstellen, dass promptInput existiert
                
                if (this.generatedText) {
                    this.generatedText.value = "Generating...";
                }

                try {
                    const { apiKey, max_tokens } = this._props; 
                    const response = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apiKey
                        },
                        body: JSON.stringify({
                            model: "gpt-3.5-turbo",
                            messages: [
                                {
                                    role: "user",
                                    content: prompt
                                }
                            ],
                            max_tokens: parseInt(max_tokens) || 200,
                            temperature: 0.5
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const message = data.choices[0].message.content;
                        if (this.generatedText) {
                            this.generatedText.value = message.trim();
                        }
                    } else {
                        const error = await response.json();
                        alert("OpenAI Error: " + error.error.message);
                        if (this.generatedText) {
                            this.generatedText.value = "";
                        }
                    }
                } catch (err) {
                    alert("Network error: " + err.message);
                    if (this.generatedText) {
                        this.generatedText.value = "";
                    }
                }
            });
            this.generateButton._hasClickListener = true; // Markiere, dass Listener angehängt wurde
            console.log("Generate-Button Listener hinzugefügt.");
        } else if (!this.generateButton) {
            console.warn("initMain: generate-button nicht gefunden.");
        }
         if (!this.promptInput) {
            console.warn("initMain: prompt-input nicht gefunden.");
        }
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = {
        ...this._props,
        ...changedProperties
      };
    }

    // Wird von SAC aufgerufen, wenn sich Properties ändern (z.B. Designer-Panel)
    onCustomWidgetAfterUpdate(changedProperties) {
      console.log("onCustomWidgetAfterUpdate aufgerufen mit changedProperties:", changedProperties); 
      
      // this.initMain();
      
      // if (changedProperties.prompt !== undefined) {
      //   this.setPrompt(changedProperties.prompt);
      // }
      // console.log("onCustomWidgetAfterUpdate aufgerufen.");
      // // Stellen Sie sicher, dass das ShadowRoot existiert, bevor Sie versuchen, Elemente zu manipulieren
      // if (this.shadowRoot) {
      //     const promptInput = this.shadowRoot.getElementById("prompt-input");
      //     if (promptInput && promptInput.value !== this._props.prompt) { // Nur aktualisieren, wenn sich der Wert geändert hat
      //         promptInput.value = this._props.prompt;
      //         console.log("Prompt-Input-Feld aktualisiert zu:", this._props.prompt);
      //     }
      // }
    }
    setPrompt(newPromptValue) {
        console.log("setPrompt aufgerufen mit:", newPromptValue);
        this._props.prompt = newPromptValue; // Internen Wert aktualisieren
    
        // Direkter Zugriff auf das prompt-input-Feld und Wert setzen
        const promptInput = this.shadowRoot?.getElementById("prompt-input");
        if (this.promptInput) {
            this.promptInput.value = newPromptValue;
            console.log("Prompt-Input-Feld in setPrompt direkt aktualisiert zu:", newPromptValue);
        } else {
            // Dieser Log wird kommen, wenn setPrompt zu früh im Skript aufgerufen wird,
            // bevor connectedCallback/initMain gelaufen ist und die Referenzen gesetzt hat.
            console.warn("setPrompt: promptInput Referenz nicht verfügbar. Element nicht gefunden. Wurde connectedCallback/initMain ausgeführt?");
        }
    }
  }
customElements.define("com-heikohemminger-sap-gptwidget", Widget);
})();
  // Angepasster Widget
