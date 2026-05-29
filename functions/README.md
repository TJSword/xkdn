# Cloud Function Environment Variables

Do not commit real secrets to this repository. Configure these values in the
Tencent CloudBase console for the relevant cloud functions.

## Payment

- `ALIPAY_APP_ID`
- `ALIPAY_PRIVATE_KEY`
- `ALIPAY_PUBLIC_KEY`

## Convertible Bond Data

- `LUDE_ACCOUNT`
- `LUDE_PASSWORD`
- `LUDE_CLIENT` (optional, defaults to `web`)

## Notifications

Comma-separated lists:

- `MICRO_CAP_BARK_KEYS`
- `MICRO_CAP_WECHAT_KEYS`
- `BOND_BARK_KEYS`
- `BOND_WECHAT_KEYS`
- `BOND_S2_BARK_KEYS`
- `MOMENTUM_BARK_KEYS`
- `MOMENTUM_WECHAT_KEYS`

Optional:

- `BARK_ICON_URL`
- `MICRO_CAP_BARK_URL`
