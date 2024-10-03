/// <amd-module name="@scom/scom-qr-scanner/index.css.ts" />
declare module "@scom/scom-qr-scanner/index.css.ts" {
    export const qrScannerStyle: string;
    export const alertStyle: string;
    export const textNoWrapStyle: string;
    export const wrapperInfoStyle: string;
    export const mdStyle: string;
    export const scaleAnimation: string;
    export const svgScanRegion: string;
}
/// <amd-module name="@scom/scom-qr-scanner/utils/bitMatrix.ts" />
declare module "@scom/scom-qr-scanner/utils/bitMatrix.ts" {
    export class BitMatrix {
        static createEmpty(width: number, height: number): BitMatrix;
        width: number;
        height: number;
        private data;
        constructor(data: Uint8ClampedArray, width: number);
        get(x: number, y: number): boolean;
        set(x: number, y: number, v: boolean): void;
        setRegion(left: number, top: number, width: number, height: number, v: boolean): void;
    }
}
/// <amd-module name="@scom/scom-qr-scanner/utils/binarizer.ts" />
declare module "@scom/scom-qr-scanner/utils/binarizer.ts" {
    import { BitMatrix } from "@scom/scom-qr-scanner/utils/bitMatrix.ts";
    export function binarize(data: Uint8ClampedArray, width: number, height: number, returnInverted: boolean): {
        binarized: BitMatrix;
        inverted: BitMatrix;
    } | {
        binarized: BitMatrix;
        inverted?: undefined;
    };
}
/// <amd-module name="@scom/scom-qr-scanner/utils/decoder/decodeData/bitStream.ts" />
declare module "@scom/scom-qr-scanner/utils/decoder/decodeData/bitStream.ts" {
    export class BitStream {
        private bytes;
        private byteOffset;
        private bitOffset;
        constructor(bytes: Uint8ClampedArray);
        readBits(numBits: number): number;
        available(): number;
    }
}
/// <amd-module name="@scom/scom-qr-scanner/utils/decoder/decodeData/index.ts" />
declare module "@scom/scom-qr-scanner/utils/decoder/decodeData/index.ts" {
    export interface Chunk {
        type: Mode;
        text: string;
    }
    export interface ByteChunk {
        type: Mode.Byte;
        bytes: number[];
    }
    export interface ECIChunk {
        type: Mode.ECI;
        assignmentNumber: number;
    }
    export type Chunks = Array<Chunk | ByteChunk | ECIChunk>;
    export interface DecodedQR {
        text: string;
        bytes: number[];
        chunks: Chunks;
        version: number;
    }
    export enum Mode {
        Numeric = "numeric",
        Alphanumeric = "alphanumeric",
        Byte = "byte",
        ECI = "eci"
    }
    export function decode(data: Uint8ClampedArray, version: number): DecodedQR | undefined;
}
/// <amd-module name="@scom/scom-qr-scanner/utils/decoder/reedsolomon/genericGFPoly.ts" />
declare module "@scom/scom-qr-scanner/utils/decoder/reedsolomon/genericGFPoly.ts" {
    export default class GenericGFPoly {
        private field;
        private coefficients;
        constructor(field: any, coefficients: Uint8ClampedArray);
        degree(): number;
        isZero(): boolean;
        getCoefficient(degree: number): number;
        addOrSubtract(other: GenericGFPoly): GenericGFPoly;
        multiply(scalar: number): any;
        multiplyPoly(other: GenericGFPoly): GenericGFPoly;
        multiplyByMonomial(degree: number, coefficient: number): any;
        evaluateAt(a: number): number;
    }
}
/// <amd-module name="@scom/scom-qr-scanner/utils/decoder/reedsolomon/genericGF.ts" />
declare module "@scom/scom-qr-scanner/utils/decoder/reedsolomon/genericGF.ts" {
    import GenericGFPoly from "@scom/scom-qr-scanner/utils/decoder/reedsolomon/genericGFPoly.ts";
    export function addOrSubtractGF(a: number, b: number): number;
    export default class GenericGF {
        primitive: number;
        size: number;
        generatorBase: number;
        zero: GenericGFPoly;
        one: GenericGFPoly;
        private expTable;
        private logTable;
        constructor(primitive: number, size: number, genBase: number);
        multiply(a: number, b: number): number;
        inverse(a: number): number;
        buildMonomial(degree: number, coefficient: number): GenericGFPoly;
        log(a: number): number;
        exp(a: number): number;
    }
}
/// <amd-module name="@scom/scom-qr-scanner/utils/decoder/reedsolomon/index.ts" />
declare module "@scom/scom-qr-scanner/utils/decoder/reedsolomon/index.ts" {
    export function decode(bytes: number[], twoS: number): Uint8ClampedArray;
}
/// <amd-module name="@scom/scom-qr-scanner/utils/decoder/version.ts" />
declare module "@scom/scom-qr-scanner/utils/decoder/version.ts" {
    export interface Version {
        infoBits: number | null;
        versionNumber: number;
        alignmentPatternCenters: number[];
        errorCorrectionLevels: Array<{
            ecCodewordsPerBlock: number;
            ecBlocks: Array<{
                numBlocks: number;
                dataCodewordsPerBlock: number;
            }>;
        }>;
    }
    export const VERSIONS: Version[];
}
/// <amd-module name="@scom/scom-qr-scanner/utils/decoder/decoder.ts" />
declare module "@scom/scom-qr-scanner/utils/decoder/decoder.ts" {
    import { BitMatrix } from "@scom/scom-qr-scanner/utils/bitMatrix.ts";
    import { DecodedQR } from "@scom/scom-qr-scanner/utils/decoder/decodeData/index.ts";
    export function decode(matrix: BitMatrix): DecodedQR | null | undefined;
}
/// <amd-module name="@scom/scom-qr-scanner/utils/locator.ts" />
declare module "@scom/scom-qr-scanner/utils/locator.ts" {
    import { BitMatrix } from "@scom/scom-qr-scanner/utils/bitMatrix.ts";
    export interface Point {
        x: number;
        y: number;
    }
    export interface QRLocation {
        topRight: Point;
        bottomLeft: Point;
        topLeft: Point;
        alignmentPattern: Point;
        dimension: number;
    }
    export function locate(matrix: BitMatrix): QRLocation[] | null;
}
/// <amd-module name="@scom/scom-qr-scanner/utils/extractor.ts" />
declare module "@scom/scom-qr-scanner/utils/extractor.ts" {
    import { BitMatrix } from "@scom/scom-qr-scanner/utils/bitMatrix.ts";
    import { QRLocation } from "@scom/scom-qr-scanner/utils/locator.ts";
    export function extract(image: BitMatrix, location: QRLocation): {
        matrix: BitMatrix;
        mappingFunction: (x: number, y: number) => {
            x: number;
            y: number;
        };
    };
}
/// <amd-module name="@scom/scom-qr-scanner/utils/scan.ts" />
declare module "@scom/scom-qr-scanner/utils/scan.ts" {
    export interface QRCode {
        binaryData: number[];
        data: string;
    }
    export interface Options {
        inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
    }
    export function decodeQRCode(data: Uint8ClampedArray, width: number, height: number, providedOptions?: Options): QRCode | null;
}
/// <amd-module name="@scom/scom-qr-scanner/utils/index.ts" />
declare module "@scom/scom-qr-scanner/utils/index.ts" {
    export { decodeQRCode } from "@scom/scom-qr-scanner/utils/scan.ts";
}
/// <amd-module name="@scom/scom-qr-scanner/model.ts" />
declare module "@scom/scom-qr-scanner/model.ts" {
    import { Module } from '@ijstech/components';
    export class Model {
        private _data;
        private module;
        get isMobile(): boolean;
        get isHttps(): boolean;
        get hasCamera(): boolean;
        constructor(module: Module);
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
        getQRCode(imageData: ImageData): Promise<import("@scom/scom-qr-scanner/utils/scan.ts").QRCode | {
            data: any;
        }>;
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
        private mdScanner;
        private pnlInfo;
        private pnlVideo;
        private lbQRText;
        private iconCopy;
        private copyTimer;
        private btnStop;
        private video;
        private scanning;
        private videoStream;
        private pnlOverlay;
        private mdAlert;
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
        start(): void;
        stop(): void;
        private handleStartQRScanner;
        private handleStopQRScanner;
        private decodeQRFromStream;
        private initQRScanner;
        private initHighLightScanRegion;
        private updateOverlay;
        private calculateScanRegion;
        private handleCopy;
        init(): Promise<void>;
        render(): any;
    }
}
