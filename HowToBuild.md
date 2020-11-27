**Build the action**

Open PowerShell, go to the directory where the repo is stored (.../cli/) and execute the following commands.

**1.npm install** \
npm install downloads dependencies defined in a package. json file and generates a node_modules folder with the installed modules. \
**2.npm install -g @vercel/ncc** \
**3.ncc build src/main.ts -s -o _build**  \
ncc is a simple CLI for compiling a Node.js module into a single file, together with all its dependencies, gcc-style. \

This builds the solution and create the required .js file(s). Good to go!