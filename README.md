# IOTA Sandbox

## Installation

1. Follow the instructions to build [ccurl](https://github.com/iotaledger/ccurl), and put `build/lib/libccurl.so`
   anywhere you like.
1. Copy the `.env.template` file to `.env` and fill in the missing configuration parameters. `CCURL_PATH` is the path to
   the folder containing `libccurl.so`.

## Running for Local Development

Recommended:

* In VSCode, choose from the avaliable configurations.

Otherwise:

* Run `node src/worker/index.js` (currently only the worker node is available).

## Running in local production environment

* Install [minikube](https://github.com/kubernetes/minikube)
* Start minikube and allow it's docker engine to run as an insecure registry:

```
$ minikube start --insecure-registry 192.168.99.100:5000
```

* [Download](https://console.cloud.google.com/apis/credentials/serviceaccountkey) your Google Cloud credentials file
  (click `Service account` > `New service account`)
* Install the credentials as a secret in kubernetes:

```
$ kubectl create secret generic gcloud --from-file /path/to/gcloud-credentials.json
```

* Copy the environment file

```
$ mv .env.minikube .env
```

* Configure `.env` to match the name of the credentials file (`gcloud-credentials.json` above) and your project name.

* Set your shell to use the minikube docker environment: (this step must be done any time you rebuild the docker image
  in a new shell)

```
$ eval $(minikube docker-env)
```

* Build the docker image:

```
$ docker build -f Dockerfile.worker -t sandbox-worker:alpha .
```

* Create the kubernetes deployment:

```
$ kubectl create -f sandbox.yml
```

* Test your deployment by sending the contents of `src/worker/sample.json` as a message via the Google Cloud Pub/Sub
  console
* You should see the results in the container's logs:

```
$ kubectl logs sandbox-js-XXXXXXXXXXX
```

* Stop the deployment and/or shut down minikube

```
$ kubectl delete deployment sandbox-js
$ minikube stop
```

## Deploying for Production

// TODO

```

```
