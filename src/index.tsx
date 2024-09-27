import {
    Module,
    Container,
    ControlElement,
    customElements,
    Panel,
    Styles,
    Button,
    application,
    Label,
    Icon,
    VStack
} from '@ijstech/components';
import { btnStopStyle, qrScannerStyle, textCenterStyle } from './index.css';
import { Model } from './model';
const Theme = Styles.Theme.ThemeVars;
declare const window: any;

interface ScomQRScannerElement extends ControlElement {

}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ["i-scom-qr-scanner"]: ScomQRScannerElement;
        }
    }
}


@customElements('i-scom-qr-scanner')
export default class ScomQRScanner extends Module {
    tag: any = {};
    private model: Model;
    private vStackMain: VStack;
    private pnlScanner: Panel;
    private pnlVideo: Panel;
    private pnlInfo: Panel;
    private lbQRText: Label;
    private lbError: Label;
    private iconCopy: Icon;
    private btnScan: Button;
    private btnStop: Button;
    private copyTimer: any;
    private video: HTMLVideoElement;
    private scanner: any;

    static async create(options?: ScomQRScannerElement, parent?: Container) {
        let self = new this(parent, options);
        await self.ready();
        return self;
    }

    getConfigurators() {
        if (!this.model) {
            this.model = new Model(this);
        }
        return this.model.getConfigurators();
    }

    async setData(value: any) {
        this.model.setData(value);
    }

    getData() {
        return this.model.getData();
    }

    getTag() {
        return this.tag;
    }

    setTag(value: any) {
        this.model.setTag(value);
    }

    stop() {
        this.onStopQRScanner();
        if (this.pnlInfo) this.pnlInfo.visible = false;
    }

    private onStartQRScanner() {
        try {
            if (!this.scanner) {
                const self = this;
                this.scanner = new window.QRScanner(
                    this.video,
                    (result: any) => {
                        self.scanner.stop();
                        self.lbQRText.caption = result.data;
                        self.pnlScanner.visible = false;
                        self.vStackMain.visible = true;
                        self.pnlInfo.visible = true;
                    },
                    {
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                    }
                )
            }
            this.scanner.start();
            this.btnStop.visible = false;
            this.pnlScanner.visible = true;
            this.vStackMain.visible = false;
            setTimeout(() => {
                this.btnStop.visible = true;
            }, 1000)
        } catch (error) {
            console.error(error);
        }
    }

    private onStopQRScanner() {
        if (this.scanner) {
            this.scanner.stop();
            this.vStackMain.visible = true;
            this.pnlScanner.visible = false;
        }
    }

    private async initQRScanner() {
        await this.model.loadLib();
        const video = this.createElement('video', this.pnlVideo) as HTMLVideoElement;
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

    private async onCopy() {
        try {
            await application.copyToClipboard(this.lbQRText.caption);
            this.iconCopy.name = 'check';
            this.iconCopy.fill = Theme.colors.success.main;
            if (this.copyTimer) clearTimeout(this.copyTimer);
            this.copyTimer = setTimeout(() => {
                this.iconCopy.name = 'copy';
                this.iconCopy.fill = Theme.colors.info.main;
            }, 500)
        } catch { }
    }

    async init() {
        if (!this.model) {
            this.model = new Model(this);
        }
        await super.init();
        this.initQRScanner();
    }

    render() {
        return (
            <i-vstack alignItems="center" class={qrScannerStyle}>
                <i-vstack
                    id="vStackMain"
                    padding={{ left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }}
                    gap="1rem"
                    horizontalAlignment="center"
                    maxWidth={480}
                >
                    <i-label caption="QR Scanner" font={{ size: '1.5rem', bold: true, color: Theme.colors.primary.main }} />
                    <i-icon name="qrcode" fill={Theme.colors.primary.main} width={150} height={150} />
                    <i-label
                        caption="QR codes play a crucial role in the advertising sector, providing users with effortless access to content. Beyond advertising, QR codes are utilized in various scenarios including facilitating QR code payments, enabling automatic authorizations, and simplifying the process of ordering food at restaurants."
                        class={textCenterStyle}
                    />
                    <i-button
                        id="btnScan"
                        caption="Start scan"
                        enabled={false}
                        font={{ bold: true }}
                        margin={{ top: '1rem', bottom: '1rem' }}
                        width={160}
                        maxWidth="100%"
                        padding={{ left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }}
                        onClick={() => this.onStartQRScanner()}
                    />
                    <i-vstack id="pnlInfo" gap="0.75rem" visible={false} alignItems="center">
                        <i-label
                            id="lbQRText"
                            border={{ radius: 4, width: 1, style: 'solid', color: Theme.divider }}
                            padding={{ left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }}
                            wordBreak="break-all"
                            class={textCenterStyle}
                        />
                        <i-hstack gap="0.5rem" verticalAlignment="center" width="fit-content" cursor="pointer" onClick={() => this.onCopy()}>
                            <i-icon id="iconCopy" name="copy" fill={Theme.colors.info.main} width={18} height={18} />
                            <i-label caption="Copy text" font={{ size: '1rem', bold: true, color: Theme.colors.info.main }} />
                        </i-hstack>
                    </i-vstack>
                    <i-label
                        id="lbError"
                        visible={false}
                        caption="No camera detected"
                        class={textCenterStyle}
                        font={{ color: Theme.colors.error.main }}
                    />
                </i-vstack>
                <i-panel id="pnlScanner" visible={false}>
                    <i-panel id="pnlVideo" />
                    <i-button
                        id="btnStop"
                        caption="Stop scan"
                        visible={false}
                        font={{ bold: true }}
                        width={160}
                        padding={{ left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }}
                        class={btnStopStyle}
                        onClick={() => this.onStopQRScanner()}
                        mediaQueries={[
                            {
                                maxWidth: '768px',
                                properties: {
                                    maxWidth: '8.125rem',
                                    padding: { left: '0.5rem', right: '0.5rem', top: '0.5rem', bottom: '0.5rem' }
                                }
                            }
                        ]}
                    />
                </i-panel>
            </i-vstack>
        )
    }
}