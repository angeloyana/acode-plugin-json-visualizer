# JSON Visualizer

The JSON Visualizer is a plugin designed to simplify the navigation of complex JSON structures, making it an ideal tool for visualizing API responses, configuration files, and much more.

<details>
  <summary>
    <strong>Updates</strong>
  </summary>
  <details>
    <summary>
      <strong>1.1.0</strong>
    </summary>
    <ul>
      <li>
        New:
        <ul>
          <li>Can now customize values color and <code>Copy value</code> indent size for array and object.</li>
        </ul>
      </li>
      <li>
        Update:
        <ul>
          <li>Added new option <code>Copy value</code> on json elements option list</li>
        </ul>
      </li>
    </ul>
  </details>
  <details>
    <summary>
      <strong>1.0.3</strong>
    </summary>
    <ul>
      <li>
        <code>Copy path</code> now copies the index path to clipboard right away.
      </li>
    </ul>
  </details>
  <details>
    <summary>
      <strong>1.0.2</strong>
    </summary>
    <ul>
      <li>Fixed cannot parse some json source.</li>
    </ul>
  </details>
  <details>
    <summary>
      <strong>1.0.1</strong>
    </summary>
    <ul>
      <li>Optimized visualizer</li>
      <li>Visualizer is now responsive to acode theme</li>
    </ul>
  </details>
</details>

---

## 🚀 Features

* **Multiple source:** Visualize JSON data from files, API responses, or directly within the code editor.

* **Index Path Copying:** Easily copy index paths for specific JSON elements.

* **Hierarchical Structure:** Uses hierarchical view and has collapsible JSON elements making it easier to navigate with.

## 🛠 Usage

There are 2 ways to visualize JSON data:

1. **Code Editor:** Select JSON text within the code editor and click the `json icon` in the [selection menu](https://acode.app/plugin-docs/selection-menu) for instant visualization.

2. **Command Palette:** Access the `JSON Visualizer` through the command palette to visualize JSON data from files and API responses.

To configure JSON Visualizer settings, go to `Settings > Plugins > JSON Visualizer` Then, click the settings icon on the top-right corner.

## Limitations

* Can only take the url of an api.
