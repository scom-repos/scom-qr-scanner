import { Module, customModule, Container, Label } from '@ijstech/components';
import ScomQRScanner from '@scom/scom-qr-scanner';

@customModule
export default class Module1 extends Module {
    private scomQRScanner: ScomQRScanner;

    constructor(parent?: Container, options?: any) {
        super(parent, options);
    }

    init() {
        super.init();
    }


    render() {
        return (
            <i-hstack padding={{ top: '1.25rem', bottom: '1.25rem', left: '1.25rem', right: '1.25rem' }} gap="1rem">
                <i-scom-qr-scanner id="scomQRScanner" width="100%" />
            </i-hstack>
        )
    }
}