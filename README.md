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
PROJECT=rephotography yarn dev
# or...
echo "PROJECT=rephotography" > .env.local
yarn dev
```

It identifies a directory under [projects/](projects/), e.g. `projects/rephotography`, where project-specific configuration and code lives.
