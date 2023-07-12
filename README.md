
<div align="center" width="150px">
  <img style="width: 150px; height: auto;" src="public/assets/logo.png" alt="Logo - Strapi Soft Delete plugin" />
</div>
<div align="center">
  <h1>Strapi v4 - Soft Delete plugin</h1>
  <p>Powerful Strapi based Soft Delete feature, never loose content again</p>
  <a href="https://www.npmjs.org/package/strapi-plugin-soft-delete">
    <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/ChristopheCVB/strapi-plugin-soft-delete?label=npm&logo=npm">
  </a>
  <a href="https://www.npmjs.org/package/strapi-plugin-soft-delete">
    <img src="https://img.shields.io/npm/dm/strapi-plugin-soft-delete.svg" alt="Monthly download on NPM" />
  </a>
</div>

---

<div style="margin: 20px 0" align="center">
  <img style="width: 100%; height: auto;" src="public/assets/preview.png" alt="UI preview" />
</div>

A plugin for [Strapi Headless CMS](https://github.com/strapi/strapi) that provides a Soft Delete feature.

## ✨ Features

- 🛢 Database
  - Adds `_softDeletedAt`, `_softDeletedById` and `_softDeletedByType` fields to all your collection and single content types. Those fields are not visible in the Content Manager nor through the API.
- 🗂️ Content Manager & API
  - The delete from the Content Manager & API behaves as the soft delete. It will set the `_softDeletedAt` field to the current date, `_softDeletedById` field to the action owner id that deleted it and `_softDeletedByType` to the type of the delete action owner.
- 👤 RBAC
  - The `Delete` is renamed to `Soft Delete` and it is located in the `Settings > Roles > Edit a Role > Collection Types | Single Types` section.
  - A new admin permission is added to the `Settings > Roles > Edit a Role > Collection Types | Single Types` section. This is the `Deleted Read` permission. This will allow the admin role to view the soft deleted entries.
  - A new admin permission is added to the `Settings > Roles > Edit a Role > Collection Types | Single Types` section. This is the `Deleted Restore` permission. This will allow the admin role to restore the soft deleted entries.
  - A new admin permission is added to the `Settings > Roles > Edit a Role > Collection Types | Single Types` section. This is the `Delete Permanently` permission. This will allow the admin role to delete permanently the soft deleted entries.
  - A new admin permission is added to the `Settings > Roles > Edit a Role > Plugins > Soft Delete` section. This is the global `Read` permission of the plugin. This will allow the admin role to view the Soft Delete item in the Admin left Panel. Accessing this will list all the content types the admin role has access to. They can restore or delete permanently the entries from here depending on the above permissions.
- 🗂️ Soft Delete Explorer (Admin left Panel item): Displays Soft Deleted Collection & Single Type entries 
  - ♻️ Entries can be restored with the `Restore` action. This will set the fields `_softDeletedAt`, `_softDeletedById` and `_softDeletedByType` to `null`.
    - Restoring an entry from the Soft Delete explorer will restore it to the Content Manager explorer.
      - ⚠️ Restoring a Single Type entry may replace the existing entry. This is because Single Types are unique and can only have one entry (although they're stored like collections in databse).
      - ℹ️ Restoring a Content Type entry will restore it in the Content Manager explorer without changing its fields, meaning that if the Content Type supports Draft & Publish and its publication state was published, it will be restored as published.
  - 🗑️ Entries can be permanently deleted with the `Delete Permanently` action. This will delete the entry permanently from the databse.

## ⛔ Permissions

| Section | Permission | Description |
| ---------- | ---------- | ----------- |
| Collection Type & Single Type | `Deleted Read` | Allows the admin role to view the soft deleted entries. |
| Collection Type & Single Type | `Deleted Restore` | Allows the admin role to restore the soft deleted entries. |
| Collection Type & Single Type | `Delete Permanently` | Allows the admin role to delete permanently the soft deleted entries. |
| Plugins | `Read` | Allows the admin role to view the Soft Delete item in the Admin left Panel. |

## 📦 Compatibility

| Strapi Version | Plugin Version |
| -------------- | -------------- |
| v4             | 1.0.0          |
| v3             | Not Supported  |

> This plugin is designed for **Strapi v4** and will not work with v3.x.

## 🚨 Caveats

Because of the way the plugin handles soft deleted entries, there are some caveats to be aware of:
- Lifecycle hooks:
  - `beforeDelete`, `afterDelete`, `beforeDeleteMany` and `afterDeleteMany` lifecycle hooks are not triggered when soft deleting entries. Instead, the `beforeUpdate`, `afterUpdate`, `beforeUpdateMany` and `afterUpdateMany` are. <!-- Instead, the new `beforeSoftDelete`, `afterSoftDelete`, `beforeSoftDeleteMany` and `afterSoftDeleteMany` lifecycle hooks are triggered. --><!-- TODO: Is it possible to create custom lifecyle hooks? Maybe by wrapping https://github.com/strapi/strapi/blob/40b3acfe6f9bb9ff73dfba951090731879b87ec5/packages/core/strapi/lib/services/event-hub.js#L22 -->
  - `beforeDelete`, `afterDelete`, `beforeDeleteMany` and `afterDeleteMany` lifecycle hooks are triggered when deleting permanently an entries.

## ⏳ Installation

To install this plugin, you need to add an NPM dependency to your Strapi application:

```sh
# Using Yarn
yarn add strapi-plugin-soft-delete

# Or using PNPM
pnpm add strapi-plugin-soft-delete

# Or using NPM
npm install strapi-plugin-soft-delete
```

Edit your `config/plugins.js|ts` or `config/<env>/plugins.js|ts` file and add the following configuration:

```js
// ...
  "soft-delete": {
    enabled: true,
  },
// ...
```

Then, you'll need to build your admin panel:

```sh
# Using Yarn
yarn build

# Or using PNPM
pnpm run build

# Or using NPM
npm run build
```

Finally, start your application:

```sh
# Using Yarn
yarn develop

# Or using PNPM
pnpm run develop

# Or using NPM
npm run develop
```

## 🤝 Contributing

Feel free to fork and make a PR if you want to add something or fix a bug.

## 🛣️ Roadmap

- 🖧 Server
  - [x] `_softDeletedAt` field on API Content Types
  - [x] `_softDeletedById` field on API Content Types
  - [x] `_softDeletedByType` field on API Content Types
  - [x] Decorate Content Type Entity Services to handle `_softDeleted*` fields when deleting an entry upon `delete` or `deleteMany` methods
  - [x] Decorate Content Type Entity Services to hide entries upon `find` or `findMany` methods
  - [x] RBAC Permissions
  - [ ] Single Type entry restore special case
  - [ ] Draft & Publish support when restoring an entry
  - [ ] Custom Lifecycle Hooks
  - [ ] Handle Soft Deleting Components
  - [ ] Add tests
- 🗂️ Soft Delete Explorer
  - [x] Content Types list
  - [x] Entries list
  - [x] Restore action
  - [x] Delete Permanently action
  - [x] Translation
  - [ ] Soft Deleted Entry details
- ⚙️ Plugin Settings
  - [-] Restoration Behavior
    - [ ] Single Type
    - [ ] Draft & Publish

## 🚮 Uninstall

To uninstall this plugin, you need to remove the NPM dependency from your Strapi application:

```sh
# Using Yarn
yarn remove strapi-plugin-soft-delete

# Or using PNPM
pnpm remove strapi-plugin-soft-delete

# Or using NPM
npm uninstall strapi-plugin-soft-delete
```

Edit your `config/plugins.js|ts` or `config/<env>/plugins.js|ts` file and remove the following configuration:

```js
// ...
  "soft-delete": {
    enabled: true,
  },
// ...
```

Also, _**if you have edited your API Content Types through the Content Builder**_, and because the plugin adds fields to it, you'll need to remove them manually. The fields are:
- `_softDeletedAt`
- `_softDeletedById`
- `_softDeletedByType`

Then, you'll need to build your admin panel:

```sh
# Using Yarn
yarn build

# Or using PNPM
pnpm run build

# Or using NPM
npm run build
```

Finally, start your application:

```sh
# Using Yarn
yarn develop

# Or using PNPM
pnpm run develop

# Or using NPM
npm run develop
```

## 👨‍💻 Community support

For general help using Strapi, please refer to [the official Strapi documentation](https://docs.strapi.io/). For additional help, you can use one of these channels to ask a question:

- [Discord](https://discord.strapi.io/) I'm present on official Strapi Discord workspace. Find me by `ChristopheCVB`.
- [GitHub](https://github.com/ChristopheCVB/strapi-plugin-soft-delete/issues) (Bug reports, Contributions, Questions and Discussions)

## 📝 License

[MIT License](LICENSE.md) Copyright (c) [ChristopheCVB](https://www.christophecvb.com/).
