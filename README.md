# Chemkers

A live version of the app can be found here: https://tomszir.github.io/chemkers

## Description

A Checkers game made as a university project (but mostly for fun).

## Development & project setup

### Installing project requirements

- Node.js: https://nodejs.org/en
- The Rust programming language
  - The project heavily relies on Rust to handle all computationally intensive operations.
  - Recommended cross-platform installer: https://rustup.rs/
- wasm-pack
  - A workflow tool for compiling `rust -> wasm`, otherwise it wouldn't be easily possible to use Rust compiled WebAssembly within the project.
  - Recommended cross-platform installer: https://rustwasm.github.io/wasm-pack/installer/

> The only tested versions of these are - `node@v14.19.0`, `rustc@1.68.0`, `wasm-pack@0.10.3`. I can't guarantee everything will work with any other version.

### Setting up the project

Clone the project and navigate to it

```bash
git clone https://github.com/tomszir/chemkers
cd ./chemkers
```

If you don't have Yarn already installed, install it using this command

```bash
npm install -g yarn
```

Use the stable version of Yarn and install all the project's libraries

```bash
yarn set version stable
yarn install
```

Try running a test build of the project to see if everything works

> You'll know if it works if you don't get a million errors in your face

```bash
yarn build
```

### Running a development server

If you're going to be working with Rust installing `cargo-watch` is a must. It will automatically watch for changes within the Rust sub-projects and rebuild the WebAssembly for immediate availability on the development server.

```bash
cargo install cargo-watch
```

Within the root of the project run this command

```bash
yarn dev
```

A development server should open to something simliar to http://localhost:5173

> Note: The port can change depending on if the port is already taken or not

### Project structure

This project uses [Turborepo](https://turbo.build/) for handling multiple interlinked codebases.

#### Turborepo workspaces

| Name                                       | Description                              | Type      |
| ------------------------------------------ | ---------------------------------------- | --------- |
| [preact-checkers](./apps/preact-checkers/)        | Vite Preact front-end                    | `app`     |
| [wasm-checkers](./packages/wasm-checkers/) | Rust WebAssembly checkers engine library | `package` |

### Additional good-to-know things

#### 1. Making `rust-analyzer` discover Rust sub-projects in VSCode

To make the VSCode `rust-analyzer` extension discover the `wasm-checkers` package, please create an additional file - `.vscode/settings.json` and specify the path to the Rust `Cargo.toml` file of the package within it:

```json
{
  "rust-analyzer.linkedProjects": [
    "${workspaceFolder}/packages/wasm-checkers/Cargo.toml"
  ]
}
```

> Note: This will only make `rust-analyzer` work if VSCode is opened on the root directory of the project. (You can also open the Rust sub-project seperately and it should work automatically)

#### 2. Turborepo development server hangs the terminal

When running `Ctrl + C` within a terminal with an active `yarn dev` development server running Turborepo sometimes doesn't gracefully shutdown and hangs the current active terminal session. To fix this I reccomend opening another terminal instance.

## Acknowledgements and research sources

This project wouldn't be possible without these online resources and articles.

- [English draughts, by Wikipedia - The Free Encyclopedia](https://en.wikipedia.org/wiki/English_draughts)
- [Minimax, by Wikipedia - The Free Encyclopedia](https://en.wikipedia.org/wiki/Minimax)
- [Alpha-beta pruning, by Wikipedia - The Free Encyclopedia](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)
- [Checkers Bitboard Tutorial, by Jonathan Kreuzer](https://3dkingdoms.com/checkers/bitboards.htm)
- [Alpha-Beta Pruning and Checkers, By Dave Evans and Carl Sable](http://www.cs.columbia.edu/~devans/TIC/AB.html)
- [Solving Checkers, by J. Schaeffer, Y. Bjornsson, N. Burch, A. Kishimoto, M. Muller, R. Lake, P. Lu and S. Sutphe](https://webdocs.cs.ualberta.ca/~mmueller/ps/ijcai05checkers.pdf)
- [How to play checkers and win 90% of the time. Win with 13 basic strategies and secrets., by WinningCheckers](https://www.youtube.com/watch?v=q3aAsoM6HO0)
- [How to use Web Workers with React and Vite, by Francisco Mendes](https://dev.to/franciscomendes10866/how-to-use-service-workers-with-react-17p2)

## License

This project is licensed under the [MIT](./LICENSE) license.
