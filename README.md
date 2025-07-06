[![Tech used](https://skillicons.dev/icons?i=html,css,js,vite)](https://skillicons.dev)

# S-Tools

A simple webpage providing a collection of useful tools.

## Overview

This project is a basic landing page built with JavaScript and Vite, offering various tools for users.

## Features

- Collection of useful tools in one place.
- Built with JavaScript and Vite.
- Clean and Intuitive Interface.
- Open-source and welcomes contributions.

## Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (v16 or higher)
-   [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/Sylvixor/S-Tools.git
    cd S-Tools
    ```

2.  Install the dependencies:

    ```bash
    npm install # or yarn install
    ```

## Development

To start the development server:

```bash
npm run dev # or yarn dev
```

This will start the Vite development server, and you can view the project in your browser.

## Build

To build the project for production:

```bash
npm run build # or yarn build
```

This will create an optimized build of the project in the `dist` directory.

## Project Structure

```
S-Tools/
├── .gitignore
├── LICENSE
├── README.md
├── index.html
├── package-lock.json
├── package.json
├── public/
|   └── js/
|       ├── app.js
|       └── modules/
|           ├── color-utlities.js
|           ├── encode-decode.js
|           ├── file-operations.js
|           ├── unit-converter.js
|           └── utils.js
└── style.css
```

-   `index.html`: Main HTML file.
-   `public/`: Static assets.
    - `js/`: Javascript files.
        - `app.js`: Initializes the application.
        - `modules/`: Modules.
            - `color-utilities.js`: Manages color conversions.
            - `encode-decode.js`: Handles encoding and decoding.
            - `file-operations.js`: Handles file conversions.
            - `unit-converter.js`: Handles unit conversions.
            - `utils.js`: General utility functions.
-   `style.css`: Styles for the webpage.
-   `LICENSE`: License file.
-   `README.md`: Documentation file.

## License

S-Tools © 2024 by Sylvixor is licensed under CC BY-NC-SA 4.0.