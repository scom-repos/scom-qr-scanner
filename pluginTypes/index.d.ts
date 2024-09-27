/// <amd-module name="@scom/scom-qr-scanner/index.css.ts" />
declare module "@scom/scom-qr-scanner/index.css.ts" {
    export const qrScannerStyle: string;
    export const textCenterStyle: string;
    export const btnStopStyle: string;
}
/// <amd-module name="@scom/scom-qr-scanner/model.ts" />
declare module "@scom/scom-qr-scanner/model.ts" {
    import { Module } from '@ijstech/components';
    export class Model {
        private _data;
        private module;
        get isMobile(): boolean;
        get isHttps(): boolean;
        constructor(module: Module);
        loadLib(): Promise<unknown>;
        getConfigurators(): {
            name: string;
            target: string;
            getActions: () => any[];
            getData: any;
            setData: any;
            getTag: any;
            setTag: any;
        }[];
        setData(value: any): Promise<void>;
        getData(): {};
        getTag(): any;
        setTag(value: any): void;
        private updateTag;
        private updateStyle;
        private updateTheme;
        private _getActions;
    }
}
/// <amd-module name="@scom/scom-qr-scanner" />
declare module "@scom/scom-qr-scanner" {
    import { Module, Container, ControlElement } from '@ijstech/components';
    interface ScomQRScannerElement extends ControlElement {
    }
    global {
        namespace JSX {
            interface IntrinsicElements {
                ["i-scom-qr-scanner"]: ScomQRScannerElement;
            }
        }
    }
    export default class ScomQRScanner extends Module {
        tag: any;
        private model;
        private vStackMain;
        private pnlScanner;
        private pnlVideo;
        private pnlInfo;
        private lbQRText;
        private lbError;
        private iconCopy;
        private btnScan;
        private btnStop;
        private copyTimer;
        private video;
        private scanner;
        static create(options?: ScomQRScannerElement, parent?: Container): Promise<ScomQRScanner>;
        getConfigurators(): {
            name: string;
            target: string;
            getActions: () => any[];
            getData: any;
            setData: any;
            getTag: any;
            setTag: any;
        }[];
        setData(value: any): Promise<void>;
        getData(): {};
        getTag(): any;
        setTag(value: any): void;
        stop(): void;
        private onStartQRScanner;
        private onStopQRScanner;
        private initQRScanner;
        private onCopy;
        init(): Promise<void>;
        render(): any;
    }
}
