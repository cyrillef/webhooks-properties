# Setup Instructions

  1. Install [NodeJS](https://nodejs.org)
  2. Download (fork, or clone) this project

      ```bash
      git clone https://github.com/cyrillef/webhooks-properties.git
      ```

  3. Install Node.js dependency modules:

     ```bash
     npm install
     ```

  4. Request your consumer key/secret key from [https://forge.autodesk.com](https://forge.autodesk.com).
  5. Set 2 environment variables FORGE_CLIENT_ID / FORGE_CLIENT_SECRET  
     Mac OSX/Linux (Terminal)

     ```bash
     export FORGE_CLIENT_ID=_YOUR_FORGE_CLIENT_ID
     export FORGE_CLIENT_SECRET=YOUR_FORGE_CLIENT_SECRET
     ```

     Windows (use **Node.js command line** from Start menu)

     ```batch
     set FORGE_CLIENT_ID=_YOUR_FORGE_CLIENT_ID
     set FORGE_CLIENT_SECRET=YOUR_FORGE_CLIENT_SECRET
     ```

  6. Set an environment variable PORT (This is for running either BIM360 API or the Viewer)  
     Mac OSX/Linux (Terminal)

     ```bash
     export PORT=YOUR_PORT_NUMBER
     ```

     Windows (use **Node.js command line** from Start menu)

     ```batch
     set PORT=YOUR_PORT_NUMBER
     ```

  7. **Note** for the 3 legged commands: while registering your keys, make sure that the callback you define for your
     callback (or redirect_uri) match your localhost and PORT number.  
     Default is: [http://localhost:3001/oauth](http://localhost:3001/oauth)  
     Mac OSX/Linux (Terminal)

     ```bash
     export FORGE_CALLBACK=YOUR_FORGE_CALLBACK_URL
     ```

     Windows (use **Node.js command line** from Start menu)

     ```batch
     set FORGE_CALLBACK=YOUR_FORGE_CALLBACK_URL
     ```

  8. If not using BIM360, ignore that step. Otherwise, provision your application key (i.e. FORGE_CLIENT_ID) on the BIM360 application integration page. [Learn about provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps).
  9. Set an environement variable FORGE_WEBHOOKS  
     Mac OSX/Linux (Terminal)

     ```bash
     export FORGE_WEBHOOKS=YOUR_FORGE_WEBHOOK_URL
     ```

     Windows (use *Node.js command line** from Start menu)

     ```batch
     set FORGE_WEBHOOKS=YOUR_FORGE_WEBHOOK_URL
     ```

  10. Go on the terminal and compile typescript code by running the command **tsc** from both /src/client and /src/server folders.

**Note**: If you do not want to set environment variables, edit the src/server/server/app-settings.ts file and replace the placeholders by the values listed above.
