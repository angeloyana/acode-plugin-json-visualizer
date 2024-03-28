import plugin from '../plugin.json';
import style from './style.scss';
import Ref from 'html-tag-js/Ref';

const { editor } = editorManager;
const selectionMenu = acode.require('selectionMenu');
const fileBrowser = acode.require('fileBrowser');
const fs = acode.require('fs');
const prompt = acode.require('prompt');
const select = acode.require('select');

class JSONVisualizer {
  commandName = 'JSON Visualizer';

  async init($page) {
    this.$page = $page;
    this.$page.settitle('JSON Visualizer');
    this.$page.id = 'json-visualizer';
    this.$style = tag('style', { innerHTML: style });
    document.head.appendChild(this.$style);

    this.addCommand();
    this.addSelectionMenu();
  }

  #copyText(text) {
    prompt('Copy path', text, 'text');
  }

  visualizeJSON(json) {
    this.$page.innerHTML = '';
    this.$page.append(...this.objectToHTML(json));
    this.$page.show();
  }

  objectToHTML(obj, indent = 0, prevIndexPath = '') {
    const $entries = [];
    const isObjArray = obj instanceof Array;

    if (isObjArray) obj = Object.assign({}, obj);

    Object.entries(obj).forEach(([key, value]) => {
      key = isObjArray ? `[${key}]` : key;
      const valueType = [true, false, undefined, null].includes(value)
        ? value
        : typeof value;
      const indexPath = prevIndexPath + (isObjArray ? key : `["${key}"]`);
      const indentStyle = { marginLeft: `${indent}rem` };

      let $entry;
      const $options = tag('span', {
        className: 'icon more_vert',
        onclick: async () => {
          const options = [[0, 'Copy Path']];
          const pickedOption = await select('Options', options);

          if (pickedOption === 0) {
            this.#copyText(indexPath);
          }
        }
      });

      switch (valueType) {
        case 'string':
        case 'number':
          $entry = (
            <div className="dropdown__list-item">
              <div className="inner" style={indentStyle}>
                <div className="inner-main">
                  <div className="key">
                    {key}
                    <span className="colon">:</span>
                    <span className={`value ${valueType}`}>
                      {valueType === 'string' ? `"${value}"` : value}
                    </span>
                  </div>
                </div>
                <div className="options">{$options}</div>
              </div>
            </div>
          );
          break;

        case 'object':
          const $indicator = (
            <span className="icon arrow_right indicator"></span>
          );
          const childToggler = new Ref();

          const $header = (
            <div className="dropdown__header">
              <div className="inner" style={indentStyle}>
                <div ref={childToggler} className="inner-main">
                  {$indicator}
                  <div className="key">
                    {key}
                    <span className="colon">:</span>
                    <span className="value object">
                      {value instanceof Array
                        ? `Array (${value.length})`
                        : `Object (${Object.keys(value).length})`}
                    </span>
                  </div>
                </div>
                <div className="options">{$options}</div>
              </div>
            </div>
          );

          const $list = tag('div', {
            className: 'dropdown__list dropdown__list--hidden',
            children: this.objectToHTML(value, indent + 1, indexPath)
          });

          childToggler.el.onclick = () => {
            $list.classList.toggle('dropdown__list--hidden');
            $indicator.classList.toggle('open');
            $indicator.classList.toggle('arrow_right');
            $indicator.classList.toggle('arrow_drop_down');
          };

          $entry = tag('div', {
            className: 'dropdown',
            children: [$header, $list]
          });
          break;

        default:
          $entry = (
            <div className="dropdown__list-item">
              <div className="inner" style={indentStyle}>
                <div className="inner-main">
                  <div className="key">
                    {key}
                    <span className="colon">:</span>
                    <span className={`value ${valueType}`}>
                      {String(value)}
                    </span>
                  </div>
                </div>
                <div className="options">{$options}</div>
              </div>
            </div>
          );
          break;
      }
      $entries.push($entry);
    });

    return $entries;
  }

  addCommand() {
    const exec = async () => {
      const sourceType = await select('Source', ['FILE', 'API']);
      let source;

      if (sourceType === 'FILE') {
        source = (await fileBrowser('file', 'JSON File', true)).url;
      } else {
        source = await prompt('API with JSON response', '', 'url', {
          match: /^(https?|file|content):\/\/.+/,
          placeholder: 'https://'
        });
      }

      try {
        const jsonContent = await fs(source).readFile('json');
        await this.visualizeJSON(jsonContent);
      } catch (err) {
        toast('Invalid source!');
      }
    };

    editor.commands.addCommand({ name: this.commandName, exec });
  }

  addSelectionMenu() {
    const exec = () => {
      try {
        const selectedText = editor.getSelectedText();
        const jsonData = JSON.parse(selectedText);
        this.visualizeJSON(jsonData);
      } catch (err) {
        console.error(err);
        toast('Invalid json!');
      }
    };
    selectionMenu.add(
      exec,
      <span id="json-visualizer-selection-menu" className="file"></span>,
      'selected'
    );
  }

  async destroy() {
    editor.commands.removeCommand(this.commandName);
  }
}

if (window.acode) {
  const jsonVisualizer = new JSONVisualizer();

  acode.setPluginInit(plugin.id, async (baseUrl, $page) => {
    await jsonVisualizer.init($page);
  });

  acode.setPluginUnmount(plugin.id, () => {
    jsonVisualizer.destroy();
  });
}