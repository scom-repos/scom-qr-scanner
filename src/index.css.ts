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
      height: 'auto',
      margin: '0 auto'
    }
  }
})

export const textCenterStyle = Styles.style({
  textAlign: 'center'
})

export const btnStopStyle = Styles.style({
  position: 'absolute',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  margin: '0 auto'
})
