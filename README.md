# Omni Store Toolkit

> **产品迁移**：本模块已归入独立产品 [Conversion Pulse](https://github.com/Alohamonde/conversion-pulse)（`apps/omni`）。本仓库保留作历史源码。

三合一 Shopify App：**促销弹窗**、**批量商品编辑**、**关联销售**。基于 Remix + Polaris + Theme App Extension，适合学习 Shopify 全栈开发。

![Shopify](https://img.shields.io/badge/Shopify-App-7AB55C?logo=shopify&logoColor=white)
![Remix](https://img.shields.io/badge/Remix-000?logo=remix&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

## 功能

| 模块 | 说明 |
|------|------|
| **促销弹窗** | 店面展示促销弹窗，后台统计展示、点击与点击率 |
| **批量编辑** | 多选商品，批量追加标签或统一调价，支持分页加载 |
| **关联销售** | 配置「经常一起购买」，商品页一键加购 |

## 技术栈

- Remix + React + TypeScript
- Shopify Polaris + App Bridge
- Prisma + SQLite
- Theme App Extension + App Proxy
- Shopify Admin GraphQL API

## 快速开始

### 环境要求

- Node.js 20+
- [Shopify Partner](https://partners.shopify.com) 账号
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)

### 安装运行

```bash
git clone https://github.com/Alohamonde/omni-shopify-app.git
cd omni-shopify-app
npm install
npm run dev
```

首次 `npm run dev` 会引导你登录 Partner、创建 App、选择开发商店。CLI 会自动写入 `client_id` 到 `shopify.app.*.toml`。

### 店面启用

在主题编辑器中：

1. **App embeds** → 启用 `Promo Popup`
2. 商品页 → 添加 `Cross Sell` 区块

## 项目结构

```
app/routes/
  app._index.tsx        # 总览
  app.popup.tsx         # 促销弹窗配置
  app.bulk-editor.tsx   # 批量编辑
  app.cross-sell.tsx    # 关联销售
  apps.omni.config.tsx  # App Proxy API
extensions/omni-storefront/   # 店面扩展（弹窗 + 关联销售）
prisma/schema.prisma    # ShopSettings / CrossSellRule / PopupEvent
```

## License

MIT
