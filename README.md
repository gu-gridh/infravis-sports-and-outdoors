# sports-and-outdoors

### Setup

```sh
yarn install
```

### Start local development server

```sh
yarn dev
```

### Build for deployment

```sh
yarn build
```

### Choose research project

Choose which project to build for, by specifying the `PROJECT` environment variable:

```sh
PROJECT=sports yarn dev
# or...
echo "PROJECT=sports" > .env.local
yarn dev
```

It identifies a directory under [projects/](projects/), e.g. `projects/sports`, where project-specific configuration and code lives.
