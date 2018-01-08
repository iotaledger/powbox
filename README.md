# IOTA Sandbox

## Development with docker:

The easiest way to get up and running is with `docker-compose`:

```
docker-compose build && docker-compose up
```

For development, it is easiest to run rabbitmq & mongodb separately:

```
docker-compose run -d -p 5672:5672 rabbitmq
docker-compose run -d -p 27017:27017 mongodb
```

Copy the file `.env.template` to `.env`, and set the appropriate environment configuration variables. Then use node
directly to run the code, either with `npm run` (see `package.json` for details), or using one of the provided VSCode
launch configurations.

## Testing in the production environment:

This is a slightly more complicated setup, but allows for testing in the production environment from your local
computer. These steps are available in `deploy/minikube-up.sh` if you don't want to run them manually.

* Install [minikube](https://github.com/kubernetes/minikube)
* Start minikube and allow its docker engine to run as an insecure registry:

```
minikube start --insecure-registry 192.168.99.100:5000
```

* Set your shell to use the minikube docker environment: (this step must be done any time you rebuild the docker image
  in a new shell)

```
eval $(minikube docker-env)
```

* Build the docker images:

```
docker build -f Dockerfile.worker -t sandbox-worker:alpha .
docker build -f Dockerfile.api -t sandbox-api:alpha .
```

* Create the kubernetes deployment and expose it to minikube:

```
kubectl create -f deploy/rabbit-controller.yml
kubectl create -f deploy/rabbit-service.yml
kubectl create -f deploy/api.yml
kubectl create -f deploy/worker.yml
kubectl expose deployment sandbox-api --type="LoadBalancer" --port=3000
```

* Finally, get the sandbox API URL from minikube:

```
minikube service sandbox-api --url
```

* Test your deployment by using the included Postman collections
* You should see the results in the container's logs:

```
kubectl logs sandbox-js-XXXXXXXXXXX
```

* Stop the deployment and/or shut down minikube

```
sh deploy/minikube-down.sh
```

## Deploying for Production

Build the docker images and push them to a remote container registry. Make sure `kubectl` is connected to your cloud
kubernetes cluster, and run the `kubectl` commands as directed above.

For the front-end client (docs and GitHub OAuth tool), make sure you run the API process with the environment variable:

```
NODE_ENV=production
```
