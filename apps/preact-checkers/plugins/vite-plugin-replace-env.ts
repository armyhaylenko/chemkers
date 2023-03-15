import fs from 'fs';
import os from 'os';

const setEnvValue = (mode: string, key: string, value: string) => {
  const fileName = `./.env.${mode}`;

  if (!fs.existsSync(fileName)) {
    return;
  }

  const variables = fs.readFileSync(fileName, 'utf8').split(os.EOL);
  const found = variables.find((line) => {
    return line.match(new RegExp(key));
  });

  if (!found) {
    return;
  }

  const target = variables.indexOf(found);

  variables.splice(target, 1, `${key} = ${value}`);
  fs.writeFileSync(fileName, variables.join(os.EOL));
};

const writeBundle = () => {
  const files = fs.readdirSync('./dist/assets');
  const wasmFile = files.find((file) => file.endsWith('.wasm'));
  setEnvValue('production', 'VITE_WASM_PATH', `'${wasmFile}'`);
};

const replaceEnv = () => ({
  name: 'vite-plugin-replace-env',
  writeBundle,
});

export default replaceEnv;
