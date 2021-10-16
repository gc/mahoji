<div align="center">

![Logo](https://cdn.discordapp.com/attachments/357422607982919680/898781373689634826/mahoji.png)

# Mahoji

**A Modern Discord bot framework**

 <a href="https://discord.gg/JjsXBtKFKK"><img src="https://img.shields.io/discord/228822415189344257?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a> ![npm](https://img.shields.io/npm/v/mahoji?label=mahoji)



</div>



## Description

Mahoji is a framework that allows you to create modern discord bots with slash/application/message commands.


## Principles and Features

-   Simple, straightforward and small.
-   Automatically hot-reloads commands in development.

## Installation & Usage

### 1. Install
```sh
yarn add mahoji
```

### 2. Usage
```ts
import { MahojiClient } from 'mahoji';

const client = new MahojiClient({
	discordPublicKey: 'YOUR_PUBLIC_KEY_HERE',
	discordToken: 'YOUR_TOKEN_HERE',
	developmentServerID: 'YOUR_DEVELOPMENT_SERVER_ID',
	applicationID: 'YOUR_APPLICATION_ID',
	interactionsEndpointURL: '/interactions',
	httpPort: 1234,
	storeDirs: ['dist'],
	fastifyOptions: {
		logger: true
	}
});

client.start();
```