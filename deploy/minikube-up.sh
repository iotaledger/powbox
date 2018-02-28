#/bin/bash

NAMESPACE=sandbox

if [ $(minikube status | grep "minikube: Running" -c) -eq 0 ]
then
    minikube start --insecure-registry 192.168.99.100:5000
fi

eval $(minikube docker-env)
docker build -f Dockerfile.worker -t sandbox-worker:alpha .
docker build -f Dockerfile.api -t sandbox-api:alpha .
kubectl create -f deploy/rabbit-controller.yml --namespace=$NAMESPACE
kubectl create -f deploy/rabbit-service.yml --namespace=$NAMESPACE
kubectl create -f deploy/api.yml --namespace=$NAMESPACE
kubectl create -f deploy/worker.yml --namespace=$NAMESPACE
kubectl expose deployment sandbox-api --type="LoadBalancer" --port=3000 --namespace=$NAMESPACE
minikube service sandbox-api --url --namespace=$NAMESPACE
