# Pointless - a CircleCI Chrome Extension [![Build Status](https://circleci.com/gh/felicianotech/pointless.svg?style=shield)](https://circleci.com/gh/felicianotech/pointless) [![Software License](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/felicianotech/pointless/master/LICENSE)

<img src="logo128.png" alt="Pointless Logo" title="Pointless" align="left" style="width:100px;height:100px;" />

Pointless is a CircleCI Chrome Extension that enhances your browsing experience while developing. For example, while viewing a project on GitHub, you can see its build status and follow/unfollow that project on CircleCI right from the GitHub page.

## Installing

Pointless can be installed via the [Chrome Store](https://chrome.google.com/webstore/detail/pointless-a-circleci-chro/edmkpfdmophaaeedepooedlhioimljai).

## Configuring

Many features require a [CircleCI API Token](https://circleci.com/account/api). Once you create a token on CircleCI's website, you can add it to Pointless by right-clicking the CircleCI icon at the top-right corner of Google Chrome and clicking "Options".

## Features

- **build status** (GitHub) - a colored icon will appear to the right of the project name, showing the CircleCI build status of the default branch.

- **follow/unfollow projects** (GitHub) - on a repo page, a CircleCI "Follow"/"Unfollow" button will appear next to the "Watch", "Star", and "Fork" GitHub buttons.

- **docs search** (Omnibox/address bar) - search CircleCI Docs (all of docs or a single section) right from Chrome's Omnibox. Instructions below.

## How-To

### Searching

Pointless supports quick, special searches. Currently, only CircleCI Docs can be searched but more search types are on the roadmap.

### Search CircleCI Docs

In the Omnibox (address bar) type `ci` and press tab to activate Pointless' Search. Then, type `d`, a space, and then one or more search terms to search all of CircleCI Docs. You can search 1.0 Docs specifically by using `d1` instead of `d`, for 2.0, `d2`, for API Docs, `da`, and for CCIE Docs, `de`.

### Examples

Search all of CircleCI Docs for Docker by typing: `ci <tab> d docker`

Search for Yarn in CircleCI 2.0 Docs: `ci <tab> d2 yarn`
