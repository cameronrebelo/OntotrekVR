import { defineConfig } from "vite"

export default defineConfig({
    server:{
        https: {

            key:'./ontotrekvr-privateKey.key',
            cert:'./ontotrekvr.crt',
        }
    },
})
