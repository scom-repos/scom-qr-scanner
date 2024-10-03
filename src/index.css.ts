import { Styles } from '@ijstech/components';
const Theme = Styles.Theme.ThemeVars;

export const qrScannerStyle = Styles.style({
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
      height: '100%',
      objectFit: 'cover'
    }
  }
})

export const alertStyle = Styles.style({
  $nest: {
    'i-vstack i-label': {
      textAlign: 'center'
    }
  }
})

export const textNoWrapStyle = Styles.style({
  whiteSpace: 'nowrap'
})

export const wrapperInfoStyle = Styles.style({
  position: 'absolute',
  top: 'calc(100% - 70px)',
  left: '50%',
  transform: 'translate(-50%, -100%)'
})

export const mdStyle = Styles.style({
  $nest: {
    '.modal-wrapper': {
      zIndex: 9999
    },
    '.modal': {
      padding: 0
    },
    '.i-modal_body': {
      height: '100%'
    }
  }
})

export const scaleAnimation = Styles.keyframes({
  from: {
    transform: 'scale(.98)'
  },
  to: {
    transform: 'scale(1.01)'
  }
})

export const svgScanRegion = '<svg viewBox="0 0 238 238" '
  + 'preserveAspectRatio="none" style="position:absolute;width:100%;height:100%;left:0;top:0;'
  + 'fill:none;stroke:#e9b213;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;">'
  + '<path d="M31 2H10a8 8 0 0 0-8 8v21M207 2h21a8 8 0 0 1 8 8v21m0 176v21a8 8 0 0 1-8 8h-21m-176 '
  + '0H10a8 8 0 0 1-8-8v-21"/></svg>'