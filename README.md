# Video Buffer Fix

This patch keeps the working Firebase + secure playback + Telegram MTProto architecture.

Backend optimization:
- 1 MiB Telegram relay chunks (within the standard `upload.getFile` limit).
- Immediate HTTP header flush.
- `keep-alive` response hint.
- Proper Node response backpressure handling.

Website optimization:
- Video player uses `preload="auto"` instead of `metadata` so supported mobile browsers can buffer ahead.

Do not change Firebase service-account, Telegram credentials, or PLAYBACK_SIGNING_SECRET.
Keep VIDEO_SECURITY_MODE as `test` until the optimization is verified.
