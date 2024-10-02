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
    Modal,
    Alert
} from '@ijstech/components';
import { alertStyle, btnStopStyle, mdStyle, qrScannerStyle, scaleAnimation, svgScanRegion, textCenterStyle } from './index.css';
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
    private mdScanner: Modal;
    private mdInfo: Modal;
    private pnlVideo: Panel;
    private lbQRText: Label;
    private iconCopy: Icon;
    private copyTimer: any;
    private btnStop: Button;
    private video: HTMLVideoElement;
    private scanning: boolean;
    private videoStream: MediaStream;
    private pnlOverlay: Panel;
    private mdAlert: Alert;

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

    start() {
        const { isMobile, isHttps, hasCamera } = this.model;
        if (!hasCamera) {
            this.mdAlert.visible = true;
            this.mdAlert.content = isMobile && !isHttps ? 'The QR scanner does not support HTTP when using a mobile device. Please ensure that the website is served over HTTPS for compatibility with the scanner!' : 'No camera detected!';
            this.mdAlert.showModal();
            return;
        }
        this.handleStartQRScanner();
    }

    stop() {
        this.handleStopQRScanner();
        if (this.mdScanner) this.mdScanner.visible = false;
    }

    private handleStartQRScanner() {
        const self = this;
        const video = this.video;
        this.scanning = true;

        const getResult = (stream: MediaStream) => {
            self.videoStream = stream;
            video.srcObject = stream;
            video.play();
            self.pnlOverlay.visible = false;
            self.mdInfo.visible = false;
            self.btnStop.visible = false;
            self.mdScanner.visible = true;
            setTimeout(() => {
                self.updateOverlay();
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

    private handleStopQRScanner() {
        this.scanning = false;
        this.videoStream.getTracks().forEach(track => track.stop());
        this.mdScanner.visible = false;
    }

    private async decodeQRFromStream(video: HTMLVideoElement) {
        if (!this.scanning) return;
        const canvasElement = document.createElement('canvas');
        const canvas = canvasElement.getContext('2d');
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

        const code = await this.model.getQRCode(imageData);
        if (code?.data) {
            this.handleStopQRScanner();
            this.lbQRText.caption = code.data;
            this.mdInfo.visible = true;
        } else {
            requestAnimationFrame(() => this.decodeQRFromStream(video));
        }
    }

    private async initQRScanner() {
        const video = this.createElement('video', this.pnlVideo) as HTMLVideoElement;
        video.setAttribute('playsinline', 'true');
        this.video = video;
        if (this.model.hasCamera) {
            this.initHighLightScanRegion();
        }
    }

    private initHighLightScanRegion() {
        this.pnlOverlay.clearInnerHTML();
        this.pnlOverlay.innerHTML = svgScanRegion;
        const overlayElement = this.pnlOverlay.firstElementChild as HTMLElement;
        if (overlayElement) {
            overlayElement.style.animation = `${scaleAnimation} 400ms infinite alternate ease-in-out`;
        }
        window.addEventListener('resize', () => { this.updateOverlay() });
    }

    private updateOverlay() {
        requestAnimationFrame(() => {
            if (!this.pnlOverlay || !this.mdScanner?.visible) return;
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
            const smallerDimension = elementHeight > elementWidth ? elementWidth : elementHeight;
            if (videoObjectFit === 'none') {
                videoScaledWidth = videoWidth;
                videoScaledHeight = videoHeight;
            } else if (videoObjectFit === 'cover' ? videoAspectRatio > elementAspectRatio : videoAspectRatio < elementAspectRatio) {
                videoScaledHeight = smallerDimension;
                videoScaledWidth = videoScaledHeight * videoAspectRatio;
            } else {
                videoScaledWidth = smallerDimension;
                videoScaledHeight = videoScaledWidth / videoAspectRatio;
            }
            const [videoX, videoY] = videoStyle.objectPosition.split(' ').map((length: string, i: number) => {
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

            const overlayTop = elementY + videoY + regionY / videoHeight * videoScaledHeight;
            const overlayHeight = regionHeight / videoHeight * videoScaledHeight;
            this.pnlOverlay.width = `${regionWidth / videoWidth * videoScaledWidth}px`;
            this.pnlOverlay.height = `${overlayHeight}px`;
            this.pnlOverlay.top = `${overlayTop}px`;
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

    private async handleCopy() {
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
            <i-panel class={qrScannerStyle}>
                <i-modal id="mdScanner" visible={false} width="100%" height="100%" overflow="hidden" class={mdStyle}>
                    <i-panel id="pnlVideo" height="100%">
                        <i-panel id="pnlOverlay" visible={false} position="absolute" cursor="none" width="100%" height="100%" />
                    </i-panel>
                    <i-button
                        id="btnStop"
                        caption="Stop scan"
                        font={{ bold: true }}
                        width={160}
                        padding={{ left: '0.5rem', right: '0.5rem', top: '0.5rem', bottom: '0.5rem' }}
                        class={btnStopStyle}
                        onClick={this.handleStopQRScanner}
                        mediaQueries={[
                            {
                                maxWidth: '768px',
                                properties: {
                                    maxWidth: '8.125rem'
                                }
                            }
                        ]}
                    />
                </i-modal>

                <i-modal
                    id="mdInfo"
                    visible={false}
                    title="Scanned QR Result"
                    width="400px"
                    height="auto"
                    maxWidth="90vw"
                    closeIcon={{ name: 'times' }}
                >
                    <i-vstack
                        gap="1rem"
                        horizontalAlignment="center"
                        alignItems="center"
                        padding={{ top: '2rem', bottom: '1rem', left: '1rem', right: '1rem' }}
                    >
                        <i-hstack
                            gap="0.75rem"
                            verticalAlignment="center"
                        >
                            <i-label
                                id="lbQRText"
                                border={{ radius: 4, width: 1, style: 'solid', color: Theme.divider }}
                                padding={{ left: '0.75rem', right: '0.75rem', top: '0.75rem', bottom: '0.75rem' }}
                                wordBreak="break-all"
                                class={textCenterStyle}
                            />
                            <i-icon
                                id="iconCopy"
                                name="copy"
                                fill={Theme.colors.info.main}
                                width={20}
                                height={20}
                                minWidth={20}
                                cursor="pointer"
                                onClick={this.handleCopy}
                            />
                        </i-hstack>
                        <i-hstack margin={{ top: '1rem' }} verticalAlignment="center" horizontalAlignment="center">
                            <i-button
                                caption="Scan again"
                                width={120}
                                border={{ radius: 5 }}
                                padding={{ left: '0.5rem', right: '0.5rem', top: '0.5rem', bottom: '0.5rem' }}
                                onClick={this.handleStartQRScanner}
                            />
                        </i-hstack>
                    </i-vstack>
                </i-modal>

                <i-alert
                    id="mdAlert"
                    visible={false}
                    maxWidth="90%"
                    status="error"
                    title="Failed to start the scanner"
                    content="No camera detected!"
                    class={alertStyle}
                />
            </i-panel>
        )
    }
}