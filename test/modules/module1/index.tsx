import { Module, customModule, Container } from '@ijstech/components';
import ScomQRScanner from '@scom/scom-qr-scanner';

@customModule
export default class Module1 extends Module {
    private scomQRScanner: ScomQRScanner;

    constructor(parent?: Container, options?: any) {
        super(parent, options);
    }

    private handleStartQRScanner() {
        this.scomQRScanner.start();
    }

    init() {
        super.init();
    }

    render() {
        return (
            <i-vstack
                padding={{ top: '1.25rem', bottom: '1.25rem', left: '1.25rem', right: '1.25rem' }}
                gap="1rem"
                horizontalAlignment="center"
                alignItems="center"
            >
                <i-label caption="Demo - QR Scanner" />
                <i-button
                    caption="Start scan"
                    font={{ bold: true }}
                    margin={{ top: '1rem', bottom: '1rem' }}
                    width={160}
                    maxWidth="100%"
                    padding={{ left: '1rem', right: '1rem', top: '1rem', bottom: '1rem' }}
                    onClick={this.handleStartQRScanner}
                />
                <i-scom-qr-scanner id="scomQRScanner" width="100%" />
            </i-vstack>
        )
    }
}