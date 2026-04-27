# 🛠️ HINA TOOLKIT — Vercel Deploy

## 📁 Structure
```
hina-toolkit/
├── index.html       → Toolkit  ( / )
├── admin.html       → Admin    ( /admin )
├── package.json
├── vercel.json
└── api/
    ├── validate-key.js   → POST /api/validate-key
    ├── keys.js           → GET/POST/PUT/DELETE /api/keys
    └── tools.js          → GET/POST/PUT/DELETE /api/tools
```

## 🚀 Deploy Steps

1. Yeh sara folder GitHub pe upload karo (new repo banao)
2. [vercel.com](https://vercel.com) → **New Project** → repo import karo
3. Framework: **Other** | Root Directory: `.`
4. **Deploy** — bas itna!

## 🌐 URLs
| | |
|---|---|
| Toolkit | `https://your-app.vercel.app/` |
| Admin | `https://your-app.vercel.app/admin` |
| API | `https://your-app.vercel.app/api/validate-key` |

## 🔑 API Admin Password
`hina@admin2024`  
(change karna ho to `api/keys.js` aur `api/tools.js` mein `ADMIN_PASSWORD` update karo)
