# Chapter 2 : Modules and Toolkit
## Install dependencies
install redis in windows, run `choco install redis-64`, run server with `redis-server`, run client with `redis-cli`
install hydra command-line tools, run `sudo npm install -g yo generator-fwsp-hydra hydra-cli`
run `yo fwsp-hydra` using admin powershell access
type `hello` on name of service
cd `hello-service/`
run `npm install`
run `npm start`
open IP:PORT, and try open IP:PORT/v1/hello as stated in `hello-service.js`


# Chapter 2 : Building Microservices to handle image processing use case
Test, run `curl -X POST -H 'Content-Type: image/png' \     --data-binary @example.png \     http://localhost:3000/uploads/example.png`


## Reference
- https://www.packtpub.com/web-development/hands-microservices-nodejs
