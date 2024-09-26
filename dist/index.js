var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("@scom/scom-qr-scanner/index.css.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.btnStopStyle = exports.textCenterStyle = exports.qrScannerStyle = void 0;
    const Theme = components_1.Styles.Theme.ThemeVars;
    exports.qrScannerStyle = components_1.Styles.style({
        $nest: {
            '::-webkit-scrollbar': {
                width: '3px',
            },
            '::-webkit-scrollbar-thumb': {
                background: Theme.colors.primary.main,
                borderRadius: '5px',
            },
            'video': {
                width: '100%',
                height: 'auto',
                margin: '0 auto'
            }
        }
    });
    exports.textCenterStyle = components_1.Styles.style({
        textAlign: 'center'
    });
    exports.btnStopStyle = components_1.Styles.style({
        position: 'absolute',
        bottom: '2.5%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        margin: '0 auto'
    });
});
define("@scom/scom-qr-scanner/model.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Model = void 0;
    const reqs = ['qr-scanner'];
    components_2.RequireJS.config({
        baseUrl: `${components_2.application.currentModuleDir}/lib`,
        paths: {
            'qr-scanner': 'qr-scanner.min.js'
        }
    });
    class Model {
        get isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        get isHttps() {
            return window.location.protocol === 'https:';
        }
        constructor(module) {
            this._data = {};
            this.module = module;
        }
        async loadLib() {
            if (window.QRScanner)
                return;
            return new Promise((resolve, reject) => {
                try {
                    components_2.RequireJS.require(reqs, function (QRScanner) {
                        resolve(QRScanner);
                        if (!window.QRScanner) {
                            window.QRScanner = QRScanner;
                        }
                    });
                }
                catch (err) {
                    console.log(err);
                }
            });
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
            ];
        }
        async setData(value) {
            this._data = value;
        }
        getData() {
            return this._data;
        }
        getTag() {
            return this.module.tag;
        }
        setTag(value) {
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
        updateTag(type, value) {
            this.module.tag[type] = this.module.tag[type] ?? {};
            for (let prop in value) {
                if (value.hasOwnProperty(prop))
                    this.module.tag[type][prop] = value[prop];
            }
        }
        updateStyle(name, value) {
            if (value) {
                this.module.style.setProperty(name, value);
            }
            else {
                this.module.style.removeProperty(name);
            }
        }
        updateTheme() {
            const themeVar = document.body.style.getPropertyValue('--theme') || 'light';
            this.updateStyle('--text-primary', this.module.tag[themeVar]?.fontColor);
            this.updateStyle('--background-main', this.module.tag[themeVar]?.backgroundColor);
        }
        _getActions() {
            const actions = [];
            return actions;
        }
    }
    exports.Model = Model;
});
define("@scom/scom-qr-scanner", ["require", "exports", "@ijstech/components", "@scom/scom-qr-scanner/index.css.ts", "@scom/scom-qr-scanner/model.ts"], function (require, exports, components_3, index_css_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Theme = components_3.Styles.Theme.ThemeVars;
    let ScomQRScanner = class ScomQRScanner extends components_3.Module {
        constructor() {
            super(...arguments);
            this.tag = {};
        }
        static async create(options, parent) {
            let self = new this(parent, options);
            await self.ready();
            return self;
        }
        getConfigurators() {
            if (!this.model) {
                this.model = new model_1.Model(this);
            }
            return this.model.getConfigurators();
        }
        async setData(value) {
            this.model.setData(value);
        }
        getData() {
            return this.model.getData();
        }
        getTag() {
            return this.tag;
        }
        setTag(value) {
            this.model.setTag(value);
        }
        onStartQRScanner() {
            try {
                if (!this.scanner) {
                    const self = this;
                    this.scanner = new window.QRScanner(this.video, (result) => {
                        self.scanner.stop();
                        self.lbQRText.caption = result.data;
                        self.pnlScanner.visible = false;
                        self.vStackMain.visible = true;
                        self.pnlInfo.visible = true;
                    }, {
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                    });
                }
                this.scanner.start();
                this.btnStop.visible = false;
                this.pnlScanner.visible = true;
                this.vStackMain.visible = false;
                setTimeout(() => {
                    this.btnStop.visible = true;
                }, 1000);
            }
            catch (error) {
                console.error(error);
            }
        }
        onStopQRScanner() {
            this.scanner.stop();
            this.vStackMain.visible = true;
            this.pnlScanner.visible = false;
        }
        async initQRScanner() {
            await this.model.loadLib();
            const video = this.createElement('video', this.pnlVideo);
            video.setAttribute('playsinline', 'true');
            this.video = video;
            const hasCamera = await window.QRScanner.hasCamera();
            this.btnScan.enabled = hasCamera;
            this.lbError.visible = !hasCamera;
            if (!hasCamera) {
                const { isMobile, isHttps } = this.model;
                this.lbError.caption = isMobile && !isHttps ? 'The QR scanner does not support HTTP when using a mobile device. Please ensure that the website is served over HTTPS for compatibility with the scanner!' : 'No camera detected!';
            }
        }
        async onCopy() {
            try {
                await components_3.application.copyToClipboard(this.lbQRText.caption);
                this.iconCopy.name = 'check';
                this.iconCopy.fill = Theme.colors.success.main;
                if (this.copyTimer)
                    clearTimeout(this.copyTimer);
                this.copyTimer = setTimeout(() => {
                    this.iconCopy.name = 'copy';
                    this.iconCopy.fill = Theme.colors.info.main;
                }, 500);
            }
            catch { }
        }
        async init() {
            if (!this.model) {
                this.model = new model_1.Model(this);
            }
            await super.init();
            this.initQRScanner();
        }
        render() {
            return (this.$render("i-vstack", { alignItems: "center", class: index_css_1.qrScannerStyle },
                this.$render("i-vstack", { id: "vStackMain", padding: { left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }, gap: "1rem", horizontalAlignment: "center", maxWidth: 480 },
                    this.$render("i-label", { caption: "QR Scanner", font: { size: '1.5rem', bold: true, color: Theme.colors.primary.main } }),
                    this.$render("i-icon", { name: "qrcode", fill: Theme.colors.primary.main, width: 150, height: 150 }),
                    this.$render("i-label", { caption: "QR codes play a crucial role in the advertising sector, providing users with effortless access to content. Beyond advertising, QR codes are utilized in various scenarios including facilitating QR code payments, enabling automatic authorizations, and simplifying the process of ordering food at restaurants.", class: index_css_1.textCenterStyle }),
                    this.$render("i-button", { id: "btnScan", caption: "Start scan", enabled: false, font: { bold: true }, margin: { top: '1rem', bottom: '1rem' }, width: 160, maxWidth: "100%", padding: { left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }, onClick: () => this.onStartQRScanner() }),
                    this.$render("i-vstack", { id: "pnlInfo", gap: "0.75rem", visible: false, alignItems: "center" },
                        this.$render("i-label", { id: "lbQRText", border: { radius: 4, width: 1, style: 'solid', color: Theme.divider }, padding: { left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }, wordBreak: "break-all", class: index_css_1.textCenterStyle }),
                        this.$render("i-hstack", { gap: "0.5rem", verticalAlignment: "center", width: "fit-content", cursor: "pointer", onClick: () => this.onCopy() },
                            this.$render("i-icon", { id: "iconCopy", name: "copy", fill: Theme.colors.info.main, width: 18, height: 18 }),
                            this.$render("i-label", { caption: "Copy text", font: { size: '1rem', bold: true, color: Theme.colors.info.main } }))),
                    this.$render("i-label", { id: "lbError", visible: false, caption: "No camera detected", class: index_css_1.textCenterStyle, font: { color: Theme.colors.error.main } })),
                this.$render("i-panel", { id: "pnlScanner", visible: false },
                    this.$render("i-panel", { id: "pnlVideo" }),
                    this.$render("i-button", { id: "btnStop", caption: "Stop scan", visible: false, font: { bold: true }, width: 160, padding: { left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }, class: index_css_1.btnStopStyle, onClick: () => this.onStopQRScanner() }))));
        }
    };
    ScomQRScanner = __decorate([
        (0, components_3.customElements)('i-scom-qr-scanner')
    ], ScomQRScanner);
    exports.default = ScomQRScanner;
});
