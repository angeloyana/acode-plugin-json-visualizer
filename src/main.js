import plugin from '../plugin.json';
import style from './style.scss';
import Ref from 'html-tag-js/Ref';
import JSON5 from 'json5';

const { clipboard } = cordova.plugins;
const { editor } = editorManager;
const appSettings = acode.require('settings');
const selectionMenu = acode.require('selectionMenu');
const fileBrowser = acode.require('fileBrowser');
const fs = acode.require('fs');
const prompt = acode.require('prompt');
const select = acode.require('select');

class JSONVisualizer {
  commandName = 'JSON Visualizer';
  settings = {
    copyArrayIndent: 0,
    copyObjectIndent: 2,
    stringColor: '#DCD67A',
    numberColor: '#6471D6',
    arrayColor: '#6B6B6B',
    objectColor: '#6B6B6B',
    trueColor: '#6471D6',
    falseColor: '#D56464',
    undefinedColor: '#D56464',
    nullColor: '#D56464'
  };

  async init($page) {
    this.$page = $page;
    this.$page.settitle('JSON Visualizer');
    this.$page.id = 'json-visualizer';
    this.$style = tag('style', { innerHTML: style });
    document.head.appendChild(this.$style);

    this.addCommand();
    this.addSelectionMenu();
  }

  #syncSettings() {
    if (appSettings.get(plugin.id)) {
      this.settings = appSettings.get(plugin.id);
    } else {
      appSettings.value[plugin.id] = this.settings;
      appSettings.update(undefined, false);
    }
  }

  #copyText(text) {
    const onCopy = () => toast(strings['copied to clipboard']);
    clipboard.copy(text, onCopy);
  }

  #getValueColor(value) {
    if (value instanceof Array) return this.settings.arrayColor;
    if (value instanceof Object) return this.settings.objectColor;
    if (typeof value === 'string') return this.settings.stringColor;
    if (typeof value === 'number') return this.settings.numberColor;
    if (value === true) return this.settings.trueColor;
    if (value === false) return this.settings.falseColor;
    if (value === undefined) return this.settings.undefinedColor;
    if (value === null) return this.settings.nullColor;
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
      const valueStyle = { color: this.#getValueColor(value) };

      let $entry;
      const $options = tag('span', {
        className: 'icon more_vert',
        onclick: async () => {
          const options = [
            [0, 'Copy path'],
            [1, 'Copy value']
          ];
          const pickedOption = await select('Options', options);

          if (pickedOption === 0) {
            this.#copyText(indexPath);
          }

          if (pickedOption === 1) {
            let textToCopy;
            if (value instanceof Array) {
              textToCopy = JSON.stringify(
                value,
                null,
                this.settings.copyArrayIndent
              );
            } else if (value instanceof Object) {
              textToCopy = JSON.stringify(
                value,
                null,
                this.settings.copyObjectIndent
              );
            } else {
              textToCopy = value;
            }
            this.#copyText(textToCopy);
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
                    <span style={valueStyle}>
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
                    <span style={valueStyle}>
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
                    <span style={valueStyle}>{String(value)}</span>
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
        const rawJSON = await fs(source).readFile('utf-8');
        const jsonContent = JSON5.parse(rawJSON);
        await this.visualizeJSON(jsonContent);
      } catch (err) {
        toast('Invalid source!');
      }
    };

    editor.commands.addCommand({ name: this.commandName, exec });
  }

  addSelectionMenu() {
    const exec = () => {
      let jsonData;
      try {
        const selectedText = editor.getSelectedText();
        jsonData = JSON5.parse(selectedText);
      } catch (err) {
        toast('Invalid json!');
      }
      this.visualizeJSON(jsonData);
    };
    selectionMenu.add(
      exec,
      <span id="json-visualizer-selection-menu" className="file"></span>,
      'selected'
    );
  }

  get settingsList() {
    this.#syncSettings();

    return [
      {
        key: 'copyArrayIndent',
        text: 'Copy value indent (Array)',
        info: 'Changes copied array indent size',
        prompt: 'Array indent size',
        promptType: 'number',
        value: this.settings.copyArrayIndent
      },
      {
        key: 'copyObjectIndent',
        text: 'Copy value indent (Object)',
        info: 'Changes copied object indent size',
        prompt: 'Object indent size',
        promptType: 'number',
        value: this.settings.copyObjectIndent
      },
      {
        key: 'stringColor',
        text: 'String color',
        color: true,
        value: this.settings.stringColor
      },
      {
        key: 'numberColor',
        text: 'Number color',
        color: true,
        value: this.settings.numberColor
      },
      {
        key: 'arrayColor',
        text: 'Array color',
        color: true,
        value: this.settings.arrayColor
      },
      {
        key: 'objectColor',
        text: 'Object color',
        color: true,
        value: this.settings.objectColor
      },
      {
        key: 'trueColor',
        text: 'True color',
        color: true,
        value: this.settings.trueColor
      },
      {
        key: 'falseColor',
        text: 'False color',
        color: true,
        value: this.settings.falseColor
      },
      {
        key: 'undefinedColor',
        text: 'Undefined color',
        color: true,
        value: this.settings.undefinedColor
      },
      {
        key: 'nullColor',
        text: 'Null color',
        color: true,
        value: this.settings.nullColor
      }
    ];
  }

  onSettingsChange(key, value) {
    this.settings[key] = value;
    appSettings.value[plugin.id] = this.settings;
    appSettings.update(undefined, false);
  }

  async destroy() {
    editor.commands.removeCommand(this.commandName);
  }
}

if (window.acode) {
  const jsonVisualizer = new JSONVisualizer();

  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page) => {
      await jsonVisualizer.init($page);
    },
    {
      list: jsonVisualizer.settingsList,
      cb: jsonVisualizer.onSettingsChange.bind(jsonVisualizer)
    }
  );

  acode.setPluginUnmount(plugin.id, () => {
    jsonVisualizer.destroy();
  });
}
