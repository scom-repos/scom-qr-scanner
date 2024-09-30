import { Module } from '@ijstech/components';
import { decodeQRCode } from './utils/index';
declare const window: any;
declare const navigator: any;

export class Model {
  private _data = {};
  private module: Module;

  get isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  get isHttps() {
    return window.location.protocol === 'https:';
  }

  get hasCamera() {
    return !!((navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || navigator.getUserMedia);
  }

  constructor(module: Module) {
    this.module = module;
  }

  getConfigurators() {
    return [
      {
        name: 'Builder Configurator',
        target: 'Builders',
        getActions: () => {
          return this._getActions();
        },
        getData: this.getData.bind(this),
        setData: this.setData.bind(this),
        getTag: this.getTag.bind(this),
        setTag: this.setTag.bind(this)
      }
    ]
  }

  async setData(value: any) {
    this._data = value;
  }

  getData() {
    return this._data;
  }

  getTag() {
    return this.module.tag;
  }

  setTag(value: any) {
    const newValue = value || {};
    for (let prop in newValue) {
      if (newValue.hasOwnProperty(prop)) {
        if (prop === 'light' || prop === 'dark')
          this.updateTag(prop, newValue[prop]);
        else
          this.module.tag[prop] = newValue[prop];
      }
    }
    this.updateTheme();
  }

  private updateTag(type: 'light' | 'dark', value: any) {
    this.module.tag[type] = this.module.tag[type] ?? {};
    for (let prop in value) {
      if (value.hasOwnProperty(prop))
        this.module.tag[type][prop] = value[prop];
    }
  }

  private updateStyle(name: string, value: any) {
    if (value) {
      this.module.style.setProperty(name, value);
    } else {
      this.module.style.removeProperty(name);
    }
  }

  private updateTheme() {
    const themeVar = document.body.style.getPropertyValue('--theme') || 'light';
    this.updateStyle('--text-primary', this.module.tag[themeVar]?.fontColor);
    this.updateStyle('--background-main', this.module.tag[themeVar]?.backgroundColor);
  }

  private _getActions() {
    const actions = [];
    return actions;
  }

  async getQRCode(imageData: ImageData) {
    if (window.BarcodeDetector) {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });
      const data = await barcodeDetector.detect(imageData);
      return { data: data.rawValue };
    }
    return decodeQRCode(imageData.data, imageData.width, imageData.height);
  }
}
