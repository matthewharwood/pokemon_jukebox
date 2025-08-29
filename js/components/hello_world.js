class HelloWorld extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .container {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          color: white;
          text-align: center;
          transition: transform 0.3s ease;
        }
        
        .container:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        
        p {
          margin: 0;
          opacity: 0.9;
        }
      </style>
      
      <div class="container">
        <h1>Hello World!</h1>
        <p>This is a Web Component built with ES6 modules</p>
      </div>
    `;
  }
}

customElements.define('hello-world', HelloWorld);

export default HelloWorld;