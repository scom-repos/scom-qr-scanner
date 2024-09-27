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
declare const navigator: any;
const DEFAULT_CANVAS_SIZE = 400;

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
    private iconCopy: Icon;
    private copyTimer: any;
    private btnScan: Button;
    private btnStop: Button;
    private lbError: Label;
    private video: HTMLVideoElement;
    private scanning: boolean;
    private videoStream: MediaStream;
    private pnlOverlay: Panel;

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
        const self = this;
        const video = this.video;
        this.scanning = true;

        const getResult = (stream: MediaStream) => {
            self.videoStream = stream;
            video.srcObject = stream;
            video.play();
            self.video.style.display = 'none';
            self.pnlOverlay.visible = false;
            self.vStackMain.visible = false;
            self.btnStop.visible = false;
            self.pnlScanner.visible = true;
            setTimeout(() => {
                self.video.style.display = '';
                setTimeout(() => {
                    self.updateOverlay();
                }, 500);
            }, 1000);
            video.onloadedmetadata = function () {
                self.decodeQRFromStream(video);
            }
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(function (stream: MediaStream) {
                    getResult(stream);
                })
                .catch(function (error: any) {
                    console.error('Error accessing the camera:', error);
                });
        } else {
            navigator.getUserMedia({ video: { facingMode: 'environment' } },
                (stream: MediaStream) => {
                    getResult(stream);
                },
                (error: any) => {
                    console.error('Error accessing the camera:', error);
                }
            );
        }
    }

    private onStopQRScanner() {
        this.scanning = false;
        this.videoStream.getTracks().forEach(track => track.stop());
        this.vStackMain.visible = true;
        this.pnlScanner.visible = false;
    }

    private async decodeQRFromStream(video: HTMLVideoElement) {
        if (!this.scanning) return;
        const self = this;
        const canvasElement = document.createElement('canvas');
        const canvas = canvasElement.getContext('2d');
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

        const code = await this.model.getQRCode(imageData);
        if (code?.data) {
            self.pnlInfo.visible = true;
            self.lbQRText.caption = code.data;
            this.onStopQRScanner();
        } else {
            requestAnimationFrame(() => this.decodeQRFromStream(video));
        }
    }

    private async initQRScanner() {
        const { isMobile, isHttps, hasCamera } = this.model;
        const video = this.createElement('video', this.pnlVideo) as HTMLVideoElement;
        video.setAttribute('playsinline', 'true');
        this.video = video;
        this.btnScan.enabled = hasCamera;
        this.lbError.visible = !hasCamera;
        if (!hasCamera) {
            this.lbError.caption = isMobile && !isHttps ? 'The QR scanner does not support HTTP when using a mobile device. Please ensure that the website is served over HTTPS for compatibility with the scanner!' : 'No camera detected!';
        } else {
            this.initHighLightScanRegion();
        }
    }

    private initHighLightScanRegion() {
        this.pnlOverlay.clearInnerHTML();
        this.pnlOverlay.innerHTML = '<svg viewBox="0 0 238 238" '
            + 'preserveAspectRatio="none" style="position:absolute;width:100%;height:100%;left:0;top:0;'
            + 'fill:none;stroke:#e9b213;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;">'
            + '<path d="M31 2H10a8 8 0 0 0-8 8v21M207 2h21a8 8 0 0 1 8 8v21m0 176v21a8 8 0 0 1-8 8h-21m-176 '
            + '0H10a8 8 0 0 1-8-8v-21"/></svg>';
        try {
            this.pnlOverlay.firstElementChild!.animate({ transform: ['scale(.98)', 'scale(1.01)'] }, {
                duration: 400,
                iterations: Infinity,
                direction: 'alternate',
                easing: 'ease-in-out',
            });
        } catch { }
        window.addEventListener('resize', () => { this.updateOverlay() });
    }

    private updateOverlay() {
        requestAnimationFrame(() => {
            if (!this.pnlOverlay || !this.pnlScanner?.visible) return;
            const video = this.video;
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const elementWidth = video.offsetWidth;
            const elementHeight = video.offsetHeight;
            const elementX = video.offsetLeft;
            const elementY = video.offsetTop;

            const videoStyle = window.getComputedStyle(video);
            const videoObjectFit = videoStyle.objectFit;
            const videoAspectRatio = videoWidth / videoHeight;
            const elementAspectRatio = elementWidth / elementHeight;
            let videoScaledWidth: number;
            let videoScaledHeight: number;
            switch (videoObjectFit) {
                case 'none':
                    videoScaledWidth = videoWidth;
                    videoScaledHeight = videoHeight;
                    break;
                case 'fill':
                    videoScaledWidth = elementWidth;
                    videoScaledHeight = elementHeight;
                    break;
                default:
                    if (videoObjectFit === 'cover'
                        ? videoAspectRatio > elementAspectRatio
                        : videoAspectRatio < elementAspectRatio) {
                        videoScaledHeight = elementHeight;
                        videoScaledWidth = videoScaledHeight * videoAspectRatio;
                    } else {
                        videoScaledWidth = elementWidth;
                        videoScaledHeight = videoScaledWidth / videoAspectRatio;
                    }
                    if (videoObjectFit === 'scale-down') {
                        videoScaledWidth = Math.min(videoScaledWidth, videoWidth);
                        videoScaledHeight = Math.min(videoScaledHeight, videoHeight);
                    }
            }

            const [videoX, videoY] = videoStyle.objectPosition.split(' ').map((length, i) => {
                const lengthValue = parseFloat(length);
                return length.endsWith('%')
                    ? (!i ? elementWidth - videoScaledWidth : elementHeight - videoScaledHeight) * lengthValue / 100
                    : lengthValue;
            });

            const scanRegion = this.calculateScanRegion(video);
            const regionWidth = scanRegion.width || videoWidth;
            const regionHeight = scanRegion.height || videoHeight;
            const regionX = scanRegion.x || 0;
            const regionY = scanRegion.y || 0;

            this.pnlOverlay.width = `${regionWidth / videoWidth * videoScaledWidth}px`;
            this.pnlOverlay.height = `${regionHeight / videoHeight * videoScaledHeight}px`;
            this.pnlOverlay.top = `${elementY + videoY + regionY / videoHeight * videoScaledHeight}px`;
            const isVideoMirrored = /scaleX\(-1\)/.test(video.style.transform!);
            this.pnlOverlay.left = `${elementX
                + (isVideoMirrored ? elementWidth - videoX - videoScaledWidth : videoX)
                + (isVideoMirrored ? videoWidth - regionX - regionWidth : regionX) / videoWidth * videoScaledWidth}px`;
            this.pnlOverlay.style.transform = video.style.transform;
            if (!this.btnStop.visible) this.btnStop.visible = true;
            if (!this.pnlOverlay.visible) this.pnlOverlay.visible = true;
        });
    }

    private calculateScanRegion(video: HTMLVideoElement) {
        const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
        const scanRegionSize = Math.round(2 / 3 * smallestDimension);
        return {
            x: Math.round((video.videoWidth - scanRegionSize) / 2),
            y: Math.round((video.videoHeight - scanRegionSize) / 2),
            width: scanRegionSize,
            height: scanRegionSize,
            downScaledWidth: DEFAULT_CANVAS_SIZE,
            downScaledHeight: DEFAULT_CANVAS_SIZE,
        };
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
        super.init();
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
                    <i-panel id="pnlVideo">
                        <i-panel id="pnlOverlay" visible={false} position="absolute" cursor="none" width="100%" height="100%" />
                    </i-panel>
                    <i-button
                        id="btnStop"
                        caption="Stop scan"
                        font={{ bold: true }}
                        width={160}
                        padding={{ left: '0.5rem', right: '0.5rem', top: '0.5rem', bottom: '0.5rem' }}
                        class={btnStopStyle}
                        onClick={() => this.onStopQRScanner()}
                        mediaQueries={[
                            {
                                maxWidth: '768px',
                                properties: {
                                    maxWidth: '8.125rem'
                                }
                            }
                        ]}
                    />
                </i-panel>
            </i-vstack>
        )
    }
}