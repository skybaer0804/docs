# 디자인 시스템 문서

## 목차

1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [테마 시스템 구조](#테마-시스템-구조)
4. [색상 시스템 (Palette)](#색상-시스템-palette)
5. [타이포그래피](#타이포그래피)
6. [그림자 시스템](#그림자-시스템)
7. [컴포넌트 오버라이드](#컴포넌트-오버라이드)
8. [설정 관리 (ConfigContext)](#설정-관리-configcontext)
9. [커스터마이제이션 UI](#커스터마이제이션-ui)
10. [새로운 테마 추가하기](#새로운-테마-추가하기)
11. [사용 예제](#사용-예제)
12. [마이그레이션 가이드](#마이그레이션-가이드)

---

## 개요

이 프로젝트는 **Material-UI v7** 기반의 확장 가능한 디자인 시스템을 구현하고 있습니다. 다크/라이트 모드, 다중 프리셋 색상, 동적 타이포그래피, 그리고 실시간 커스터마이제이션을 지원합니다.

### 주요 특징

- ✅ **MUI v7 호환**: 최신 Material-UI 문법 사용
- ✅ **다크/라이트 모드**: 완전한 다크 모드 지원
- ✅ **다중 프리셋 색상**: 8개 이상의 색상 테마
- ✅ **동적 설정 관리**: localStorage 기반 설정 영속성
- ✅ **컴포넌트 오버라이드**: 전역 컴포넌트 스타일 커스터마이제이션
- ✅ **타입 안전성**: PropTypes를 통한 타입 검증
- ✅ **반응형 디자인**: Grid 시스템 기반 레이아웃

---

## 아키텍처

### 디렉토리 구조

```
src/
├── themes/                    # 테마 시스템 핵심
│   ├── index.jsx             # ThemeCustomization 컴포넌트
│   ├── palette.jsx           # 색상 팔레트 생성
│   ├── typography.jsx        # 타이포그래피 설정
│   ├── shadows.jsx           # 커스텀 그림자
│   ├── compStyleOverride.jsx # 컴포넌트 스타일 오버라이드
│   └── overrides/            # 개별 컴포넌트 오버라이드
│       ├── index.js
│       └── Chip.jsx
├── scss/                      # SCSS 색상 변수
│   ├── _theme1.module.scss
│   ├── _theme2.module.scss
│   ├── _monotone.module.scss
│   └── ...
├── contexts/
│   └── ConfigContext.jsx      # 전역 설정 관리
├── hooks/
│   └── useConfig.js          # 설정 접근 훅
├── layout/
│   └── Customization/        # 커스터마이제이션 UI
│       ├── index.jsx
│       ├── ThemeMode.jsx
│       ├── PresetColor.jsx
│       └── ...
└── config.js                  # 기본 설정 상수
```

### 데이터 흐름

```
ConfigContext (localStorage)
    ↓
useConfig Hook
    ↓
ThemeCustomization Component
    ↓
Palette + Typography + Shadows
    ↓
createTheme (MUI)
    ↓
ThemeProvider
    ↓
Application Components
```

---

## 테마 시스템 구조

### ThemeCustomization 컴포넌트

테마 시스템의 진입점입니다. `useConfig` 훅을 통해 설정을 가져와 MUI 테마를 생성합니다.

```19:68:src/themes/index.jsx
export default function ThemeCustomization({ children }) {
  const { borderRadius, fontFamily, mode, outlinedFilled, presetColor, themeDirection } = useConfig();

  const theme = useMemo(() => Palette(mode, presetColor), [mode, presetColor]);

  const themeTypography = useMemo(() => Typography(theme, borderRadius, fontFamily), [theme, borderRadius, fontFamily]);
  const themeCustomShadows = useMemo(() => customShadows(mode, theme), [mode, theme]);

  const themeOptions = useMemo(
    () => ({
      direction: themeDirection,
      palette: theme.palette,
      shape: {
        borderRadius
      },
      mixins: {
        toolbar: {
          minHeight: '48px',
          padding: '16px',
          '@media (min-width: 600px)': {
            minHeight: '48px'
          }
        }
      },
      typography: themeTypography,
      customShadows: themeCustomShadows
    }),
    [themeDirection, theme, themeCustomShadows, themeTypography, borderRadius]
  );

  const themes = createTheme(themeOptions);
  themes.components = useMemo(
    () => componentStyleOverrides(themes, borderRadius, outlinedFilled),
    [themes, borderRadius, outlinedFilled]
  );

  // 초기 body 스타일 설정
  if (typeof document !== 'undefined') {
    document.body.style.backgroundColor = mode === ThemeMode.DARK ? themes.palette.dark[900] : themes.palette.background.default;
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={themes}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
```

**핵심 포인트:**

1. **useMemo 최적화**: 의존성 배열을 통해 불필요한 재계산 방지
2. **StyledEngineProvider injectFirst**: MUI 스타일이 우선 적용되도록 설정
3. **CssBaseline**: 브라우저 기본 스타일 리셋 및 일관성 유지
4. **동적 body 배경색**: 모드에 따라 body 배경색 자동 설정

---

## 색상 시스템 (Palette)

### SCSS 색상 변수 구조

각 테마는 SCSS 모듈로 정의되며, 라이트/다크 모드 색상을 모두 포함합니다.

```1:100:src/scss/_theme1.module.scss
// paper & background
$paper: #ffffff;
$background: #f8fafc;

// primary
$primaryLight: #eceff1;
$primaryMain: #607d8b;
$primaryDark: #546e7a;
$primary200: #b0bec5;
$primary800: #455a64;

// secondary
$secondaryLight: #e0f2f1;
$secondaryMain: #009688;
$secondaryDark: #00897b;
$secondary200: #80cbc4;
$secondary800: #00695c;

// success Colors
$successLight: #edf7ed;
$success200: #b6e0b3;
$successMain: #6cc067;
$successDark: #64ba5f;

// error
$errorLight: #e48784;
$errorMain: #d9534f;
$errorDark: #d54c48;

// orange
$orangeLight: #fbe9e7;
$orangeMain: #ffab91;
$orangeDark: #d84315;

// warning
$warningLight: #fdf5ea;
$warningMain: #f0ad4e;
$warningDark: #ec9c3d;

// grey
$grey50: #f8fafc;
$grey100: #eef2f6;
$grey200: #e3e8ef;
$grey300: #cdd5df;
$grey500: #697586;
$grey600: #4b5565;
$grey700: #364152;
$grey900: #121926;

// ==============================|| DARK THEME VARIANTS ||============================== //

// paper & background
$darkBackground: #0e1b23; // level 3
$darkPaper: #060d12; // level 4

// dark 800 & 900
$darkLevel1: #0b161d; // level 1
$darkLevel2: #14252f; // level 2

// primary dark
$darkPrimaryLight: #eceff1;
$darkPrimaryMain: #78919c;
$darkPrimaryDark: #587583;
$darkPrimary200: #b0bec5;
$darkPrimary800: #44606e;

// secondary dark
$darkSecondaryLight: #e0f2f1;
$darkSecondaryMain: #009688;
$darkSecondaryDark: #00897b;
$darkSecondary200: #80cbc4;
$darkSecondary800: #00695c;

// dark grey
$darkGrey50: #171e36;
$darkGrey100: #202842;
$darkGrey200: #283152;
$darkGrey300: #2c365a;
$darkGrey400: #343e66;
$darkGrey500: #3d4875;
$darkGrey600: #4a5685;
$darkGrey700: #596898;
$darkGrey900: #6b79a8;

// text variants
$darkTextTitle: #e4e8f7;
$darkTextPrimary: #d5d9e9;
$darkTextSecondary: #d8ddf0;

// chart
$chart0: #4e79a7;
$chart1: #f28e2b;
$chart2: #e15759;
$chart3: #76b7b2;
$chart4: #edc948;
$chart5: #b07aa1;
$chart6: #ff9da7;
$chart7: #9c755f;
$chart8: #bab0ac;
$chart9: #a87867;
$chart10: #6f4a47;
```

### Palette 함수

SCSS 변수를 MUI 팔레트 형식으로 변환합니다.

```20:138:src/themes/palette.jsx
export default function Palette(mode, presetColor) {
  let colors;
  switch (presetColor) {
    case 'monotone':
      colors = monotone;
      break;
    case 'theme1':
      colors = theme1;
      break;
    case 'theme2':
      colors = theme2;
      break;
    case 'theme3':
      colors = theme3;
      break;
    case 'theme4':
      colors = theme4;
      break;
    case 'theme5':
      colors = theme5;
      break;
    case 'theme6':
      colors = theme6;
      break;
    case 'theme7':
      colors = theme7;
      break;
    case 'default':
    default:
      colors = defaultColor;
  }

  return createTheme({
    palette: {
      mode,
      common: {
        black: colors.darkPaper
      },
      primary: {
        light: mode === ThemeMode.DARK ? colors.darkPrimaryLight : colors.primaryLight,
        main: mode === ThemeMode.DARK ? colors.darkPrimaryMain : colors.primaryMain,
        dark: mode === ThemeMode.DARK ? colors.darkPrimaryDark : colors.primaryDark,
        200: mode === ThemeMode.DARK ? colors.darkPrimary200 : colors.primary200,
        800: mode === ThemeMode.DARK ? colors.darkPrimary800 : colors.primary800
      },
      secondary: {
        light: mode === ThemeMode.DARK ? colors.darkSecondaryLight : colors.secondaryLight,
        main: mode === ThemeMode.DARK ? colors.darkSecondaryMain : colors.secondaryMain,
        dark: mode === ThemeMode.DARK ? colors.darkSecondaryDark : colors.secondaryDark,
        200: mode === ThemeMode.DARK ? colors.darkSecondary200 : colors.secondary200,
        800: mode === ThemeMode.DARK ? colors.darkSecondary800 : colors.secondary800
      },
      error: {
        light: colors.errorLight,
        main: colors.errorMain,
        dark: colors.errorDark
      },
      orange: {
        light: colors.orangeLight,
        main: colors.orangeMain,
        dark: colors.orangeDark
      },
      warning: {
        light: colors.warningLight,
        main: colors.warningMain,
        dark: colors.warningDark,
        contrastText: mode === ThemeMode.DARK ? colors.darkTextPrimary : colors.grey700
      },
      success: {
        light: colors.successLight,
        200: colors.success200,
        main: colors.successMain,
        dark: colors.successDark
      },
      grey: {
        50: mode === ThemeMode.DARK ? colors.darkGrey50 : colors.grey50,
        100: mode === ThemeMode.DARK ? colors.darkGrey100 : colors.grey100,
        200: mode === ThemeMode.DARK ? colors.darkGrey200 : colors.grey200,
        300: mode === ThemeMode.DARK ? colors.darkGrey300 : colors.grey300,
        400: mode === ThemeMode.DARK ? colors.darkGrey400 : colors.grey400,
        500: mode === ThemeMode.DARK ? colors.darkGrey500 : colors.grey500,
        600: mode === ThemeMode.DARK ? colors.darkGrey600 : colors.grey600,
        700: mode === ThemeMode.DARK ? colors.darkGrey700 : colors.grey700,
        900: mode === ThemeMode.DARK ? colors.darkGrey900 : colors.grey900
      },
      dark: {
        light: colors.darkTextPrimary,
        main: colors.darkLevel1,
        dark: colors.darkLevel2,
        800: colors.darkBackground,
        900: colors.darkPaper
      },
      text: {
        primary: mode === ThemeMode.DARK ? colors.darkTextPrimary : colors.grey700,
        secondary: mode === ThemeMode.DARK ? colors.darkTextSecondary : colors.grey500,
        dark: mode === ThemeMode.DARK ? colors.darkTextPrimary : colors.grey900,
        hint: colors.grey100
      },
      divider: mode === ThemeMode.DARK ? alpha(colors.grey200, 0.2) : colors.grey200,
      background: {
        paper: mode === ThemeMode.DARK ? colors.darkLevel2 : colors.paper,
        default: mode === ThemeMode.DARK ? colors.darkPaper : colors.paper
      },
      chart: {
        0: mode === ThemeMode.DARK ? colors.darkChart0 : colors.chart0,
        1: mode === ThemeMode.DARK ? colors.darkChart1 : colors.chart1,
        2: mode === ThemeMode.DARK ? colors.darkChart2 : colors.chart2,
        3: mode === ThemeMode.DARK ? colors.darkChart3 : colors.chart3,
        4: mode === ThemeMode.DARK ? colors.darkChart4 : colors.chart4,
        5: mode === ThemeMode.DARK ? colors.darkChart5 : colors.chart5,
        6: mode === ThemeMode.DARK ? colors.darkChart6 : colors.chart6,
        7: mode === ThemeMode.DARK ? colors.darkChart7 : colors.chart7,
        8: mode === ThemeMode.DARK ? colors.darkChart8 : colors.chart8,
        9: mode === ThemeMode.DARK ? colors.darkChart9 : colors.chart9,
        10: mode === ThemeMode.DARK ? colors.darkChart10 : colors.chart10
      }
    }
  });
}
```

**색상 팔레트 구조:**

- **primary/secondary**: `light`, `main`, `dark`, `200`, `800` 변형 제공
- **semantic colors**: `error`, `warning`, `success`, `orange`
- **grey scale**: 50, 100, 200, 300, 400, 500, 600, 700, 900
- **dark palette**: 다크 모드 전용 색상 레벨 (Level1, Level2, 800, 900)
- **chart colors**: 차트용 색상 팔레트 (0-10, 다크 모드 별도)

---

## 타이포그래피

### Typography 함수

MUI 타이포그래피 변형을 정의하고 커스텀 스타일을 추가합니다.

```4:131:src/themes/typography.jsx
export default function Typography(theme, borderRadius, fontFamily) {
  return {
    fontFamily,
    h6: {
      fontWeight: 500,
      color: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[600] : theme.palette.grey[900],
      fontSize: '0.75rem'
    },
    h5: {
      fontSize: '0.875rem',
      color: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[600] : theme.palette.grey[900],
      fontWeight: 500
    },
    h4: {
      fontSize: '1rem',
      color: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[600] : theme.palette.grey[900],
      fontWeight: 600
    },
    h3: {
      fontSize: '1.25rem',
      color: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[600] : theme.palette.grey[900],
      fontWeight: 600
    },
    h2: {
      fontSize: '1.5rem',
      color: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[600] : theme.palette.grey[900],
      fontWeight: 700
    },
    h1: {
      fontSize: '2.125rem',
      color: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[600] : theme.palette.grey[900],
      fontWeight: 700
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: theme.palette.text.dark
    },
    subtitle2: {
      fontSize: '0.75rem',
      fontWeight: 400,
      color: theme.palette.text.secondary
    },
    caption: {
      fontSize: '0.75rem',
      color: theme.palette.text.secondary,
      fontWeight: 400
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.334em'
    },
    body2: {
      letterSpacing: '0em',
      fontWeight: 400,
      lineHeight: '1.5em',
      color: theme.palette.text.primary
    },
    button: {
      textTransform: 'capitalize'
    },
    customInput: {
      marginTop: 1,
      marginBottom: 1,
      '& > label': {
        top: 23,
        left: 0,
        color: theme.palette.grey[500],
        '&[data-shrink="false"]': {
          top: 5
        }
      },
      '& > div > input': {
        padding: '30.5px 14px 11.5px !important'
      },
      '& legend': {
        display: 'none'
      },
      '& fieldset': {
        top: 0
      }
    },
    mainContent: {
      backgroundColor: theme.palette.mode === ThemeMode.DARK ? theme.palette.dark[800] : theme.palette.grey[100],
      width: '100%',
      minHeight: 'calc(100vh - 88px)',
      flexGrow: 1,
      padding: '20px',
      marginTop: '88px',
      marginRight: '20px',
      borderRadius: `${borderRadius}px`
    },
    menuCaption: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[600] : theme.palette.grey[900],
      padding: '6px',
      textTransform: 'capitalize',
      marginTop: '10px'
    },
    subMenuCaption: {
      fontSize: '0.6875rem',
      fontWeight: 500,
      color: theme.palette.text.secondary,
      textTransform: 'capitalize'
    },
    commonAvatar: {
      cursor: 'pointer',
      borderRadius: '8px'
    },
    smallAvatar: {
      width: '22px',
      height: '22px',
      fontSize: '1rem'
    },
    mediumAvatar: {
      width: '34px',
      height: '34px',
      fontSize: '1.2rem'
    },
    largeAvatar: {
      width: '44px',
      height: '44px',
      fontSize: '1.5rem'
    }
  };
}
```

**타이포그래피 변형:**

- **표준 MUI 변형**: h1-h6, subtitle1-2, body1-2, caption, button
- **커스텀 변형**: `customInput`, `mainContent`, `menuCaption`, `subMenuCaption`, `commonAvatar`, `smallAvatar`, `mediumAvatar`, `largeAvatar`

---

## 그림자 시스템

### customShadows 함수

모드에 따라 다른 그림자를 생성합니다.

```7:28:src/themes/shadows.jsx
function createCustomShadow(theme, color) {
  const transparent = alpha(color, 0.24);
  return {
    z1: `0 1px 2px 0 ${transparent}`,
    z8: `0 8px 16px 0 ${transparent}`,
    z12: `0 12px 24px 0 ${transparent} 0 10px 20px 0 ${transparent}`,
    z16: `0 0 3px 0 ${transparent} 0 14px 28px -5px ${transparent}`,
    z20: `0 0 3px 0 ${transparent} 0 18px 36px -5px ${transparent}`,
    z24: `0 0 6px 0 ${transparent} 0 21px 44px 0 ${transparent}`,

    primary: `0px 12px 14px 0px ${alpha(theme.palette.primary.main, 0.3)}`,
    secondary: `0px 12px 14px 0px ${alpha(theme.palette.secondary.main, 0.3)}`,
    orange: `0px 12px 14px 0px ${alpha(theme.palette.orange.main, 0.3)}`,
    success: `0px 12px 14px 0px ${alpha(theme.palette.success.main, 0.3)}`,
    warning: `0px 12px 14px 0px ${alpha(theme.palette.warning.main, 0.3)}`,
    error: `0px 12px 14px 0px ${alpha(theme.palette.error.main, 0.3)}`
  };
}

export default function customShadows(mode, theme) {
  return mode === ThemeMode.DARK ? createCustomShadow(theme, theme.palette.dark.main) : createCustomShadow(theme, theme.palette.grey[900]);
}
```

**사용 방법:**

```jsx
<Box sx={{ boxShadow: (theme) => theme.customShadows.z8 }}>
  Content
</Box>

<Box sx={{ boxShadow: (theme) => theme.customShadows.primary }}>
  Primary Shadow
</Box>
```

---

## 컴포넌트 오버라이드

### componentStyleOverrides

전역적으로 MUI 컴포넌트 스타일을 커스터마이징합니다.

```8:556:src/themes/compStyleOverride.jsx
export default function componentStyleOverrides(theme, borderRadius, outlinedFilled) {
  const mode = theme.palette.mode;
  const bgColor = mode === ThemeMode.DARK ? theme.palette.dark[800] : theme.palette.grey[50];
  const menuSelectedBack = mode === ThemeMode.DARK ? alpha(theme.palette.secondary.main, 0.15) : theme.palette.secondary.light;
  const menuSelected = mode === ThemeMode.DARK ? theme.palette.secondary.main : theme.palette.secondary.dark;
  const svgColor = mode === ThemeMode.DARK ? theme.palette.secondary.main : theme.palette.text.primary;

  return {
    MuiCssBaseline: {
      styleOverrides: {
        // ApexCharts 다운로드 메뉴 스타일
        '.apexcharts-menu-item': {
          color: `${mode === ThemeMode.DARK ? 'black' : theme.palette.text.dark}`,
          padding: '8px 16px',
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: `${mode === ThemeMode.DARK ? alpha(theme.palette.primary.main) : alpha(theme.palette.primary.light, 0.2)}`,
            color: `${theme.palette.primary.main}`
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minWidth: '120px',
          fontWeight: 500,
          borderRadius: `${borderRadius}px`,
          ...theme.applyStyles('dark', {
            '&.MuiButton-colorWarning': { color: theme.palette.common.black }
          })
        }
      }
    },
    // ... 더 많은 컴포넌트 오버라이드
    ...componentsOverrides(theme)
  };
}
```

**주요 오버라이드 컴포넌트:**

- `MuiButton`: 최소 너비, 폰트 굵기, border radius
- `MuiPaper`: elevation 기본값 0, 배경 이미지 제거
- `MuiOutlinedInput`: outlinedFilled 옵션에 따른 배경색
- `MuiTabs`: 인디케이터 스타일, 호버 효과
- `MuiDataGrid`: 테이블 스타일 커스터마이징
- `MuiListItemButton`: 메뉴 선택 상태 스타일

**MUI v7 문법:**

```jsx
// MUI v7의 applyStyles 사용
...theme.applyStyles('dark', {
  '&.MuiButton-colorWarning': { color: theme.palette.common.black }
})
```

---

## 설정 관리 (ConfigContext)

### ConfigContext 구조

전역 설정을 관리하고 localStorage에 영속화합니다.

```57:237:src/contexts/ConfigContext.jsx
function ConfigProvider({ children }) {
  // localStorage에서 저장된 설정을 불러오되, 누락된 키는 defaultConfig로 채움
  const [savedConfig, setSavedConfig] = useLocalStorage('berry-config-next-ts', defaultConfig);

  // 안전하게 병합된 설정 사용
  let config;
  let shouldReset = false;

  try {
    // 버전 체크 - 버전이 다르면 완전히 리셋
    if (savedConfig?.configVersion !== defaultConfig.configVersion) {
      shouldReset = true;
    }

    if (shouldReset) {
      config = defaultConfig;
    } else {
      config = deepMergeConfig(defaultConfig, savedConfig);
    }
  } catch (error) {
    console.error('Error processing config, resetting to defaults:', error);
    config = defaultConfig;
    shouldReset = true;
  }

  // 병합된 설정으로 localStorage 업데이트 (누락된 키 추가)
  const setConfig = (newConfig) => {
    try {
      const mergedConfig = deepMergeConfig(defaultConfig, newConfig);
      setSavedConfig(mergedConfig);
    } catch (error) {
      console.error('Error saving config:', error);
      // 에러 발생시 기본값으로 리셋
      setSavedConfig(defaultConfig);
    }
  };

  // 초기 로드 시 localStorage의 설정이 불완전하면 완전한 설정으로 업데이트
  useEffect(() => {
    try {
      if (shouldReset) {
        setSavedConfig(defaultConfig);
        return;
      }

      // savedConfig와 병합된 config를 비교해서 다르면 localStorage 업데이트
      const configString = JSON.stringify(config);
      const savedConfigString = JSON.stringify(savedConfig);

      if (configString !== savedConfigString) {
        setSavedConfig(config);
      }
    } catch (error) {
      console.error('Error updating config:', error);
      setSavedConfig(defaultConfig);
    }
  }, []); // 초기 로드시에만 실행

  const onChangeMenuOrientation = (menuOrientation) => {
    setConfig({
      ...config,
      menuOrientation
    });
  };

  const onChangeMiniDrawer = (miniDrawer) => {
    setConfig({
      ...config,
      miniDrawer
    });
  };

  const onChangeMode = (mode) => {
    setConfig({
      ...config,
      mode
    });
  };

  const onChangePresetColor = (presetColor) => {
    setConfig({
      ...config,
      presetColor
    });
  };

  const onChangeLocale = (i18n) => {
    setConfig({
      ...config,
      i18n
    });
  };

  const onChangeDirection = (themeDirection) => {
    setConfig({
      ...config,
      themeDirection
    });
  };

  const onChangeContainer = (container) => {
    setConfig({
      ...config,
      container
    });
  };

  const onChangeShowConfirm = (showConfirm) => {
    setConfig({
      ...config,
      showConfirm
    });
  };

  const onChangeFontFamily = (fontFamily) => {
    setConfig({
      ...config,
      fontFamily
    });
  };

  const onChangeBorderRadius = (event, newValue) => {
    setConfig({
      ...config,
      borderRadius: newValue
    });
  };

  const onChangeOutlinedField = (outlinedFilled) => {
    setConfig({
      ...config,
      outlinedFilled
    });
  };

  const onChangeFilterLayout = (filterLayout) => {
    setConfig({
      ...config,
      filterLayout
    });
  };

  const onChangeFormLayout = (formLayout) => {
    setConfig({
      ...config,
      formLayout
    });
  };

  const onReset = () => {
    try {
      setSavedConfig({ ...defaultConfig });
    } catch (error) {
      console.error('Error resetting config:', error);
    }
  };

  return (
    <ConfigContext.Provider
      value={{
        ...config,
        onChangeMenuOrientation,
        onChangeMiniDrawer,
        onChangeMode,
        onChangePresetColor,
        onChangeLocale,
        onChangeDirection,
        onChangeContainer,
        onChangeShowConfirm,
        onChangeFontFamily,
        onChangeBorderRadius,
        onChangeOutlinedField,
        onChangeFilterLayout,
        onChangeFormLayout,
        onReset
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
```

**설정 항목:**

```49:73:src/config.js
const config = {
  // 설정 버전 - 대규모 변경 시 버전을 올려서 강제 리셋 가능
  configVersion: '1.0.0',
  menuOrientation: MenuOrientation.VERTICAL,
  miniDrawer: false,
  fontFamily:
    '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  borderRadius: 8,
  outlinedFilled: true,
  mode: ThemeMode.LIGHT,
  presetColor: 'default',
  i18n: 'ko',
  themeDirection: ThemeDirection.LTR,
  container: false,
  showConfirm: true,
  filterLayout: {
    filterRenderType: 'collapse',
    active: true,
    filterButtonRender: true
  },
  formLayout: {
    formRenderType: 'modal',
    active: false
  }
};
```

**핵심 기능:**

1. **버전 관리**: `configVersion`으로 호환성 관리
2. **깊은 병합**: `deepMergeConfig`로 기본값과 저장된 값 안전하게 병합
3. **에러 처리**: 에러 발생 시 기본값으로 자동 복구
4. **자동 동기화**: 초기 로드 시 누락된 키 자동 추가

---

## 커스터마이제이션 UI

### Customization 컴포넌트

사용자가 테마를 실시간으로 변경할 수 있는 UI를 제공합니다.

```62:187:src/layout/Customization/index.jsx
export default function Customization() {
  const { mode, onReset } = useConfig();
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  // drawer on/off
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen(!open);
  };

  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ p: 1 }}>
      <PerfectScrollbar>
        <MainCard content={false} border={false}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2.5 }}>
            <Typography variant="h5">Theme Customization</Typography>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Button variant="outlined" color="error" size="small" onClick={() => onReset()}>
                Reset
              </Button>
              <IconButton sx={{ p: 0, color: 'grey.600' }} onClick={handleClose}>
                <IconPlus size={24} style={{ transform: 'rotate(45deg)' }} />
              </IconButton>
            </Stack>
          </Stack>
          <Divider />
          <Box sx={{ width: '100%' }}>
            <Tabs
              value={value}
              sx={{
                bgcolor: mode === ThemeMode.DARK ? 'dark.800' : 'grey.50',
                minHeight: 56,
                '& .MuiTabs-flexContainer': { height: '100%' }
              }}
              centered
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab label={<IconColorSwatch />} {...a11yProps(0)} sx={{ width: '33%' }} />
              <Tab label={<IconTextSize />} {...a11yProps(1)} sx={{ width: '33%' }} />
              <Tab label={<IconLayoutGrid />} {...a11yProps(2)} sx={{ width: '33%' }} />
            </Tabs>
          </Box>
          <CustomTabPanel value={value} index={0}>
            <Grid container spacing={2.5}>
              <Grid size={12}>
                {/* layout type */}
                <ThemeModeLayout />
                <Divider />
              </Grid>
              <Grid size={12}>
                {/* Theme Preset Color */}
                <PresetColor />
                <Divider />
              </Grid>
              <Grid size={12}>
                {/* Input Background */}
                <InputFilled />
                <Divider />
              </Grid>
              <Grid size={12}>
                {/* Theme Width */}
                <BoxContainer />
                <Divider />
              </Grid>
              <Grid size={12}>
                {/* Theme Layout */}
                <Layout />
                <Divider />
              </Grid>
              <Grid size={12}>
                {/* Sidebar Drawer */}
                <SidebarDrawer />
                <Divider />
              </Grid>
              <Grid size={12}>
                {/* Menu Orientation */}
                <MenuOrientation />
                <Divider />
              </Grid>
            </Grid>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <Grid container spacing={2}>
              <Grid size={12}>
                {/* font family */}
                <FontFamily />
                <Divider />
              </Grid>
              <Grid size={12}>
                {/* border radius */}
                <BorderRadius />
                <Divider />
              </Grid>
            </Grid>
          </CustomTabPanel>
          {/* 추가 레이아웃설정 탭 */}
          <CustomTabPanel value={value} index={2}>
            <Grid container spacing={2.5}>
              <Grid size={12}>
                {/* Filter Layout type */}
                <FilterLayoutConfig />
                <Divider />
              </Grid>
              <Grid size={12}>
                {/* Form Layout */}
                <FormLayoutConfig />
                <Divider />
              </Grid>
            </Grid>
          </CustomTabPanel>
        </MainCard>
      </PerfectScrollbar>
    </Box>
  );
}
```

**탭 구조:**

1. **색상 탭 (Tab 0)**: 테마 모드, 프리셋 색상, 입력 필드 배경, 컨테이너 너비, 레이아웃, 사이드바, 메뉴 방향
2. **타이포그래피 탭 (Tab 1)**: 폰트 패밀리, border radius
3. **레이아웃 탭 (Tab 2)**: 필터 레이아웃, 폼 레이아웃

**MUI v7 Grid 사용:**

```jsx
// MUI v7 Grid 문법
<Grid container spacing={2.5}>
  <Grid size={12}>
    <Component />
  </Grid>
</Grid>
```

---

## 새로운 테마 추가하기

### 1. SCSS 파일 생성

`src/scss/_theme8.module.scss` 파일을 생성합니다.

```scss
// paper & background
$paper: #ffffff;
$background: #f8fafc;

// primary
$primaryLight: #e3f2fd;
$primaryMain: #2196f3;
$primaryDark: #1976d2;
$primary200: #90caf9;
$primary800: #1565c0;

// secondary
$secondaryLight: #f3e5f5;
$secondaryMain: #9c27b0;
$secondaryDark: #7b1fa2;
$secondary200: #ce93d8;
$secondary800: #6a1b9a;

// ... (나머지 색상 변수들)

// ==============================|| DARK THEME VARIANTS ||============================== //

// dark variants
$darkBackground: #1a1a1a;
$darkPaper: #0d0d0d;
// ... (다크 모드 색상 변수들)

// ==============================|| JAVASCRIPT ||============================== //

:export {
  paper: $paper;
  primaryLight: $primaryLight;
  // ... (모든 변수 export)
}
```

### 2. Palette.jsx에 테마 추가

```jsx
// src/themes/palette.jsx
import theme8 from '../scss/_theme8.module.scss';

export default function Palette(mode, presetColor) {
  let colors;
  switch (presetColor) {
    // ... 기존 케이스들
    case 'theme8':
      colors = theme8;
      break;
    // ...
  }
  // ...
}
```

### 3. PresetColor.jsx에 테마 추가

```jsx
// src/layout/Customization/PresetColor.jsx
import theme8 from '../../scss/_theme8.module.scss';

const colorOptions = [
  // ... 기존 옵션들
  {
    id: 'theme8',
    primary: mode === ThemeMode.DARK ? theme8.darkPrimaryMain : theme8.primaryMain,
    secondary: mode === ThemeMode.DARK ? theme8.darkSecondaryMain : theme8.secondaryMain
  }
];
```

### 4. config.js에 기본값 추가 (선택사항)

```jsx
// src/config.js
const config = {
  // ...
  presetColor: 'theme8', // 기본 테마로 설정하려면
};
```

---

## 사용 예제

### 1. 테마 사용하기

```jsx
import { useTheme } from '@mui/material/styles';
import { Box, Button } from '@mui/material';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        padding: 2,
        borderRadius: theme.shape.borderRadius
      }}
    >
      <Button
        variant="contained"
        color="primary"
        sx={{
          boxShadow: theme.customShadows.primary
        }}
      >
        Primary Button
      </Button>
    </Box>
  );
}
```

### 2. 설정 변경하기

```jsx
import useConfig from 'hooks/useConfig';
import { ThemeMode } from 'config';

function SettingsPanel() {
  const { mode, onChangeMode, presetColor, onChangePresetColor } = useConfig();
  
  return (
    <div>
      <button onClick={() => onChangeMode(ThemeMode.DARK)}>
        다크 모드
      </button>
      <button onClick={() => onChangePresetColor('theme1')}>
        테마 1
      </button>
    </div>
  );
}
```

### 3. 커스텀 타이포그래피 사용

```jsx
import { Typography } from '@mui/material';

function MyComponent() {
  return (
    <>
      <Typography variant="h1">제목 1</Typography>
      <Typography variant="h5">제목 5</Typography>
      <Typography variant="body1">본문</Typography>
      <Typography variant="menuCaption">메뉴 캡션</Typography>
    </>
  );
}
```

### 4. 다크 모드 감지

```jsx
import { useTheme } from '@mui/material/styles';
import { ThemeMode } from 'config';

function MyComponent() {
  const theme = useTheme();
  const isDark = theme.palette.mode === ThemeMode.DARK;
  
  return (
    <Box
      sx={{
        backgroundColor: isDark ? 'dark.800' : 'grey.50',
        color: isDark ? 'text.primary' : 'text.dark'
      }}
    >
      Content
    </Box>
  );
}
```

### 5. 반응형 Grid 사용 (MUI v7)

```jsx
import { Grid } from '@mui/material';

function ResponsiveLayout() {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        Item 1
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        Item 2
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        Item 3
      </Grid>
    </Grid>
  );
}
```

---

## 마이그레이션 가이드

### 다른 프로젝트에 적용하기

#### 1. 필수 파일 복사

```
필수 파일:
- src/themes/ (전체 디렉토리)
- src/contexts/ConfigContext.jsx
- src/hooks/useConfig.js
- src/config.js
- src/scss/ (테마 SCSS 파일들)
```

#### 2. 의존성 설치

```bash
npm install @mui/material @mui/system
# 또는
yarn add @mui/material @mui/system
```

#### 3. 루트 레이아웃에 적용

```jsx
// app/layout.jsx 또는 _app.js
import { ConfigProvider } from 'contexts/ConfigContext';
import ThemeCustomization from 'themes';

export default function RootLayout({ children }) {
  return (
    <ConfigProvider>
      <ThemeCustomization>
        {children}
      </ThemeCustomization>
    </ConfigProvider>
  );
}
```

#### 4. 기본 설정 커스터마이징

`src/config.js` 파일을 프로젝트에 맞게 수정:

```jsx
const config = {
  configVersion: '1.0.0',
  fontFamily: 'Your Font Family',
  borderRadius: 8,
  mode: ThemeMode.LIGHT,
  presetColor: 'default',
  // ... 프로젝트별 설정
};
```

#### 5. 색상 테마 커스터마이징

1. `src/scss/_themes-vars.module.scss` (기본 테마) 수정
2. 또는 새로운 테마 파일 생성 후 `palette.jsx`에 추가

#### 6. 컴포넌트 오버라이드 커스터마이징

`src/themes/compStyleOverride.jsx`에서 프로젝트에 맞게 수정:

```jsx
MuiButton: {
  styleOverrides: {
    root: {
      // 프로젝트별 버튼 스타일
    }
  }
}
```

### 주의사항

1. **MUI 버전**: MUI v7 이상 사용 필수
2. **Next.js**: `'use client'` 지시어 필요 (클라이언트 컴포넌트)
3. **localStorage 키**: `ConfigContext.jsx`의 `'berry-config-next-ts'`를 프로젝트별로 변경
4. **폰트**: `config.js`의 `fontFamily`를 프로젝트에 맞게 설정
5. **색상 팔레트**: 모든 테마 파일에 동일한 변수 구조 유지

---

## 참고 자료

- [Material-UI v7 문서](https://mui.com/)
- [MUI Theme Customization](https://mui.com/material-ui/customization/theming/)
- [SCSS Modules](https://github.com/css-modules/css-modules)

---

## 라이선스

이 디자인 시스템은 프로젝트 내부 사용을 위해 개발되었습니다.

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2024

